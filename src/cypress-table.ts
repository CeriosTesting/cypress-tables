import { BodyRow, Cell, HeaderRow } from "./row";
import { TableBody } from "./table-body";
import { HeaderRowOptions, TableHeader } from "./table-header";
import { CellContentType } from "./cell-content-type";
import { RowKind, TableWait, WaitForTableRowsOptions } from "./table-wait";

/**
 * Configuration used when resolving table data or locators lazily within Cypress chains.
 */
export type LoadOptions = {
	/** Custom timeout passed to Cypress commands when locating table elements. */
	timeout?: number;
	/** Header parsing options forwarded to the header extractor. */
	headerRowOptions?: HeaderRowOptions;
	/** Body parsing options forwarded to the body extractor. */
	bodyRowOptions?: {
		/** Overrides the content extraction strategy for body cells. */
		cellContentType?: CellContentType;
	};
};

/**
 * High-level API around an HTML table that exposes convenient Cypress-based helpers.
 */
export class CypressTable {
	private headers: HeaderRow[] = [];
	private rows: BodyRow[] = [];

	/**
	 * Creates a new table helper instance.
	 *
	 * @param tableLocator - Either a selector string or a prelocated Cypress chainable for the target table.
	 * @param options - Optional selectors and configuration tweaks for headers and body rows.
	 */
	constructor(
		private readonly tableLocator:
			| string
			| Cypress.Chainable<JQuery<HTMLTableElement>>,
		private readonly options?: {
			/** Overrides for header selection and indexing behaviour. */
			header?: {
				/** Index of the header row to treat as the main header (defaults to last row). */
				setMainHeaderRow?: number;
				/** Selector used to locate header rows. */
				rowSelector?: string;
				/** Selector used to locate header columns. */
				columnSelector?: string;
			};
			/** Overrides for body row and cell selection behaviour. */
			row?: {
				/** Selector used to locate body rows. */
				rowSelector?: string;
				/** Selector used to locate body cells. */
				columnSelector?: string;
			};
		}
	) {}

	/**
	 * Loads the table and returns a deep copy of all header rows.
	 *
	 * @param options - Optional load configuration such as timeouts or parsing options.
	 * @returns Chainable emitting cloned header rows for safe reuse in tests.
	 */
	getHeaderRows(options?: LoadOptions): Cypress.Chainable<HeaderRow[]> {
		return this.load(options).then(() => this.headers.map(row => [...row]));
	}

	/**
	 * Returns the main header row, respecting any configured override.
	 *
	 * @param options - Optional load configuration.
	 * @returns Chainable emitting the selected header row clone.
	 */
	getMainHeaderRow(options?: LoadOptions): Cypress.Chainable<HeaderRow> {
		return this.load(options).then(() => [...this.mainHeaderRow()]);
	}

	/**
	 * Loads the table body and yields deep copies of every parsed row.
	 *
	 * @param options - Optional load configuration.
	 * @returns Chainable emitting cloned body rows.
	 */
	getBodyRows(options?: LoadOptions): Cypress.Chainable<BodyRow[]> {
		return this.load(options).then(() => this.rows.map(row => [...row]));
	}

	/**
	 * Produces a locator for a specific body cell identified by row and header index.
	 *
	 * @param rowIndex - Zero-based body row index.
	 * @param headerIndex - Zero-based column index aligned to the main header row.
	 * @param options - Optional load configuration.
	 * @returns Chainable resolving to the requested cell element.
	 */
	getBodyCellLocator(
		rowIndex: number,
		headerIndex: number,
		options?: LoadOptions
	): Cypress.Chainable<JQuery<HTMLElement>> {
		return this.load(options).then(() =>
			this.getBodyCellLocatorInternal(rowIndex, headerIndex, options)
		);
	}

