/**
 * Represents the resolved textual content of a single table cell.
 */
export type Cell = string;

/**
 * Plain array capturing the content of a body row, aligned with the header structure.
 */
export type BodyRow = Cell[];

/**
 * Plain array capturing the content of a header row after colspan/rowspan resolution.
 */
export type HeaderRow = Cell[];
