import { TableWait, RowKind } from "../../src/table-wait";
import { Route } from "../../demo-html/routes";

type RowTestRun = {
	rowKind: RowKind;
	rowSelector: string;
	cellSelector: string;
	expectedRowAmount: number;
};

const rowTestRuns: RowTestRun[] = [
	{
		rowKind: RowKind.Header,
		rowSelector: "thead>tr",
		cellSelector: "th",
		expectedRowAmount: 1,
	},
	{
		rowKind: RowKind.Body,
		rowSelector: "tbody>tr",
		cellSelector: "td",
		expectedRowAmount: 3,
	},
];

rowTestRuns.forEach(run => {
	describe(`TableWait ${run.rowKind}`, () => {
		it("default options should not throw error with timeout", () => {
			cy.visit(Route.DynamicLoadTable);

			TableWait.waitForRows(
				cy.get("table"),
				run.rowSelector,
				run.cellSelector,
				run.rowKind,
				{ timeout: 2000 }
			);
		});

		it("default options should throw error without timeout", () => {
			cy.visit(Route.DynamicLoadTable);

			cy.once("fail", error => {
				expect(error.message).to.include(
					`No ${run.rowKind} cells with content found`
				);
				return false;
			});

			TableWait.waitForRows(
				cy.get("table"),
				run.rowSelector,
				run.cellSelector,
				run.rowKind
			);
		});

		it("should throw error when amount of rows is not met", () => {
			cy.visit(Route.DynamicLoadTable);

			cy.once("fail", error => {
				expect(error.message).to.include(
					`Expected 5 ${run.rowKind} rows, but found ${run.expectedRowAmount}`
				);
				return false;
			});

			TableWait.waitForRows(
				cy.get("table"),
				run.rowSelector,
				run.cellSelector,
				run.rowKind,
				{
					timeout: 2000,
					row: { amount: 5 },
				}
			);
		});

		it("should NOT throw error when amount of rows is met", () => {
			cy.visit(Route.DynamicLoadTable);

			TableWait.waitForRows(
				cy.get("table"),
				run.rowSelector,
				run.cellSelector,
				run.rowKind,
				{
					timeout: 2000,
					row: { amount: run.expectedRowAmount },
				}
			);
		});

		it("should throw error when amount of cells is not met", () => {
			cy.visit(Route.DynamicLoadTable);

			cy.once("fail", error => {
				expect(error.message).to.include(
					`Expected amount of 10 ${run.rowKind} cells for row not found`
				);
				return false;
			});

			TableWait.waitForRows(
				cy.get("table"),
				run.rowSelector,
				run.cellSelector,
				run.rowKind,
				{
					timeout: 2000,
					row: { cell: { totalCount: 10 } },
				}
			);
		});

		it("should NOT throw error when amount of cells is met", () => {
			cy.visit(Route.DynamicLoadTable);

			TableWait.waitForRows(
				cy.get("table"),
				run.rowSelector,
				run.cellSelector,
				run.rowKind,
				{
					timeout: 2000,
					row: { cell: { totalCount: 3 } },
				}
			);
		});

		it("should throw error when amount of cells with content is not met", () => {
			cy.visit(Route.DynamicLoadTable);

			cy.once("fail", error => {
				expect(error.message).to.include(
					`Expected amount of 10 ${run.rowKind} cells with content for row not found`
				);
				return false;
			});

			TableWait.waitForRows(
				cy.get("table"),
				run.rowSelector,
				run.cellSelector,
				run.rowKind,
				{
					timeout: 2000,
					row: { cell: { contentCount: 10 } },
				}
			);
		});

		it("should NOT throw error when amount of cells with content is met", () => {
			cy.visit(Route.DynamicLoadTable);

			TableWait.waitForRows(
				cy.get("table"),
				run.rowSelector,
				run.cellSelector,
				run.rowKind,
				{
					timeout: 2000,
					row: { cell: { contentCount: 3 } },
				}
			);
		});
	});
});
