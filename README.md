# Cypress Tables

Type-safe helpers for querying HTML tables in Cypress tests. The utilities expose Cypress-friendly APIs that integrate with the command queue while keeping the same parsing behaviour (header resolution, rowspan/colspan handling, JSON conversion, etc.).

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

		table
			.getMainHeaderRow()
			.should("deep.equal", ["First name", "Last name", "Date of birth"]);
		table.getJson().should("deep.equal", [
			{
				"First name": "John",
				"Last name": "Doe",
				"Date of birth": "01-01-1990",
			},
			{
				"First name": "Anne",
				"Last name": "Banne",
				"Date of birth": "01-01-200",
			},
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

---

## Package API's: Methods and Examples

### 1. `getHeaderRows`

Retrieves all header rows of the table. Works with colspan and rowspan. Every extra colspan of the same cell gets a counting postfix \_\_C

#### Example:

HTML Table:

<table>
  <thead>
    <tr>
      <th rowspan="2">Employee</th>
      <th>First Name</th>
      <th>Last Name</th>
    </tr>
    <tr>
    <th colspan="2" style="text-align: center;">Full Name</th>
    </tr>
  </thead>
</table>

Code:

```ts
const table = new CypressTable("table");
const headers = table.getHeaderRows();
console.log(headers);
```

Output:

```json
[
	["Employee", "First Name", "Last Name"],
	["Employee", "Full Name", "Full Name__C1"]
]
```

---

### 2. `getMainHeaderRow`

Retrieves the main header row (default is the last row).

#### Example:

HTML Table:

<table>
  <thead>
    <tr>
      <th colspan="2" style="text-align: center;">Full Name</th>
    </tr>
    <tr>
      <th>First Name</th>
      <th>Last Name</th>
    </tr>
  </thead>
</table>

Code:

```ts
const table = new CypressTable("table");
const mainHeader = table.getMainHeaderRow();
console.log(mainHeader);
// Output: ["First Name", "Last Name"]
```

---

### 3. `getBodyRows`

Retrieves all body rows of the table.

#### Example:

HTML Table:

<table>
  <tbody>
    <tr>
      <td>John</td>
      <td>Doe</td>
    </tr>
    <tr>
      <td>Anne</td>
      <td>Banne</td>
    </tr>
  </tbody>
</table>

Code:

```ts
const table = new CypressTable("table");
const rows = table.getBodyRows();
console.log(rows);
// Output: [["John", "Doe"], ["Anne", "Banne"]]
```

---

### 4. `getBodyCellLocator`

Retrieves a specific cell locator in the body of the table as `Cypress.Chainable`.

#### Example:

HTML Table:

<table>
  <tbody>
    <tr>
      <td>John</td>
      <td>Doe</td>
    </tr>
    <tr>
      <td>TAE</td>
      <td>Cerios</td>
    </tr>
  </tbody>
</table>

Code:

```ts
const table = new CypressTable("table");
table.getBodyCellLocator(1, 1).should("have.text", "Cerios");
```

---

### 5. `getBodyCellLocatorByRowConditions`

Retrieves a cell locator in the body of the table based on row conditions and a target header as `Cypress.Chainable`.

#### Example:

HTML Table:

<table>
  <thead>
    <tr>
      <th>First Name</th>
      <th>Last Name</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John</td>
      <td>Doe</td>
    </tr>
    <tr>
      <td>Anne</td>
      <td>Banne</td>
    </tr>
  </tbody>
</table>

Code:

```ts
const table = new CypressTable("table");
table
	.getBodyCellLocatorByRowConditions({ "First Name": "Anne" }, "Last Name")
	.should("have.text", "Banne");
```

---

### 6. `getAllBodyCellLocatorsByHeaderName`

Retrieves all cell locators in the body of the table for a specific header name as `Cypress.Chainable`.

#### Example:

HTML Table:

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Company</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Joe</td>
      <td>Cerios</td>
    </tr>
    <tr>
      <td>Anne Banne</td>
      <td>Cerios</td>
    </tr>
  </tbody>
</table>

Code:

```ts
const table = new CypressTable("table");
table.getAllBodyCellLocatorsByHeaderName("Company").then(locators => {
	expect(locators).to.have.length(2);
	locators.forEach(locator => locator.should("have.text", "Cerios"));
});
```

---

### 7. `getAllBodyCellLocatorsByHeaderIndex`

Retrieves all cell locators in the body of the table for a specific header index.

#### Example:

HTML Table:

<table>
  <thead>
    <tr>
      <th>First Name</th>
      <th>Last Name</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John</td>
      <td>Doe</td>
    </tr>
    <tr>
      <td>Anne</td>
      <td>Banne</td>
    </tr>
  </tbody>
</table>

Code:

```ts
const table = new CypressTable("table");
table.getAllBodyCellLocatorsByHeaderIndex(1).then(locators => {
	for (const locator of locators) {
		locator.invoke("prop", "innerText").then(text => {
			console.log(text);
		});
		// Output: ["Doe", "Banne"]
	}
});
```

---

### 8. `getJson`

Converts the table data into a JSON object.

#### Example:

HTML Table **SIMPLE**:

<table>
  <thead>
    <tr>
      <th>id</th>
      <th>name</th>
      <th>yearOfBirth</th>
    </tr>
  </thead>
  <tbody>
    <tr>
        <td>1</td>
        <td>John</td>
        <td>1990</td>
    </tr>
    <tr>
        <td>2</td>
        <td>Anne</td>
        <td>2000</td>
    </tr>
  </tbody>
</table>

Code:

```ts
const table = new CypressTable("table");
const json = table.getJson();
console.log(json);
```

Output:

```json
[
	{
		"id": 1,
		"name": "John",
		"yearOfBirth": 1990
	},
	{
		"id": 2,
		"name": "Anne",
		"yearOfBirth": 2000
	}
]
```

#### Example:

HTML Table **COMPLEX**:

<table>
  <thead>
    <tr>
      <th rowspan="2">Awesome Rowspan</th>
      <th>Very Duplicate</th>
      <th colspan="3">Mega colspan</th>
      <th></th>
      <th></th>
      <th>Very Duplicate</th>
    </tr>
  </thead>
  <tbody>
    <tr>
        <td></td>
        <td>John</td>
        <td>Doe</td>
        <td>Test</td>
        <td>Automator</td>
        <td>At</td>
        <td>Cerios</td>
        <td>!</td>
    </tr>
  </tbody>
</table>

Code:

```ts
const table = new CypressTable("table");
const json = await table.getJson();
console.log(json);
```

Output:

```json
[
	{
		"Awesome Rowspan": "",
		"Very Duplicate": "John",
		"Mega colspan": "Doe",
		"Mega colspan__C1": "Test",
		"Mega colspan__C2": "Automator",
		"{{Empty}}": "At",
		"{{Empty}}__D1": "Cerios",
		"Very Duplicate__D1": "!"
	}
]
```

---

### 9. `waitForHeaderRows`

Waits for the header rows to be loaded.

#### Example:

```ts
const table = new CypressTable("table");
table.waitForHeaderRows({ timeout: 5000 });
```

---

### 10. `waitForBodyRows`

Waits for the body rows to be loaded.

#### Example:

```ts
const table = new CypressTable("table");
table.waitForBodyRows({ timeout: 5000 });
```

---

## Advanced Options

You can customize the behavior of the table parsing by passing options to the `PlaywrightTable` constructor. For example:

```ts
const table = new CypressTable("table", {
	header: {
		rowSelector: ".custom-header-row",
		columnSelector: ".custom-header-cell",
	},
	row: {
		rowSelector: ".custom-body-row",
		columnSelector: ".custom-body-cell",
	},
});
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Development & Testing

```bash
npm install
npm run build        # typecheck & compile to dist/
npm run serve        # static test fixture host (http://localhost:3000)
npm run test         # cypress run --headless
npm run test:open    # interactive Cypress runner
```

The `demo-html` directory contains the same fixtures that ship with the Cypress tests. Run `npm run serve` in one terminal and `npm run test` or `npm run test:open` in another to execute the suite.
