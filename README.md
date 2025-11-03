# Cypress Tables

Type-safe helpers for querying HTML tables in Cypress tests. The utilities mirror the Playwright-based implementation from this repository, but expose Cypress-friendly APIs that integrate with the command queue while keeping the same parsing behaviour (header resolution, rowspan/colspan handling, JSON conversion, etc.).

## Installation

```bash
npm install @cerios/cypress-tables
```

The package targets Cypress 13+. Types are emitted for both ESM and CommonJS consumers.

## Usage

```ts
// cypress/e2e/example.cy.ts
import { CypressTable } from "@cerios/cypress-tables";

describe("User table", () => {
	it("shows the right rows", () => {
		cy.visit("/simple-table");

		const table = new CypressTable("table");

		table.getMainHeaderRow().should("deep.equal", ["First name", "Last name", "Date of birth"]);
		table.getJson().should("deep.equal", [
			{ "First name": "Ronald", "Last name": "Veth", "Date of birth": "22-12-1987" },
			{ "First name": "Logan", "Last name": "Deacon", "Date of birth": "01-10-2002" },
		]);
	});
});
```

### Configuration

All selectors default to semantic table markup (`thead > tr`, `tbody > tr`, `th`, `td`). You can override them through the constructor, e.g. for `div`-based grids:

```ts
const table = new CypressTable(".divTable", {
	header: {
		rowSelector: ".divTableHeading > .divTableRow",
		columnSelector: ".divTableHead",
	},
	row: {
		rowSelector: ".divTableBody > .divTableRow",
		columnSelector: ".divTableCell",
	},
});
```

### Notable APIs

- `getHeaderRows(options?)` – resolves all header rows (duplicate suffixes, colspan suffixes, empty replacements, etc.).
- `getBodyRows(options?)` – extracts body rows, respecting rowspan/colspan and optional `CellContentType` parsing.
- `getJson(options?)` – maps the table body to JSON using the main header row.
- `getBodyCellLocator(rowIndex, headerIndex, options?)` – returns a `Cypress.Chainable<JQuery<HTMLElement>>` for a specific cell.
- `getBodyCellLocatorByRowConditions(conditions, targetHeader, options?)` – finds a cell by matching other header values in the same row.
- `getAllBodyCellLocatorsByHeaderName(header, options?)` – returns an array of chainables for an entire column.
- `waitForHeaderRows(options?)` / `waitForBodyRows(options?)` – declarative waiting with row/cell count assertions.

See the Playwright README in the repository root for full method descriptions; the Cypress version keeps method names and option shapes aligned.

## Development & Testing

```bash
npm install
npm run build        # typecheck & compile to dist/
npm run serve        # static test fixture host (http://localhost:3000)
npm run test         # cypress run --headless
npm run test:open    # interactive Cypress runner
```

The `demo-html` directory contains the same fixtures that ship with the Playwright tests. Run `npm run serve` in one terminal and `npm run test` or `npm run test:open` in another to execute the suite.
