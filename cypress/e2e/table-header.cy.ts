import { TableHeader } from "../../src/table-header";
import { Route } from "../../demo-html/routes";

import tableHeaderCases from "cypress/fixtures/table-header-cases.json";

describe("TableHeader", () => {
	describe("options colspan", () => {
		tableHeaderCases.colspan.forEach(({ options, expectedHeaders }) => {
			it(`colspan enabled=${options.colspan?.enabled} suffix=${options.colspan?.suffix}`, () => {
				cy.visit(Route.ColspanHeaderTable);

				cy.get("table>thead>tr").then($rows => {
					const headers = TableHeader.getRows(
						Array.from($rows, el => el),
						"th",
						options
					);
					expect(headers).to.deep.equal(expectedHeaders);
				});
			});
		});
	});

	describe("options empty cell replacement", () => {
		tableHeaderCases["empty-cell"].forEach(({ options, expectedHeaders }) => {
			it(`emptyCellReplacement=${options.emptyCellReplacement}`, () => {
				cy.visit(Route.DuplicateEmptyHeadersTable);

				cy.get("table>thead>tr").then($rows => {
					const headers = TableHeader.getRows(
						Array.from($rows, el => el),
						"th",
						options
					);
					expect(headers).to.deep.equal(expectedHeaders);
				});
			});
		});
	});

	describe("options duplicate suffix", () => {
		tableHeaderCases["duplicate-suffix"].forEach(
			({ options, expectedHeaders }) => {
				it(`duplicateSuffix=${options.duplicateSuffix}`, () => {
					cy.visit(Route.RowspanHeaderTable);

					cy.get("table>thead>tr").then($rows => {
						const headers = TableHeader.getRows(
							Array.from($rows, el => el),
							"th",
							{ ...options, colspan: { enabled: true } }
						);
						expect(headers).to.deep.equal(expectedHeaders);
					});
				});
			}
		);
	});
});
