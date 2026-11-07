import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  hashObject,
  sha256,
} from "../../packages/evidence/src/canonical-json.ts";
import type {
  Snapshot,
  Run,
  CandidateManifest,
} from "../../packages/core/src/domain/models.ts";
/** Valid owned test metadata only; never a human review or real tool PASS. */
export function testSnapshot(
  root: string,
  candidateId = "TEST_ONLY",
  snapshotId = randomUUID(),
): Snapshot {
  const directory = path.join(root, ".local/snapshots", snapshotId);
  fs.mkdirSync(directory, { recursive: true });
  const bytes = Buffer.from(
    "Explicit persistence test fixture; no release authority.",
  );
  fs.writeFileSync(path.join(directory, "input.txt"), bytes);
  const manifest: CandidateManifest = {
    schemaVersion: 1,
    projectId: "checkout-demo",
    candidateId,
    files: [
      { path: "input.txt", sizeBytes: bytes.length, sha256: sha256(bytes) },
    ],
    criteriaRevision: "1",
    criteriaDigest: sha256("test-criteria"),
    testDigest: sha256("test-source"),
    policyDigest: sha256("test-policy"),
    checksConfigDigest: sha256("test-config"),
    toolchain: [{ name: "node", version: process.version }],
  };
  return {
    snapshotId,
    candidateId,
    candidateDigest: hashObject(manifest),
    root: fs.realpathSync(directory),
    manifest,
    createdAt: new Date().toISOString(),
  };
}
export function testRun(snapshot: Snapshot, overrides: Partial<Run> = {}): Run {
  return {
    runId: randomUUID(),
    snapshotId: snapshot.snapshotId,
    candidateId: snapshot.candidateId,
    candidateDigest: snapshot.candidateDigest,
    key: "test-" + randomUUID(),
    requestDigest: hashObject({
      snapshotId: snapshot.snapshotId,
      candidateDigest: snapshot.candidateDigest,
    }),
    status: "RUNNING",
    createdAt: new Date().toISOString(),
    gitSha: null,
    criteriaRevision: snapshot.manifest.criteriaRevision,
    policyDigest: snapshot.manifest.policyDigest,
    toolchainDigest: hashObject(snapshot.manifest.toolchain),
    ...overrides,
  };
}
