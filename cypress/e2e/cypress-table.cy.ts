import { CypressTable, CellContentType } from "../../src";
import { Route } from "../../demo-html/routes";

import expectedSimpleTable from "cypress/fixtures/simple-table.json";
import expectedRowspanRowTable from "cypress/fixtures/rowspan-row-table.json";
import expectedDynamicTable from "cypress/fixtures/dynamic-table.json";
import expectedDivTable from "cypress/fixtures/div-table.json";
import expectedCellContentType from "cypress/fixtures/cell-content-type.json";
import expectedTableData from "cypress/fixtures/expected-table-data.json";

const cellContentTypes = [
	CellContentType.TextContent,
	CellContentType.InnerText,
];

describe("CypressTable functionality", () => {
	describe("getHeaderRow functionality", () => {
		it("getMainHeaderRow should return headers used for table", () => {
			cy.visit(Route.SimpleTable);
			const table = new CypressTable("table");
			table
				.getMainHeaderRow()
				.should("deep.equal", expectedTableData.mainHeadersRow);
		});

		it("getHeaderRows should return header rows", () => {
			cy.visit(Route.RowspanHeaderTable);
			const table = new CypressTable("table");
			table
				.getHeaderRows({ headerRowOptions: { colspan: { enabled: false } } })
				.should("deep.equal", expectedTableData.headerRows);
		});
	});

	describe("getBodyRows functionality", () => {
		it("getBodyRows should return body rows", () => {
			cy.visit(Route.SimpleTable);
			const table = new CypressTable("table");
			table.getBodyRows().should("deep.equal", expectedTableData.bodyRows);
		});

		it("getBodyRows should only return strings", () => {
			cy.visit(Route.PrimitivesTable);
			const table = new CypressTable("table");
			table.getBodyRows().then(rows => {
				rows.forEach(row => {
					row.forEach(cell => {
						expect(cell).to.be.a("string");
					});
				});
			});
		});
	});

	describe("getJson functionality", () => {
		it("getJson should return json", () => {
			cy.visit(Route.SimpleTable);
			const table = new CypressTable("table");
			table.getJson().should("deep.equal", expectedSimpleTable);
		});

		it("getJson should handle rowspan correctly", () => {
			cy.visit(Route.RowspanRowTable);
			const table = new CypressTable("table");
			table.getJson().should("deep.equal", expectedRowspanRowTable);
		});

		expectedCellContentType.forEach((testCase, index) => {
			it(testCase.description, () => {
				cy.visit(Route.InnerTextTable);
				const table = new CypressTable("table");
				table
					.getJson({
						bodyRowOptions: { cellContentType: cellContentTypes[index] },
						headerRowOptions: { colspan: { enabled: false } },
					})
					.should("deep.equal", testCase.expected);
			});
		});
	});

	it("getBodyCellLocator should return locator", () => {
		cy.visit(Route.ButtonTable);
		const table = new CypressTable("table");
		table.getBodyCellLocator(0, 0).should("contain.text", "Row 1");
		table.getBodyCellLocator(2, 1).should("contain.text", "");
		table.getBodyCellLocator(2, 1).should("contain.html", "button");
	});

	it("getBodyCellLocatorByRowConditions should return locator", () => {
		cy.visit(Route.ButtonTable);
		const table = new CypressTable("table");
		table.getBodyRows().should("have.length", 3);
		table
			.getBodyCellLocatorByRowConditions({ Rownumber: "Row 2" }, "Delete?")
			.find("input[type='button']")
			.click();
		table.getBodyRows().should("have.length", 2);
	});

	it("getAllBodyCellLocatorsByHeaderName should return locators", () => {
		cy.visit(Route.ButtonTable);
		const table = new CypressTable("table");
		table.getAllBodyCellLocatorsByHeaderName("Delete?").then(locators => {
			expect(locators).to.have.length(3);
			locators.reverse().forEach(locator => {
				locator.find("input[type='button']").click();
			});
		});
		cy.get("#DeleteRowTable").then(() => {
			cy.get("tbody").should("not.be.visible");
		});
	});

	it("getAllBodyCellLocatorsByHeaderIndex returns locators", () => {
		cy.visit(Route.ButtonTable);
		const table = new CypressTable("table");
		table.getAllBodyCellLocatorsByHeaderIndex(1).then(locators => {
			expect(locators).to.have.length(3);
			locators.reverse().forEach(locator => {
				locator.find("input[type='button']").click();
			});
		});
		cy.get("#DeleteRowTable").then(() => {
			cy.get("tbody").should("not.be.visible");
		});
	});

	describe("dynamic table loading functionality", () => {
		it("should wait for table to contain text", () => {
			cy.visit(Route.DynamicLoadTable);
			const table = new CypressTable("table");
			table.getJson().should("deep.equal", expectedDynamicTable);
		});

		it("empty header rows should throw exception", () => {
			cy.visit(Route.EmptyHeaderRowsTable);
			const table = new CypressTable("table");
			cy.once("fail", error => {
				expect(error.message).to.include("No header cells with content found");
				return false;
			});
			table.getJson({ timeout: 1000 });
		});

		it("empty body rows should throw exception", () => {
			cy.visit(Route.EmptyBodyRowsTable);
			const table = new CypressTable("table");
			cy.once("fail", error => {
				expect(error.message).to.include("No body cells with content found");
				return false;
			});
			table.getJson({ timeout: 1000 });
		});

		it("no header rows should throw exception", () => {
			cy.visit(Route.EmptyHeaderRowsTable);
			const table = new CypressTable("table", {
				header: { rowSelector: "invalid" },
			});
			cy.once("fail", error => {
				expect(error.message).to.include("No header rows found");
				return false;
			});
			table.getJson({ timeout: 1000 });
		});

		it("no header row cells should throw exception", () => {
			cy.visit(Route.EmptyHeaderRowsTable);
			const table = new CypressTable("table", {
				header: { columnSelector: "invalid" },
			});
			cy.once("fail", error => {
				expect(error.message).to.include("No header cells with content found");
				return false;
			});
			table.getJson({ timeout: 1000 });
		});

		it("no body rows should throw exception", () => {
			cy.visit(Route.EmptyBodyRowsTable);
			const table = new CypressTable("table", {
				row: { rowSelector: "invalid" },
			});
			cy.once("fail", error => {
				expect(error.message).to.include("No body rows found");
				return false;
			});
			table.getJson({ timeout: 1000 });
		});

		it("no body row cells should throw exception", () => {
			cy.visit(Route.EmptyBodyRowsTable);
			const table = new CypressTable("table", {
				row: { columnSelector: "invalid" },
			});
			cy.once("fail", error => {
				expect(error.message).to.include("No body cells with content found");
				return false;
			});
			table.getJson({ timeout: 1000 });
		});
	});

	it("should support div based table structure", () => {
		cy.visit(Route.DivTable);
		const table = new CypressTable(
			".divTable",
			expectedTableData.divTableOptions
		);
		table.getJson().should("deep.equal", expectedDivTable);
	});
});
