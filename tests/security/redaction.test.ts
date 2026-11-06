import { test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import {
  redactSecrets,
  sanitizedJson,
} from "../../packages/core/src/infrastructure/redaction.ts";
import { Ledger } from "../../packages/evidence/src/ledger.ts";
import { ArtifactStore } from "../../packages/evidence/src/artifact-store.ts";
import { sha256 } from "../../packages/evidence/src/canonical-json.ts";
import type { Snapshot, Run } from "../../packages/core/src/domain/models.ts";
test("synthetic secret markers do not persist in text evidence or audit events", () => {
  const marker = "sk-" + "SYNTHETIC_TEST_MARKER_NOT_A_REAL_KEY";
  expect(redactSecrets("Bearer " + marker)).not.toContain(marker);
  expect(sanitizedJson({ status: "FAIL", message: marker })).toEqual({
    status: "FAIL",
    message: "<redacted-secret>",
  });
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sf-redact-"));
  const ledger = new Ledger(root),
    store = new ArtifactStore(root, ledger);
  const snapshot = {
    snapshotId: randomUUID(),
    candidateId: "test-only",
    candidateDigest: sha256("test-only"),
    root,
    manifest: {},
    createdAt: new Date().toISOString(),
  } as Snapshot;
  ledger.putSnapshot(snapshot);
  const run: Run = {
    runId: randomUUID(),
    snapshotId: snapshot.snapshotId,
    candidateId: "test-only",
    candidateDigest: snapshot.candidateDigest,
    key: "test-only",
    requestDigest: sha256("test"),
    status: "RUNNING",
    createdAt: snapshot.createdAt,
    gitSha: null,
  };
  ledger.insertRun(run);
  const ref = store.put(
    run.runId,
    "raw-report.json",
    JSON.stringify({ status: "FAIL", message: marker }),
  );
  const persisted = fs.readFileSync(
    path.join(store.directory(run.runId), ref.relativePath),
    "utf8",
  );
  expect(persisted).not.toContain(marker);
  expect(JSON.parse(persisted).status).toBe("FAIL");
  expect(store.verify(run.runId, ref)).toBe(true);
  ledger.audit("TestOnlySecretMarker", run.runId, { message: marker });
  const rows = ledger.db.prepare("SELECT data FROM audit_events").all();
  expect(JSON.stringify(rows)).not.toContain(marker);
  ledger.close();
});
