/**
 * Determines which DOM API is used when extracting textual content from table cells.
 * Use `textContent` to read the raw text value without layout influence.
 * Use `innerText` to respect layout and CSS when reading text values.
 */
export enum CellContentType {
	TextContent = "textContent",
	InnerText = "innerText",
}
