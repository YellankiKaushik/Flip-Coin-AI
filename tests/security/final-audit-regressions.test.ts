import { test, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import {
  resultSchema,
  type CheckResult,
  type Run,
  type Snapshot,
} from "../../packages/core/src/domain/models.ts";
import { blockersFor } from "../../packages/release/src/policy.ts";
import { sha256 } from "../../packages/evidence/src/canonical-json.ts";
import { runProcess } from "../../packages/core/src/infrastructure/process-runner.ts";
import { parseVitestReport } from "../../packages/checks/src/report-parsers.ts";
import { Ledger } from "../../packages/evidence/src/ledger.ts";
import { ArtifactStore } from "../../packages/evidence/src/artifact-store.ts";
import { verifyResults } from "../../packages/release/src/assessment.ts";
import { reconcile } from "../../packages/checks/src/data.ts";
const timestamp = new Date().toISOString();
test("audit: duplicate rows retain actual coverage and distinct issue IDs", () => {
  const r = reconcile(
    Buffer.from("order_id,total_cents,status\nA,1,PAID\nA,1,PAID\nA,1,PAID\n"),
    Buffer.from("order_id,charged_cents,settled\nA,1,true\n"),
  );
  expect(r.counts.orders).toBe(3);
  expect(r.coverage).toBe(4);
  expect(new Set(r.findings.map((f) => f.issueId)).size).toBe(2);
});
function result(id: CheckResult["checkId"]): CheckResult {
  return {
    schemaVersion: 1,
    runId: "c321d2ca-8de3-448a-9119-1cda82e65f9b",
    checkId: id,
    attempt: 1,
    candidateDigest: sha256("test-only"),
    tool: {
      name: {
        acceptance: "vitest",
        accessibility: "axe-core",
        contract: "oasdiff",
        data: "csv-parse",
      }[id],
      version: "test-only",
    },
    status: "PASS",
    startedAt: timestamp,
    finishedAt: timestamp,
    durationMs: 0,
    summary: "Explicit synthetic state fixture, never human approval",
    findings: [],
    errors: [],
    coverage: 1,
    evidence: [
      {
        relativePath: "test.json",
        sha256: sha256("test"),
        sizeBytes: 4,
        mediaType: "application/json",
      },
    ],
  };
}
test("audit: PASS carrying an execution error is invalid", () => {
  const r = result("data");
  r.errors = [
    { code: "CRASHED", message: "test-only injected execution error" },
  ];
  expect(resultSchema.safeParse(r).success).toBe(false);
});
test("audit: a check cannot claim a different engine as its tool", () => {
  const results = (
    ["acceptance", "accessibility", "contract", "data"] as const
  ).map(result);
  results[1].tool.name = "node";
  const run = {
    runId: results[0].runId,
    candidateDigest: results[0].candidateDigest,
    status: "COMPLETED",
  } as Run;
  expect(blockersFor(run, results, true, true, true).length).toBeGreaterThan(0);
});
test("audit: required acceptance ID must match exactly, not a prefix", () => {
  const report = {
    success: true,
    numTotalTests: 1,
    testResults: [
      {
        assertionResults: [
          { fullName: "AC-0010 unrelated case", status: "passed" },
        ],
      },
    ],
  };
  expect(() => parseVitestReport(report, 0, ["AC-001"])).toThrow();
});
test("audit: split UTF-8 process chunks preserve real output", async () => {
  const code =
    'const b=Buffer.from("界🙂");process.stdout.write(b.subarray(0,2));setTimeout(()=>{process.stdout.write(b.subarray(2,5));setTimeout(()=>process.stdout.write(b.subarray(5)),30)},30)';
  const r = await runProcess(process.execPath, ["-e", code], process.cwd(), [
    process.execPath,
  ]);
  expect(r.exitCode).toBe(0);
  expect(r.stdout).toBe("界🙂");
});
test("audit: an arriving artifact writer cannot overwrite existing bytes", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sf-audit-race-")),
    db = new Ledger(root),
    store = new ArtifactStore(root, db);
  const snapshot = {
    snapshotId: randomUUID(),
    candidateId: "audit-test-only",
    candidateDigest: sha256("test-only"),
    root,
    manifest: {},
    createdAt: timestamp,
  } as Snapshot;
  db.putSnapshot(snapshot);
  const run = {
    runId: randomUUID(),
    snapshotId: snapshot.snapshotId,
    candidateId: snapshot.candidateId,
    candidateDigest: snapshot.candidateDigest,
    key: "audit-test",
    requestDigest: sha256("request"),
    status: "RUNNING",
    createdAt: timestamp,
    gitSha: null,
  } as Run;
  db.insertRun(run);
  const ref = store.put(run.runId, "original.json", '{"original":true}');
  const file = path.join(store.directory(run.runId), ref.relativePath);
  const exists = fs.existsSync;
  const spy = vi
    .spyOn(fs, "existsSync")
    .mockImplementation((p) => (String(p) === file ? false : exists(p)));
  try {
    expect(() =>
      store.put(run.runId, "original.json", '{"replacement":true}'),
    ).toThrow();
  } finally {
    spy.mockRestore();
  }
  expect(fs.readFileSync(file, "utf8")).toBe('{"original":true}');
  db.close();
});
test("audit: a result without durable run finalization cannot establish valid evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sf-audit-finalization-")),
    db = new Ledger(root),
    store = new ArtifactStore(root, db);
  const s = {
    snapshotId: randomUUID(),
    candidateId: "test-only-finalization",
    candidateDigest: sha256("test-only"),
    root,
    manifest: {},
    createdAt: timestamp,
  } as Snapshot;
  db.putSnapshot(s);
  const run = {
    runId: randomUUID(),
    snapshotId: s.snapshotId,
    candidateId: s.candidateId,
    candidateDigest: s.candidateDigest,
    key: "test-only",
    requestDigest: sha256("request"),
    status: "RUNNING",
    createdAt: timestamp,
    gitSha: null,
  } as Run;
  db.insertRun(run);
  const r = result("data");
  r.runId = run.runId;
  r.evidence = [
    store.put(run.runId, "checks/data/raw.json", '{"testOnly":true}'),
  ];
  store.put(run.runId, "checks/data/result.json", JSON.stringify(r));
  expect(verifyResults(run.runId, [r], store)).toBe(false);
  db.close();
});
