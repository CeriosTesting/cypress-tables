import { CypressTable, CellContentType } from "../../src";
import { Route } from "../../demo-html/routes";

describe("CypressTable", () => {
	it("getMainHeaderRow returns headers used for table", () => {
		cy.visit(Route.SimpleTable);
		const table = new CypressTable("table");

		table.getMainHeaderRow().should("deep.equal", ["First name", "Last name", "Date of birth"]);
	});

	it("getHeaderRows returns header rows", () => {
		cy.visit(Route.RowspanHeaderTable);
		const table = new CypressTable("table");

		table.getHeaderRows({ headerRowOptions: { colspan: { enabled: false } } }).should("deep.equal", [
			["Average", "Average", "Age"],
			["Height", "Weight", "Height", "Weight", "Age"],
		]);
	});

	describe("getBodyRows", () => {
		it("returns body rows", () => {
			cy.visit(Route.SimpleTable);
			const table = new CypressTable("table");

			table.getBodyRows().should("deep.equal", [
				["Ronald", "Veth", "22-12-1987"],
				["Logan", "Deacon", "01-10-2002"],
			]);
		});

		it("should only return strings", () => {
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

	describe("getJson", () => {
		it("returns json", () => {
			cy.visit(Route.SimpleTable);
			const table = new CypressTable("table");

			table.getJson().should("deep.equal", [
				{
					"First name": "Ronald",
					"Last name": "Veth",
					"Date of birth": "22-12-1987",
				},
				{
					"First name": "Logan",
					"Last name": "Deacon",
					"Date of birth": "01-10-2002",
				},
			]);
		});

		it("handles rowspan correctly", () => {
			cy.visit(Route.RowspanRowTable);
			const table = new CypressTable("table");

			table.getJson().should("deep.equal", [
				{
					Month: "January",
					Savings: "100",
					"Savings for holiday!": "50",
				},
				{
					Month: "February",
					Savings: "80",
					"Savings for holiday!": "50",
				},
			]);
		});

		[
			{
				description: "CellContentType.TextContent returns the raw text content of the cell",
				cellContentType: CellContentType.TextContent,
				expected: [
					{
						id: "1",
						withoutStyling: "transform uppercase",
						withStyling: "transform uppercase",
					},
					{
						id: "2",
						withoutStyling: "TRANSFORM LOWERCASE",
						withStyling: "TRANSFORM LOWERCASE",
					},
				],
			},
			{
				description: "CellContentType.InnerText returns the rendered text content of the cell",
				cellContentType: CellContentType.InnerText,
				expected: [
					{
						id: "1",
						withoutStyling: "transform uppercase",
						withStyling: "TRANSFORM UPPERCASE",
					},
					{
						id: "2",
						withoutStyling: "TRANSFORM LOWERCASE",
						withStyling: "transform lowercase",
					},
				],
			},
		].forEach(testCase => {
			it(testCase.description, () => {
				cy.visit(Route.InnerTextTable);
				const table = new CypressTable("table");

				table
					.getJson({
						bodyRowOptions: { cellContentType: testCase.cellContentType },
						headerRowOptions: { colspan: { enabled: false } },
					})
					.should("deep.equal", testCase.expected);
			});
		});
	});

	it("getBodyCellLocator returns locator", () => {
		cy.visit(Route.ButtonTable);
		const table = new CypressTable("table");

		table.getBodyCellLocator(0, 0).should("contain.text", "Row 1");
		table.getBodyCellLocator(2, 1).should("contain.text", "");
		table.getBodyCellLocator(2, 1).should("contain.html", "button");
	});

	it("getBodyCellLocatorByRowConditions returns locator", () => {
		cy.visit(Route.ButtonTable);
		const table = new CypressTable("table");

		table.getBodyRows().should("have.length", 3)
		table.getBodyCellLocatorByRowConditions({ Rownumber: "Row 2" }, "Delete?")
			.find("input[type='button']").click();
		table.getBodyRows().should("have.length", 2);
	});

	it.skip("getAllBodyCellLocatorsByHeaderName returns locators", () => {
		cy.visit(Route.ButtonTable);
		const table = new CypressTable("table");

		table.getAllBodyCellLocatorsByHeaderName("Delete?")
			.then(locators => {
				expect(locators).to.have.length(3);
				locators.reverse().forEach(locator => {
					locator.find("input[type='button']").click();
				});
			});

		table.getBodyRows().should("have.length", 0);
	});

	it.skip("getAllBodyCellLocatorsByHeaderIndex returns locators", () => {
		cy.visit(Route.ButtonTable);
		const table = new CypressTable("table");

		table.getAllBodyCellLocatorsByHeaderIndex(1).then(locators => {
			expect(locators).to.have.length(3);
			locators.reverse().forEach(locator => {
				locator.find("input[type='button']").click();
			});
		});

		cy.get("table>tbody>tr").should("have.length", 0);
	});

	describe("dynamic table loading", () => {
		it("waits for table to contain text", () => {
			cy.visit(Route.DynamicLoadTable);
			const table = new CypressTable("table");

			table.getJson().should("deep.equal", [
				{
					"Header 1": "Row 1 Col 1",
					"Header 2": "Row 1 Col 2",
					"Header 3": "Row 1 Col 3",
				},
				{
					"Header 1": "Row 2 Col 1",
					"Header 2": "Row 2 Col 2",
					"Header 3": "Row 2 Col 3",
				},
				{
					"Header 1": "Row 3 Col 1",
					"Header 2": "Row 3 Col 2",
					"Header 3": "Row 3 Col 3",
				},
			]);
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

		it.skip("no header rows should throw exception", () => {
			cy.visit(Route.EmptyHeaderRowsTable);
			const table = new CypressTable("table", { header: { rowSelector: "invalid" } });

			table.getJson({ timeout: 1000 }).then(() => {
				cy.once("fail", error => {
					expect(error.message).to.include("No header rows found");
					return false;
				});
			});

		});

		it("no header row cells should throw exception", () => {
			cy.visit(Route.EmptyHeaderRowsTable);
			const table = new CypressTable("table", { header: { columnSelector: "invalid" } });

			cy.once("fail", error => {
				expect(error.message).to.include("No header cells with content found");
				return false;
			});

			table.getJson({ timeout: 1000 });
		});

		it.skip("no body rows should throw exception", () => {
			cy.visit(Route.EmptyBodyRowsTable);
			const table = new CypressTable("table", { row: { rowSelector: "invalid" } });

			cy.once("fail", error => {
				expect(error.message).to.include("No body rows found");
				return false;
			});

			table.getJson({ timeout: 1000 });
		});

		it("no body row cells should throw exception", () => {
			cy.visit(Route.EmptyBodyRowsTable);
			const table = new CypressTable("table", { row: { columnSelector: "invalid" } });

			cy.once("fail", error => {
				expect(error.message).to.include("No body cells with content found");
				return false;
			});

			table.getJson({ timeout: 1000 });
		});
	});

	it("supports div based table structure", () => {
		cy.visit(Route.DivTable);
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

		table.getJson().should("deep.equal", [
			{
				"First name": "Ronald",
				"Last name": "Veth",
				Specialty: "Test Automation",
			},
			{
				"First name": "Logan",
				"Last name": "Deacon",
				Specialty: "Make special together",
			},
			{
				"First name": "John",
				"Last name": "Doe",
				Specialty: "Anonymity",
			},
		]);
	});
});