	/**
	 * Locates a body cell by matching the values of one or more other columns in the same row.
	 *
	 * @param conditions - Key/value pairs where the key is a header label and the value is the expected cell text or regex.
	 * @param targetHeader - Header name identifying the column to return.
	 * @param options - Optional load configuration.
	 * @returns Chainable resolving to the matching cell element.
	 * @throws When the conditions or target headers cannot be resolved or no row matches.
	 */
	getBodyCellLocatorByRowConditions(
		conditions: Record<string, string | RegExp>,
		targetHeader: string,
		options?: LoadOptions
	): Cypress.Chainable<JQuery<HTMLElement>> {
		return this.load(options).then(() => {
			const headers = this.mainHeaderRow();
			const targetHeaderIndex = headers.indexOf(targetHeader);
			if (targetHeaderIndex === -1) {
				throw new Error(`Header "${targetHeader}" not found.`);
			}

			for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
				const row = this.rows[rowIndex];
				let matches = true;

				for (const [conditionHeader, value] of Object.entries(conditions)) {
					const headerIndex = headers.indexOf(conditionHeader);
					if (headerIndex === -1) {
						throw new Error(`Header "${conditionHeader}" not found.`);
					}

					const cellValue = row[headerIndex] ?? "";
					if (value instanceof RegExp) {
						if (!value.test(cellValue)) {
							matches = false;
							break;
						}
					} else if (cellValue !== value) {
						matches = false;
						break;
					}
				}

				if (matches) {
					return this.getBodyCellLocatorInternal(
						rowIndex,
						targetHeaderIndex,
						options
					);
				}
			}

			throw new Error(
				`No row found matching conditions: ${JSON.stringify(conditions)}`
			);
		});
	}

	/**
	 * Returns locators for all cells of a body column identified by header name.
	 *
	 * @param header - Header text identifying the target column.
	 * @param options - Optional load configuration.
	 * @returns Chainable emitting an array of chainables, each pointing at the cell for an individual row.
	 */
	getAllBodyCellLocatorsByHeaderName(
		header: string,
		options?: LoadOptions
	): Cypress.Chainable<Cypress.Chainable<JQuery<HTMLElement>>[]> {
		return this.load(options).then(() => {
			const headers = this.mainHeaderRow();
			const headerIndex = headers.indexOf(header);
			if (headerIndex === -1) {
				throw new Error(`Header "${header}" not found.`);
			}

			return this.rows.map((_, rowIndex) =>
				this.getBodyCellLocatorInternal(rowIndex, headerIndex, options)
			);
		});
	}

	/**
	 * Returns locators for all cells of a body column identified by its index.
	 *
	 * @param headerIndex - Zero-based column index.
	 * @param options - Optional load configuration.
	 * @returns Chainable emitting an array of chainables for each cell in the column.
	 */
	getAllBodyCellLocatorsByHeaderIndex(
		headerIndex: number,
		options?: LoadOptions
	): Cypress.Chainable<Cypress.Chainable<JQuery<HTMLElement>>[]> {
		return this.load(options).then(() => {
			return this.rows.map((_, rowIndex) =>
				this.getBodyCellLocatorInternal(rowIndex, headerIndex, options)
			);
		});
	}

	/**
	 * Produces a JSON representation of the table body where headers map to cell values.
	 *
	 * @param options - Optional load configuration.
	 * @returns Chainable resolving to an array of row objects keyed by header name.
	 */
	getJson(options?: LoadOptions): Cypress.Chainable<Record<string, Cell>[]> {
		return this.load({
			timeout: options?.timeout,
			bodyRowOptions: options?.bodyRowOptions,
			headerRowOptions: {
				colspan: {
					enabled: options?.headerRowOptions?.colspan?.enabled ?? true,
					suffix: options?.headerRowOptions?.colspan?.suffix ?? true,
				},
				duplicateSuffix: options?.headerRowOptions?.duplicateSuffix ?? true,
				emptyCellReplacement:
					options?.headerRowOptions?.emptyCellReplacement ?? true,
			},
		}).then(() => {
			const headers = this.mainHeaderRow();
			return this.rows.map(row => {
				const result: Record<string, Cell> = {};
				headers.forEach((header, index) => {
					result[header] = row[index] ?? "";
				});
				return result;
			});
		});
	}

	/**
	 * Waits for header rows to meet the provided expectations before continuing.
	 *
	 * @param options - Optional wait assertions such as explicit timeouts or expected counts.
	 * @returns Chainable resolving to the matched header rows.
	 */
	waitForHeaderRows(
		options?: WaitForTableRowsOptions
	): Cypress.Chainable<JQuery<HTMLElement>> {
		const timeout = options?.timeout ?? Cypress.config("defaultCommandTimeout");
		const waitOptions: WaitForTableRowsOptions = { ...options, timeout };
		return TableWait.waitForRows(
			this.resolveTable(timeout),
			this.headerRowSelector,
			this.headerColumnSelector,
			RowKind.Header,
			waitOptions
		);
	}

	/**
	 * Waits for body rows to meet the provided expectations before continuing.
	 *
	 * @param options - Optional wait assertions such as explicit timeouts or expected counts.
	 * @returns Chainable resolving to the matched body rows.
	 */
	waitForBodyRows(
		options?: WaitForTableRowsOptions
	): Cypress.Chainable<JQuery<HTMLElement>> {
		const timeout = options?.timeout ?? Cypress.config("defaultCommandTimeout");
		const waitOptions: WaitForTableRowsOptions = { ...options, timeout };
		return TableWait.waitForRows(
			this.resolveTable(timeout),
			this.bodyRowSelector,
			this.bodyColumnSelector,
			RowKind.Body,
			waitOptions
		);
	}

	/**
	 * Loads the table headers and body, caching the parsed data for subsequent calls.
	 *
	 * @param options - Optional load configuration passed to the parsing helpers.
	 * @returns Chainable that settles once both headers and body rows are parsed and cached.
	 */
	private load(options?: LoadOptions): Cypress.Chainable<JQuery<HTMLElement>> {
		const timeout = options?.timeout ?? Cypress.config("defaultCommandTimeout");
		const waitOptions: WaitForTableRowsOptions = { timeout };

		return TableWait.waitForRows(
			this.resolveTable(timeout),
			this.headerRowSelector,
			this.headerColumnSelector,
			RowKind.Header,
			waitOptions
		)
			.then($headerRows => {
				const headerElements = Array.from($headerRows, row => row as Element);
				this.headers = TableHeader.getRows(
					headerElements,
					this.headerColumnSelector,
					options?.headerRowOptions
				);
			})
			.then(() =>
				TableWait.waitForRows(
					this.resolveTable(timeout),
					this.bodyRowSelector,
					this.bodyColumnSelector,
					RowKind.Body,
					waitOptions
				)
			)
			.then($bodyRows => {
				const bodyElements = Array.from($bodyRows, row => row as Element);
				this.rows = TableBody.getRows(
					bodyElements,
					this.bodyColumnSelector,
					options?.bodyRowOptions
				);
			});
	}

	/**
	 * Internal helper that returns a locator for a specific body cell.
	 *
	 * @param rowIndex - Body row index to target.
	 * @param headerIndex - Column index relative to the header.
	 * @param options - Optional load configuration.
	 * @returns Chainable locator for the requested cell.
	 */
	private getBodyCellLocatorInternal(
		rowIndex: number,
		headerIndex: number,
		options?: LoadOptions
	): Cypress.Chainable<JQuery<HTMLElement>> {
		if (headerIndex < 0) {
			throw new Error(`Header index ${headerIndex} must be zero or greater.`);
		}

		if (rowIndex < 0 || rowIndex >= this.rows.length) {
			throw new Error(`Row index ${rowIndex} is out of bounds.`);
		}

		const timeout = options?.timeout;
		const table = this.resolveTable(timeout);
		const rows =
			timeout !== undefined
				? table.find(this.bodyRowSelector, { timeout })
				: table.find(this.bodyRowSelector);
		const row = rows.eq(rowIndex);
		const cells =
			timeout !== undefined
				? row.find(this.bodyColumnSelector, { timeout })
				: row.find(this.bodyColumnSelector);
		return cells.eq(headerIndex);
	}

	/**
	 * Resolves the base table element as a Cypress chainable, regardless of the original locator type.
	 *
	 * @param timeout - Optional timeout override for locating the table.
	 * @returns Chainable targeting the table element.
	 */
	private resolveTable(
		timeout?: number
	): Cypress.Chainable<JQuery<HTMLTableElement>> {
		if (typeof this.tableLocator === "string") {
			if (timeout !== undefined) {
				return cy.get(this.tableLocator, { timeout });
			}
			return cy.get(this.tableLocator);
		}

		return this.tableLocator.then($table => cy.wrap($table, { log: false }));
	}

	/**
	 * Determines the header row that should be considered the "main" header for indexing.
	 *
	 * @returns The header row used for column lookup.
	 */
	private mainHeaderRow(): HeaderRow {
		if (this.options?.header?.setMainHeaderRow !== undefined) {
			return this.headers[this.options.header.setMainHeaderRow];
		}
		return this.headers[this.headers.length - 1];
	}

	/**
	 * Selector used to locate header rows, respecting overrides if provided.
	 */
	private get headerRowSelector(): string {
		return this.options?.header?.rowSelector ?? "thead>tr";
	}

	/**
	 * Selector used to locate header cells, respecting overrides if provided.
	 */
	private get headerColumnSelector(): string {
		return this.options?.header?.columnSelector ?? "th";
	}

	/**
	 * Selector used to locate body rows, respecting overrides if provided.
	 */
	private get bodyRowSelector(): string {
		return this.options?.row?.rowSelector ?? "tbody>tr";
	}

	/**
	 * Selector used to locate body cells, respecting overrides if provided.
	 */
	private get bodyColumnSelector(): string {
		return this.options?.row?.columnSelector ?? "td";
	}
}
