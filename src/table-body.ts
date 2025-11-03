import { BodyRow, Cell } from "./row";
import { CellContentType } from "./cell-content-type";
import { TableUtils } from "./table-utils";

/**
 * Utilities that translate DOM table rows into plain data structures that are easier to assert on in Cypress.
 */
export abstract class TableBody {
	/**
	 * Builds body rows for the supplied DOM `<tr>` elements.
	 *
	 * @param rows - Raw DOM row elements in document order.
	 * @param columnSelector - Selector used to locate cell elements inside each row.
	 * @param options - Optional parsing configuration such as content extraction mode.
	 * @returns A list of parsed rows with column spans resolved.
	 */
	static getRows(
		rows: Element[],
		columnSelector: string,
		options?: {
			cellContentType?: CellContentType;
		}
	): BodyRow[] {
		const spannedCells: Record<number, Cell[]> = {};
		const bodyRows: BodyRow[] = [];

		rows.forEach((row, rowIndex) => {
			const columns = this.extractColumns(
				row,
				columnSelector,
				rowIndex,
				spannedCells,
				options?.cellContentType ?? CellContentType.InnerText
			);
			bodyRows.push(columns as BodyRow);
		});

		return bodyRows;
	}

	/**
	 * Extracts the column content for a single body row, honoring both colspans and rowspans.
	 *
	 * @param row - The row element that should be processed.
	 * @param columnSelector - Selector used to fetch the row's cell elements.
	 * @param rowIndex - Zero-based row index, required to track pending row spans.
	 * @param spannedCells - Mutable store for cells that span into future rows.
	 * @param cellContentType - Determines the DOM API used to read the cell text.
	 * @returns All cell values for the provided row.
	 */
	private static extractColumns(
		row: Element,
		columnSelector: string,
		rowIndex: number,
		spannedCells: Record<number, Cell[]>,
		cellContentType: CellContentType
	): Cell[] {
		const columns: Cell[] = [];
		const columnElements = Array.from(row.querySelectorAll(columnSelector));

		columnElements.forEach((column, columnIndex) => {
			this.processColumn(column, columnIndex, columns, rowIndex, spannedCells, cellContentType);
		});

		this.applySpannedCells(spannedCells, rowIndex, columns);

		return columns;
	}

	/**
	 * Processes a single column element, populating the target row and tracking spans.
	 *
	 * @param column - The cell element currently being handled.
	 * @param colIndex - Column index in the normalized output array.
	 * @param columns - Mutable list of cell values for the row being assembled.
	 * @param rowIndex - Index of the row being processed.
	 * @param spannedCells - Store used to propagate rowspan values to later rows.
	 * @param cellContentType - Content extraction strategy for this cell.
	 */
	private static processColumn(
		column: Element,
		colIndex: number,
		columns: Cell[],
		rowIndex: number,
		spannedCells: Record<number, Cell[]>,
		cellContentType: CellContentType
	): void {
		const content = TableUtils.getCellContent(column, cellContentType);
		const { rowspan, colspan } = TableUtils.parseSpanAttributes(column);

		for (let span = 0; span < colspan; span++) {
			columns[colIndex + span] = content;
		}

		if (rowspan > 1) {
			this.storeSpannedCells(rowIndex, colIndex, rowspan, content, spannedCells);
		}
	}

	/**
	 * Stores cell content that should appear in subsequent rows due to a rowspan.
	 *
	 * @param rowIndex - Index of the originating row.
	 * @param colIndex - Column index the spanned cell occupies.
	 * @param rowspan - Number of rows the cell should cover.
	 * @param content - Cell content that must be replicated.
	 * @param spannedCells - Store of pending rowspan data keyed by future row index.
	 */
	private static storeSpannedCells(
		rowIndex: number,
		colIndex: number,
		rowspan: number,
		content: Cell,
		spannedCells: Record<number, Cell[]>
	): void {
		for (let span = 1; span < rowspan; span++) {
			if (!spannedCells[rowIndex + span]) {
				spannedCells[rowIndex + span] = [];
			}
			spannedCells[rowIndex + span][colIndex] = content;
		}
	}

	/**
	 * Applies any pending row span values to the current row after its own columns were parsed.
	 *
	 * @param spannedCells - Registry of cells that are still spanning across rows.
	 * @param rowIndex - Index of the row currently being finalized.
	 * @param columns - Output array to merge row span values into.
	 */
	private static applySpannedCells(spannedCells: Record<number, Cell[]>, rowIndex: number, columns: Cell[]): void {
		const spans = spannedCells[rowIndex];
		if (!spans) {
			return;
		}

		spans.forEach((cell, index) => {
			if (cell !== undefined) {
				columns[index] = cell;
			}
		});
	}
}
