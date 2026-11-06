import { test, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { blockersFor } from "../../packages/release/src/policy.ts";
import { validateDecision } from "../../packages/release/src/approval.ts";
import { sha256 } from "../../packages/evidence/src/canonical-json.ts";
import {
  ids,
  type CheckResult,
  type Run,
  type Proposal,
} from "../../packages/core/src/domain/models.ts";
const run: Run = {
  runId: randomUUID(),
  snapshotId: randomUUID(),
  candidateId: "test",
  candidateDigest: sha256("candidate"),
  key: "test",
  requestDigest: sha256("request"),
  status: "COMPLETED",
  createdAt: new Date().toISOString(),
  gitSha: null,
};
function result(
  id: (typeof ids)[number],
  status: CheckResult["status"] = "PASS",
): CheckResult {
  return {
    schemaVersion: 1,
    runId: run.runId,
    checkId: id,
    attempt: 1,
    candidateDigest: run.candidateDigest,
    tool: { name: "unit-fixture", version: "1" },
    status,
    startedAt: run.createdAt,
    finishedAt: run.createdAt,
    durationMs: 0,
    summary: "Explicit unit-test data; not real tool evidence",
    findings: [],
    evidence: [
      {
        relativePath: "unit-only.json",
        sha256: sha256("unit"),
        sizeBytes: 4,
        mediaType: "application/json",
      },
    ],
    errors: [],
    coverage: 1,
  };
}
test("UT-RP-001 exhaustive 625 combinations including missing check", () => {
  const states = ["PASS", "FAIL", "ERROR", "SKIPPED", "MISSING"] as const;
  let total = 0;
  for (const a of states)
    for (const b of states)
      for (const c of states)
        for (const d of states) {
          const selected = [a, b, c, d];
          const results = selected.flatMap((s, i) =>
            s === "MISSING" ? [] : [result(ids[i], s)],
          );
          expect(blockersFor(run, results, true, true, true).length === 0).toBe(
            selected.every((s) => s === "PASS"),
          );
          total++;
        }
  expect(total).toBe(625);
});
test.each([
  "evidence",
  "identity",
  "review",
  "incomplete",
  "duplicate",
  "stale",
  "empty-coverage",
  "error",
  "invalid-schema",
])("UT-RP negative invariant %s blocks", (fault) => {
  let results = ids.map((id) => result(id)),
    r = { ...run };
  if (fault === "incomplete") r.status = "RUNNING";
  if (fault === "duplicate") results.push(result("data"));
  if (fault === "stale") results[0].candidateDigest = sha256("other");
  if (fault === "empty-coverage") results[0].coverage = 0;
  if (fault === "error") results[0].status = "ERROR";
  if (fault === "invalid-schema") (results[0] as any).attempt = -1;
  expect(
    blockersFor(
      r,
      results,
      fault !== "evidence",
      fault !== "identity",
      fault !== "review",
    ).length,
  ).toBeGreaterThan(0);
});
const p = (): Proposal => ({
  proposalId: randomUUID(),
  actionType: "RELEASE_READINESS",
  candidateDigest: run.candidateDigest,
  assessmentDigest: sha256("assessment"),
  policyDigest: sha256("policy"),
  resourceDigest: sha256("assessment"),
  requesterRef: "test-fixture",
  actorVerificationLevel: 0,
  createdAt: run.createdAt,
  expiresAt: new Date(Date.now() + 60000).toISOString(),
  nonceDigest: sha256("unit-nonce"),
  decision: "REQUESTED",
  evidenceRefs: [],
});
test("valid pending exact-digest nonce accepted by pure state validator", () =>
  expect(() =>
    validateDecision(p(), sha256("assessment"), "unit-nonce"),
  ).not.toThrow());
test.each(["expired", "replayed", "wrong-digest", "wrong-nonce"])(
  "UT-APP-003 %s denied",
  (fault) => {
    const proposal = p();
    if (fault === "expired") proposal.expiresAt = "2020-01-01T00:00:00.000Z";
    if (fault === "replayed") proposal.decision = "HUMAN_ATTESTED_FOR_DEMO";
    expect(() =>
      validateDecision(
        proposal,
        sha256(fault === "wrong-digest" ? "changed" : "assessment"),
        fault === "wrong-nonce" ? "other" : "unit-nonce",
      ),
    ).toThrow();
  },
);
