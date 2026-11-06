import fs from "node:fs";
import { redactSecrets } from "../../core/src/infrastructure/redaction.ts";
import path from "node:path";
import {
  atomicWrite,
  confined,
} from "../../core/src/infrastructure/filesystem-guard.ts";
import { sha256, canonical } from "./canonical-json.ts";
import {
  artifactSchema,
  invariant,
  type ArtifactRef,
} from "../../core/src/domain/models.ts";
import type { Ledger } from "./ledger.ts";
import { artifactRoot } from "../../core/src/infrastructure/configuration.ts";
export class ArtifactStore {
  constructor(
    readonly root: string,
    readonly ledger: Ledger,
  ) {}
  directory(runId: string) {
    invariant(/^[a-f0-9-]{36}$/.test(runId), "INVALID_INPUT", "Invalid run ID");
    const base = artifactRoot(this.root);
    fs.mkdirSync(base, { recursive: true });
    const dir = confined(base, runId, false);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
  put(
    runId: string,
    relativePath: string,
    bytes: string | Uint8Array,
    mediaType = "application/json",
  ): ArtifactRef {
    const dir = this.directory(runId);
    const file = confined(dir, relativePath, false);
    invariant(
      !fs.existsSync(file),
      "EVIDENCE_CORRUPT",
      "Evidence overwrite forbidden",
      6,
    );
    invariant(
      Buffer.byteLength(bytes) <= 8 * 1048576,
      "INVALID_INPUT",
      "Artifact quota exceeded",
    );
    const persistedBytes =
      mediaType === "image/png"
        ? bytes
        : redactSecrets(
            typeof bytes === "string"
              ? bytes
              : Buffer.from(bytes).toString("utf8"),
          );
    atomicWrite(file, persistedBytes);
    const persisted = fs.readFileSync(file);
    const ref = artifactSchema.parse({
      relativePath,
      sha256: sha256(persisted),
      sizeBytes: persisted.length,
      mediaType,
    });
    this.ledger.db
      .prepare("INSERT INTO artifacts VALUES(?,?,?)")
      .run(runId, relativePath, canonical(ref));
    return ref;
  }
  verify(runId: string, ref: ArtifactRef): boolean {
    try {
      artifactSchema.parse(ref);
      const file = confined(this.directory(runId), ref.relativePath);
      const stat = fs.statSync(file);
      if (
        !stat.isFile() ||
        stat.size !== ref.sizeBytes ||
        stat.size > 8 * 1048576
      )
        return false;
      const recorded = this.ledger.db
        .prepare("SELECT data FROM artifacts WHERE run_id=? AND path=?")
        .get(runId, ref.relativePath) as { data: string } | undefined;
      return (
        !!recorded &&
        canonical(JSON.parse(recorded.data)) === canonical(ref) &&
        sha256(fs.readFileSync(file)) === ref.sha256
      );
    } catch {
      return false;
    }
  }
}
