import { test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { Ledger } from "../../packages/evidence/src/ledger.ts";
import { ArtifactStore } from "../../packages/evidence/src/artifact-store.ts";
import {
  hashObject,
  sha256,
} from "../../packages/evidence/src/canonical-json.ts";
import type { Run, Snapshot } from "../../packages/core/src/domain/models.ts";
import { blockersFor } from "../../packages/release/src/policy.ts";
function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sf-ledger-"));
  const ledger = new Ledger(root);
  const snapshot = {
    snapshotId: randomUUID(),
    candidateId: "test",
    candidateDigest: sha256("fixture"),
    root,
    manifest: {},
    createdAt: new Date().toISOString(),
  } as Snapshot;
  ledger.putSnapshot(snapshot);
  const run: Run = {
    runId: randomUUID(),
    snapshotId: snapshot.snapshotId,
    candidateId: "test",
    candidateDigest: snapshot.candidateDigest,
    key: "same-key",
    requestDigest: sha256("request"),
    status: "RUNNING",
    createdAt: snapshot.createdAt,
    gitSha: null,
  };
  ledger.insertRun(run);
  return { root, ledger, run, store: new ArtifactStore(root, ledger) };
}
test("SQLite migration, foreign keys, restart and artifact tamper verification", () => {
  const { root, ledger, run, store } = setup();
  expect(ledger.db.pragma("foreign_keys", { simple: true })).toBe(1);
  expect(() =>
    ledger.db
      .prepare("INSERT INTO artifacts VALUES(?,?,?)")
      .run("absent-run", "bad.json", "{}"),
  ).toThrow();
  const ref = store.put(run.runId, "checks/data/raw.json", '{"actual":true}');
  expect(store.verify(run.runId, ref)).toBe(true);
  expect(() =>
    store.put(run.runId, "checks/data/raw.json", "overwrite"),
  ).toThrow();
  fs.writeFileSync(
    path.join(store.directory(run.runId), ref.relativePath),
    "tampered",
  );
  expect(store.verify(run.runId, ref)).toBe(false);
  ledger.close();
  const reopened = new Ledger(root);
  expect(reopened.getRun(run.runId).runId).toBe(run.runId);
  reopened.close();
});
test("DB candidate/key uniqueness and request reuse", () => {
  const { ledger, run } = setup();
  expect(ledger.findRun("test", "same-key")?.runId).toBe(run.runId);
  expect(() => ledger.insertRun({ ...run, runId: randomUUID() })).toThrow();
  ledger.close();
});
test("completed results cannot be overwritten or appended", () => {
  const { ledger, run } = setup();
  run.status = "COMPLETED";
  ledger.updateRun(run);
  expect(() => ledger.updateRun({ ...run, status: "RUNNING" })).toThrow();
  ledger.close();
});
test("orphan/temp files cannot establish PASS after crash", () => {
  const { ledger, run, store } = setup();
  fs.writeFileSync(
    path.join(store.directory(run.runId), "uncommitted.tmp"),
    '{"status":"PASS"}',
  );
  expect(ledger.results(run.runId)).toEqual([]);
  expect(blockersFor(run, [], false, true, true)).toContain("RUN_NOT_COMPLETE");
  run.status = "INTERRUPTED";
  ledger.updateRun(run);
  expect(blockersFor(run, [], false, true, true)).not.toEqual([]);
  ledger.close();
});
test("artifact traversal and missing evidence fail without outside access", () => {
  const { ledger, run, store } = setup();
  expect(() => store.put(run.runId, "../../outside", "bad")).toThrow();
  expect(
    store.verify(run.runId, {
      relativePath: "../../outside",
      sha256: sha256("bad"),
      sizeBytes: 3,
      mediaType: "text/plain",
    }),
  ).toBe(false);
  const ref = store.put(run.runId, "missing.json", "{}");
  fs.unlinkSync(path.join(store.directory(run.runId), "missing.json"));
  expect(store.verify(run.runId, ref)).toBe(false);
  ledger.close();
});
test("failed SQLite immediate transaction rolls back decision writes", () => {
  const { ledger } = setup();
  expect(() =>
    ledger.transaction(() => {
      ledger.db
        .prepare("INSERT INTO criteria_revisions VALUES(?,?)")
        .run("rollback", "{}");
      throw new Error("injected interruption");
    }),
  ).toThrow();
  expect(
    ledger.db
      .prepare("SELECT * FROM criteria_revisions WHERE id=?")
      .get("rollback"),
  ).toBeUndefined();
  ledger.close();
});
