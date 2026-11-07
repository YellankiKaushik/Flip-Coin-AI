import { invariant } from "../../core/src/public/domain.ts";
export function parseOasdiffReport(value: unknown, exitCode: number | null) {
  invariant(
    Array.isArray(value) &&
      value.every(
        (x: unknown) =>
          !!x &&
          typeof x === "object" &&
          typeof (x as any).id === "string" &&
          typeof (x as any).text === "string" &&
          typeof (x as any).level === "number",
      ),
    "INVALID_INPUT",
    "Unknown oasdiff report",
  );
  const breaking = value.filter((x) => x.level >= 3);
  invariant(
    (exitCode === 0 && breaking.length === 0) ||
      (exitCode === 1 && breaking.length > 0),
    "TOOL_CONTRADICTION",
    "oasdiff exit/report contradiction",
  );
  return breaking;
}
export function parseVitestReport(
  value: unknown,
  exitCode: number | null,
  requiredIds: string[],
) {
  const report = value as any;
  invariant(
    report &&
      typeof report === "object" &&
      Array.isArray(report.testResults) &&
      Number.isInteger(report.numTotalTests) &&
      report.numTotalTests > 0,
    "INVALID_INPUT",
    "Unknown/empty Vitest report",
  );
  const cases = report.testResults.flatMap(
    (suite: any) => suite.assertionResults || [],
  );
  invariant(
    cases.length === report.numTotalTests,
    "INVALID_INPUT",
    "Test count contradiction",
  );
  for (const id of requiredIds)
    invariant(
      cases.some(
        (c: any) =>
          typeof c.fullName === "string" &&
          c.fullName.split(/\s+/).includes(id) &&
          ["passed", "failed"].includes(c.status),
      ),
      "INVALID_INPUT",
      "Required criterion did not execute: " + id,
    );
  invariant(
    cases.every((c: any) => ["passed", "failed"].includes(c.status)),
    "INVALID_INPUT",
    "Skipped/incomplete test",
  );
  const failed = cases.filter((c: any) => c.status === "failed");
  invariant(
    (exitCode === 0 && failed.length === 0 && report.success === true) ||
      (exitCode === 1 && failed.length > 0 && report.success === false),
    "TOOL_CONTRADICTION",
    "Vitest report/exit contradiction",
  );
  return { cases, failed };
}
