/**
 * Identifies which table sections are being queried so messaging can be more specific.
 */
export enum RowKind {
	/** Represents table header rows (e.g. `thead > tr`). */
	Header = "header",
	/** Represents table body rows (e.g. `tbody > tr`). */
	Body = "body",
}

/**
 * Options that control how many rows and cells must be present before the wait resolves.
 */
export type WaitForTableRowsOptions = {
	/** Maximum time in milliseconds to keep retrying the underlying DOM query. */
	timeout?: number;
	row?: {
		/** Exact number of rows that must be present for the wait to succeed. */
		amount?: number;
		cell?: {
			/** Expected number of cells each row should contain. */
			totalCount?: number;
			/** Expected number of cells containing non-empty textual content. */
			contentCount?: number;
		};
	};
};

/**
 * Shared waiting logic that verifies tables are populated before continuing the Cypress chain.
 */
export abstract class TableWait {
	/**
	 * Waits for table rows matching the provided selector and asserts that the expected structure is present.
	 *
	 * @param table - Chainable pointing at the `<table>` element to inspect.
	 * @param rowSelector - Selector used to locate the target rows (`thead > tr`, `tbody > tr`, etc.).
	 * @param cellSelector - Selector used to locate cells inside the matched rows.
	 * @param rowKind - Identifies the table region for clearer assertion failures.
	 * @param options - Optional assertions controlling row and cell counts or timeout behaviour.
	 * @returns A chainable subject containing the matched rows once all assertions pass.
	 */
	static waitForRows(
		table: Cypress.Chainable<JQuery<HTMLTableElement>>,
		rowSelector: string,
		cellSelector: string,
		rowKind: RowKind,
		options?: WaitForTableRowsOptions
	): Cypress.Chainable<JQuery<HTMLElement>> {
		const hasRetryTimeout = !!options?.timeout && options.timeout > 0;
		const queryTimeout = options?.timeout ?? 0;
		/**
		 * Executes the structural assertions on the located rows.
		 */
		const evaluate = ($rows: JQuery<HTMLElement>): JQuery<HTMLElement> => {
			const rows = Array.from($rows, row => row as Element);

			if (options?.row?.amount !== undefined) {
				expect(rows.length, `Expected ${options.row.amount} ${rowKind} rows, but found ${rows.length}`).to.eq(
					options.row.amount
				);
			} else {
				expect(rows.length, `No ${rowKind} rows found`).to.be.greaterThan(0);
			}

			const rowsWithContent = rows.filter(row => {
				const cells = Array.from(row.querySelectorAll(cellSelector));
				return cells.some(cell => (cell.textContent ?? "").trim().length > 0);
			});

			if (options?.row?.cell?.totalCount !== undefined) {
				const expected = options.row.cell.totalCount;
				const rowsWithMatchingCells = rows.filter(row => row.querySelectorAll(cellSelector).length === expected);
				expect(
					rowsWithMatchingCells.length,
					`Expected amount of ${expected} ${rowKind} cells for row not found`
				).to.be.greaterThan(0);
			}

			if (options?.row?.cell?.contentCount !== undefined) {
				const expected = options.row.cell.contentCount;
				const rowsWithMatchingContent = rows.filter(row => {
					const cells = Array.from(row.querySelectorAll(cellSelector));
					const contentCells = cells.filter(cell => (cell.textContent ?? "").trim().length > 0);
					return contentCells.length === expected;
				});
				expect(
					rowsWithMatchingContent.length,
					`Expected amount of ${expected} ${rowKind} cells with content for row not found`
				).to.be.greaterThan(0);
			} else {
				expect(rowsWithContent.length, `No ${rowKind} cells with content found`).to.be.greaterThan(0);
			}

			return $rows;
		};

		const query = table.find(rowSelector, { timeout: queryTimeout });

		if (hasRetryTimeout) {
			return query.should($rows => {
				evaluate($rows);
			});
		}

		return query.then($rows => evaluate($rows));
	}
}
