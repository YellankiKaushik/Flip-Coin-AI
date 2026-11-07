import {
  ids,
  resultSchema,
  type CheckResult,
  type Run,
} from "../../core/src/public/domain.ts";
export function blockersFor(
  run: Run,
  results: CheckResult[],
  evidenceValid: boolean,
  identityValid: boolean,
  criteriaReviewed: boolean,
): string[] {
  const blockers: string[] = [];
  if (run.status !== "COMPLETED") blockers.push("RUN_NOT_COMPLETE");
  if (!evidenceValid) blockers.push("INVALID_EVIDENCE");
  if (!identityValid) blockers.push("STALE_CANDIDATE_OR_TOOLCHAIN");
  if (!criteriaReviewed) blockers.push("CRITERIA_AND_TEST_REVIEW_REQUIRED");
  if (results.length !== 4) blockers.push("EXPECTED_EXACTLY_FOUR_RESULTS");
  for (const id of ids) {
    const found = results.filter((r) => r.checkId === id);
    if (found.length !== 1) {
      blockers.push(id + ":" + (found.length ? "DUPLICATE" : "MISSING"));
      continue;
    }
    const r = found[0];
    if (!resultSchema.safeParse(r).success)
      blockers.push(id + ":INVALID_SCHEMA");
    if (r.candidateDigest !== run.candidateDigest || r.runId !== run.runId)
      blockers.push(id + ":STALE");
    if (r.status !== "PASS") blockers.push(id + ":" + r.status);
    if (r.coverage <= 0 || r.evidence.length === 0)
      blockers.push(id + ":NO_COVERAGE");
  }
  return [...new Set(blockers)].sort();
}
