import { test, expect } from "vitest";
import {
  parseOasdiffReport,
  parseVitestReport,
} from "../../packages/checks/src/report-parsers.ts";
const item = {
  id: "response-media-type-removed",
  text: "Known fixture",
  level: 3,
};
test("oasdiff business break maps separately from process errors", () => {
  expect(parseOasdiffReport([item], 1)).toHaveLength(1);
  expect(parseOasdiffReport([], 0)).toEqual([]);
});
test.each([
  [[], 1],
  [[item], 0],
  [[item], 102],
  [{}, 0],
  [[{ id: "missing-fields" }], 1],
])("contradictory or unknown oasdiff reports rejected %#", (value, code) =>
  expect(() => parseOasdiffReport(value, code as number)).toThrow(),
);
const report = (status = "passed") => ({
  success: status === "passed",
  numTotalTests: 1,
  testResults: [{ assertionResults: [{ fullName: "AC-001 expiry", status }] }],
});
test("valid Vitest pass/failure retains real case count", () => {
  expect(parseVitestReport(report(), 0, ["AC-001"]).cases).toHaveLength(1);
  expect(
    parseVitestReport(report("failed"), 1, ["AC-001"]).failed,
  ).toHaveLength(1);
});
test.each([
  {},
  { success: true, numTotalTests: 0, testResults: [] },
  { ...report(), numTotalTests: 2 },
  report("pending"),
  report("skipped"),
])("unknown zero inconsistent or skipped Vitest result denied %#", (value) =>
  expect(() => parseVitestReport(value, 0, ["AC-001"])).toThrow(),
);
test("missing approved case and exit contradiction denied", () => {
  expect(() => parseVitestReport(report(), 0, ["AC-MISSING"])).toThrow();
  expect(() => parseVitestReport(report(), 1, ["AC-001"])).toThrow();
});
