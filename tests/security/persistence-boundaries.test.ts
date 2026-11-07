import { test, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Ledger } from "../../packages/evidence/src/ledger.ts";
import { createProposal } from "../../packages/release/src/approval.ts";
import { sha256 } from "../../packages/evidence/src/canonical-json.ts";
import { testSnapshot, testRun } from "../helpers/ledger-fixture.ts";
import type {
  Assessment,
  CheckResult,
} from "../../packages/core/src/domain/models.ts";
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sf-persist-boundary-"));
  const ledger = new Ledger(root),
    snapshot = testSnapshot(root);
  ledger.putSnapshot(snapshot);
  const run = testRun(snapshot);
  ledger.insertRun(run);
  return { root, ledger, snapshot, run };
}
function corrupt(fn: () => unknown) {
  expect(fn).toThrowError(
    expect.objectContaining({ code: "EVIDENCE_CORRUPT", exitCode: 6 }),
  );
}
test("malformed stored JSON is evidence corruption, not an internal crash", () => {
  const { ledger, snapshot } = fixture();
  try {
    ledger.db
      .prepare("UPDATE snapshots SET data=? WHERE id=?")
      .run("{", snapshot.snapshotId);
    corrupt(() => ledger.getSnapshot(snapshot.snapshotId));
  } finally {
    ledger.close();
  }
});
test("snapshot payload validates manifest shape and canonical digest", () => {
  const { ledger, snapshot } = fixture();
  try {
    ledger.db
      .prepare("UPDATE snapshots SET data=? WHERE id=?")
      .run(JSON.stringify({ ...snapshot, manifest: {} }), snapshot.snapshotId);
    corrupt(() => ledger.getSnapshot(snapshot.snapshotId));
  } finally {
    ledger.close();
  }
});
test("proposal payload cannot change its indexed identity", () => {
  const { ledger } = fixture();
  try {
    const p = createProposal(ledger, "CRITERIA_REVIEW", sha256("test-only"));
    ledger.db
      .prepare("UPDATE approval_requests SET data=? WHERE id=?")
      .run(JSON.stringify({ ...p, proposalId: randomUUID() }), p.proposalId);
    corrupt(() => ledger.getProposal(p.proposalId));
  } finally {
    ledger.close();
  }
});
test("proposal with malformed expiry cannot remain a pending request", () => {
  const { ledger } = fixture();
  try {
    const p = createProposal(ledger, "CRITERIA_REVIEW", sha256("test-only"));
    ledger.db
      .prepare("UPDATE approval_requests SET data=? WHERE id=?")
      .run(JSON.stringify({ ...p, expiresAt: "not-a-time" }), p.proposalId);
    corrupt(() => ledger.getProposal(p.proposalId));
  } finally {
    ledger.close();
  }
});
test("idempotency lookup cannot redirect to another indexed run", () => {
  const { ledger, snapshot, run } = fixture();
  try {
    const second = testRun(snapshot);
    ledger.insertRun(second);
    ledger.db
      .prepare("UPDATE runs SET data=? WHERE id=?")
      .run(JSON.stringify({ ...run, runId: second.runId }), run.runId);
    corrupt(() => ledger.findRun(run.candidateId, run.key));
  } finally {
    ledger.close();
  }
});
test("active run identity is immutable before terminal completion too", () => {
  const { ledger, run } = fixture();
  try {
    expect(() =>
      ledger.updateRun({ ...run, candidateDigest: sha256("changed") }),
    ).toThrow();
    expect(ledger.getRun(run.runId).candidateDigest).toBe(run.candidateDigest);
  } finally {
    ledger.close();
  }
});
test("result insertion rejects a different candidate digest", () => {
  const { ledger, run } = fixture();
  try {
    const r: CheckResult = {
      schemaVersion: 1,
      runId: run.runId,
      checkId: "data",
      attempt: 1,
      candidateDigest: sha256("other"),
      tool: { name: "csv-parse", version: "test-only" },
      status: "ERROR",
      startedAt: run.createdAt,
      finishedAt: run.createdAt,
      durationMs: 0,
      summary: "Explicit invalid persistence fixture, no real tool result",
      findings: [],
      evidence: [],
      errors: [{ code: "TEST_ONLY", message: "No human authority" }],
      coverage: 0,
    };
    corrupt(() => ledger.putResult(r));
    expect(ledger.results(run.runId)).toEqual([]);
  } finally {
    ledger.close();
  }
});
test("assessment write verifies its canonical digest", () => {
  const { ledger, run } = fixture();
  try {
    const a: Assessment = {
      schemaVersion: 1,
      assessmentId: randomUUID(),
      runId: run.runId,
      candidateDigest: run.candidateDigest,
      requiredChecks: ["acceptance", "accessibility", "contract", "data"],
      policyVersion: "test-only",
      policyDigest: sha256("policy"),
      readiness: "BLOCKED",
      blockers: ["TEST_ONLY"],
      resultDigests: [],
      assessmentDigest: sha256("wrong"),
      computedAt: new Date().toISOString(),
    };
    corrupt(() => ledger.putAssessment(a));
  } finally {
    ledger.close();
  }
});
test("snapshot insertion enforces its candidate and manifest digest binding", () => {
  const { ledger, root } = fixture();
  try {
    const s = testSnapshot(root);
    corrupt(() =>
      ledger.putSnapshot({ ...s, candidateDigest: sha256("wrong") }),
    );
  } finally {
    ledger.close();
  }
});

test("malformed run JSON is classified as evidence corruption", () => {
  const { ledger, run } = fixture();
  try {
    ledger.db.prepare("UPDATE runs SET data=? WHERE id=?").run("{", run.runId);
    corrupt(() => ledger.getRun(run.runId));
  } finally {
    ledger.close();
  }
});
test("active run cannot skip backwards into validation", () => {
  const { ledger, run } = fixture();
  try {
    expect(() => ledger.updateRun({ ...run, status: "VALIDATING" })).toThrow();
    expect(ledger.getRun(run.runId).status).toBe("RUNNING");
  } finally {
    ledger.close();
  }
});
test("proposal updates cannot retarget an existing review", () => {
  const { ledger } = fixture();
  try {
    const p = createProposal(ledger, "CRITERIA_REVIEW", sha256("test-only"));
    corrupt(() =>
      ledger.updateProposal({
        ...p,
        resourceDigest: sha256("other-test-only"),
      }),
    );
    expect(ledger.getProposal(p.proposalId).resourceDigest).toBe(
      p.resourceDigest,
    );
  } finally {
    ledger.close();
  }
});
