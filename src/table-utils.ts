import { CellContentType } from "./cell-content-type";

/**
 * Helper utilities shared by the various table parsing helpers.
 */
export abstract class TableUtils {
	/**
	 * Extracts the textual content from a table cell using the requested DOM API and trims the result.
	 *
	 * @param element - The cell element to read.
	 * @param cellContentType - Determines whether `textContent` or `innerText` is used.
	 * @returns The trimmed textual content of the element.
	 */
	static getCellContent(
		element: Element,
		cellContentType: CellContentType
	): string {
		const content =
			cellContentType === CellContentType.InnerText
				? (element as HTMLElement).innerText
				: element.textContent;
		return content?.trim() ?? "";
	}

	/**
	 * Reads the `rowspan` and `colspan` attributes from a cell and converts them into numeric values.
	 *
	 * @param element - The element that might define span attributes.
	 * @returns A normalized span definition where missing or invalid values default to `1`.
	 */
	static parseSpanAttributes(element: Element): {
		rowspan: number;
		colspan: number;
	} {
		const rowspan = parseInt(element.getAttribute("rowspan") ?? "1", 10);
		const colspan = parseInt(element.getAttribute("colspan") ?? "1", 10);
		return {
			rowspan: Number.isNaN(rowspan) ? 1 : rowspan,
			colspan: Number.isNaN(colspan) ? 1 : colspan,
		};
	}
}
