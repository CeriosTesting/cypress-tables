import { TableHeader } from "../../src/table-header";
import { HeaderRow } from "../../src/row";
import { Route } from "../../demo-html/routes";

describe("TableHeader", () => {
	describe("options colspan", () => {
		const cases: {
			options: { colspan?: { enabled?: boolean; suffix?: boolean } };
			expectedHeaders: HeaderRow[];
		}[] = [
			{
				options: { colspan: { enabled: true, suffix: true } },
				expectedHeaders: [
					["Number", "Name", "Name__C1", "Color Combination", "Color Combination__C1", "Color Combination__C2"],
				],
			},
			{
				options: { colspan: { enabled: true, suffix: false } },
				expectedHeaders: [["Number", "Name", "Name", "Color Combination", "Color Combination", "Color Combination"]],
			},
			{
				options: { colspan: { enabled: false, suffix: true } },
				expectedHeaders: [["Number", "Name", "Color Combination"]],
			},
			{
				options: { colspan: { enabled: false, suffix: false } },
				expectedHeaders: [["Number", "Name", "Color Combination"]],
			},
		];

		cases.forEach(({ options, expectedHeaders }) => {
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
		const cases: {
			options: { emptyCellReplacement: boolean };
			expectedHeaders: HeaderRow[];
		}[] = [
			{
				options: { emptyCellReplacement: true },
				expectedHeaders: [["{{Empty}}", "First Name", "Last Name", "{{Empty}}"]],
			},
			{
				options: { emptyCellReplacement: false },
				expectedHeaders: [["", "First Name", "Last Name", ""]],
			},
		];

		cases.forEach(({ options, expectedHeaders }) => {
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
		const cases: {
			options: { duplicateSuffix: boolean };
			expectedHeaders: HeaderRow[];
		}[] = [
			{
				options: { duplicateSuffix: true },
				expectedHeaders: [
					["Average", "Average__D1", "Average__D2", "Average__D3", "Age"],
					["Height", "Weight", "Height__D1", "Weight__D1", "Age"],
				],
			},
			{
				options: { duplicateSuffix: false },
				expectedHeaders: [
					["Average", "Average", "Average", "Average", "Age"],
					["Height", "Weight", "Height", "Weight", "Age"],
				],
			},
		];

		cases.forEach(({ options, expectedHeaders }) => {
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
		});
	});
});
