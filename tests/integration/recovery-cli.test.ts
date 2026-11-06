import { pathToFileURL } from "node:url";
import { test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { Ledger } from "../../packages/evidence/src/ledger.ts";
import { sha256 } from "../../packages/evidence/src/canonical-json.ts";
import type { Snapshot, Run } from "../../packages/core/src/domain/models.ts";
test("operator CLI recovery marks a test-only crashed run interrupted and denies live lock owner", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sf-cli-recovery-test-"));
  const db = new Ledger(root);
  const snapshotId = randomUUID(),
    runId = randomUUID();
  const snapshotRoot = path.join(root, ".local/snapshots", snapshotId);
  fs.mkdirSync(snapshotRoot, { recursive: true });
  const snapshot = {
    snapshotId,
    candidateId: "TEST_ONLY_CRASH_FIXTURE",
    candidateDigest: sha256("test-only"),
    root: snapshotRoot,
    manifest: {},
    createdAt: new Date().toISOString(),
  } as Snapshot;
  db.putSnapshot(snapshot);
  const run: Run = {
    runId,
    snapshotId,
    candidateId: snapshot.candidateId,
    candidateDigest: snapshot.candidateDigest,
    key: "test-only",
    requestDigest: sha256("test-only-request"),
    status: "RUNNING",
    createdAt: snapshot.createdAt,
    gitSha: null,
  };
  db.insertRun(run);
  db.close();
  const cli = path.join(process.cwd(), "apps/cli/src/main.ts");
  const call = () =>
    spawnSync(
      process.execPath,
      [
        "--import",
        pathToFileURL(
          path.join(process.cwd(), "node_modules/tsx/dist/loader.mjs"),
        ).href,
        cli,
        "recover",
        "--run",
        runId,
        "--json",
      ],
      { cwd: root, encoding: "utf8", windowsHide: true },
    );
  fs.writeFileSync(
    path.join(root, ".local/run.lock"),
    JSON.stringify({ pid: process.pid, leaseId: "test-only" }),
  );
  const live = call();
  expect(live.status).toBe(5);
  expect(JSON.parse(live.stdout).error.code).toBe("DUPLICATE_CONFLICT");
  fs.unlinkSync(path.join(root, ".local/run.lock"));
  const recovered = call();
  expect(recovered.status).toBe(0);
  expect(JSON.parse(recovered.stdout).data.status).toBe("INTERRUPTED");
  expect(call().status).toBe(2);
});
