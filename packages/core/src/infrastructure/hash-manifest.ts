import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  canonical,
  hashObject,
  sha256,
} from "../../../evidence/src/canonical-json.ts";
import { atomicWrite, confined, readJson, safeId } from "./filesystem-guard.ts";
import { inventory } from "./toolchain.ts";
import {
  invariant,
  criteriaSchema,
  checksSchema,
  policySchema,
  now,
  type CandidateManifest,
  type Snapshot,
  type FileEntry,
} from "../domain/models.ts";
import type { Ledger } from "../../../evidence/src/ledger.ts";
import { resolveChecks } from "./configuration.ts";
const configSchema = z
  .object({
    schemaVersion: z.literal(1),
    projectId: z.literal("checkout-demo"),
    include: z.array(z.string()).min(1),
    exclude: z.array(z.string()),
  })
  .strict();
const hex = z.string().regex(/^[a-f0-9]{64}$/);
const manifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    projectId: z.literal("checkout-demo"),
    candidateId: z.string().min(1),
    files: z
      .array(
        z
          .object({
            path: z.string().min(1),
            sizeBytes: z.number().int().nonnegative().safe(),
            sha256: hex,
          })
          .strict(),
      )
      .min(1),
    criteriaRevision: z.string().min(1),
    criteriaDigest: hex,
    testDigest: hex,
    policyDigest: hex,
    checksConfigDigest: hex,
    toolchain: z
      .array(
        z
          .object({
            name: z.string().min(1),
            version: z.string().min(1),
            sha256: hex.optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
export function fileInventory(root: string, patterns: string[]): FileEntry[] {
  const entries = new Map<string, FileEntry>();
  const collision = new Set<string>();
  for (const pattern of patterns) {
    invariant(
      !path.isAbsolute(pattern) &&
        !pattern.includes("..") &&
        !pattern.includes("\\"),
      "INVALID_INPUT",
      "Unsafe input pattern",
    );
    const files = fs
      .globSync(pattern, { cwd: root })
      .filter((p) => fs.statSync(path.join(root, p)).isFile());
    invariant(
      files.length,
      "INVALID_INPUT",
      "Required pattern matched no files: " + pattern,
    );
    for (const raw of files) {
      const normalized = raw.split(path.sep).join("/");
      if (entries.has(normalized)) continue;
      const lower = normalized.toLowerCase();
      invariant(
        !collision.has(lower),
        "INVALID_INPUT",
        "Case-colliding input paths",
      );
      collision.add(lower);
      const absolute = confined(root, normalized);
      const bytes = fs.readFileSync(absolute);
      entries.set(normalized, {
        path: normalized,
        sizeBytes: bytes.length,
        sha256: sha256(bytes),
      });
    }
  }
  return [...entries.values()].sort((a, b) =>
    Buffer.compare(Buffer.from(a.path), Buffer.from(b.path)),
  );
}
export function validateManifest(
  manifest: CandidateManifest,
  digest: string,
  root: string,
): boolean {
  try {
    manifestSchema.parse(manifest);
    invariant(
      hashObject(manifest) === digest,
      "EVIDENCE_CORRUPT",
      "Manifest digest mismatch",
      6,
    );
    invariant(
      manifest.files.length > 0,
      "EVIDENCE_CORRUPT",
      "Empty manifest",
      6,
    );
    let last = "";
    const seen = new Set<string>();
    for (const e of manifest.files) {
      invariant(
        !seen.has(e.path.toLowerCase()) &&
          (!last || Buffer.compare(Buffer.from(last), Buffer.from(e.path)) < 0),
        "EVIDENCE_CORRUPT",
        "Unsorted/duplicate manifest",
        6,
      );
      seen.add(e.path.toLowerCase());
      last = e.path;
      const file = confined(root, e.path);
      invariant(
        fs.statSync(file).size === e.sizeBytes &&
          sha256(fs.readFileSync(file)) === e.sha256,
        "CANDIDATE_CHANGED",
        "Snapshot bytes changed",
        6,
      );
    }
    if (manifest.files.some((e) => e.path === "config/candidate-inputs.json")) {
      const inputs = configSchema.parse(
        readJson(confined(root, "config/candidate-inputs.json")),
      );
      invariant(
        hashObject(fileInventory(root, inputs.include)) ===
          hashObject(manifest.files),
        "CANDIDATE_CHANGED",
        "Snapshot file inventory changed",
        6,
      );
      const persisted = readJson(confined(root, "candidate-manifest.json"));
      invariant(
        hashObject(persisted) === digest,
        "EVIDENCE_CORRUPT",
        "Persisted manifest differs from ledger",
        6,
      );
    }
    return true;
  } catch {
    return false;
  }
}
export async function prepare(
  root: string,
  ledger: Ledger,
  scenario: string,
  candidateId: string,
  overrides: Record<string, unknown> = {},
): Promise<Snapshot> {
  safeId(candidateId);
  invariant(
    ["defective", "corrected"].includes(scenario),
    "INVALID_INPUT",
    "Unknown scenario",
  );
  const config = configSchema.parse(
    readJson(path.join(root, "config", "candidate-inputs.json")),
  );
  const toolchain = await inventory(root);
  const id = randomUUID();
  const base = confined(root, ".local/snapshots", false);
  fs.mkdirSync(base, { recursive: true });
  const target = path.join(base, id);
  fs.mkdirSync(target);
  // Copy only explicit project inputs; scenario files are materialized before enumeration.
  for (const pattern of config.include.filter(
    (p) => !p.startsWith("fixtures/current/"),
  )) {
    const files = fileInventory(root, [pattern]);
    for (const entry of files) {
      const destination = path.join(target, entry.path);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(confined(root, entry.path), destination);
    }
  }
  const scenarioRoot = confined(root, "fixtures/scenarios/" + scenario);
  for (const entry of fileInventory(scenarioRoot, ["**/*"])) {
    const destination = path.join(target, "fixtures", "current", entry.path);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(confined(scenarioRoot, entry.path), destination);
  }
  const criteria = criteriaSchema.parse(
    readJson(path.join(target, "fixtures/current/criteria/approved.json")),
  );
  const checks = resolveChecks(root, overrides);
  atomicWrite(
    path.join(target, "config/effective-checks.json"),
    canonical(checks),
  );
  const policy = policySchema.parse(
    readJson(path.join(target, "config/release-policy.json")),
  );
  const manifest: CandidateManifest = {
    schemaVersion: 1,
    projectId: "checkout-demo",
    candidateId,
    files: fileInventory(target, config.include),
    criteriaRevision: String(criteria.revision),
    criteriaDigest: hashObject(criteria),
    testDigest: sha256(
      fs.readFileSync(
        path.join(target, "apps/checkout-demo/tests/checkout.spec.ts"),
      ),
    ),
    policyDigest: hashObject(policy),
    checksConfigDigest: hashObject(checks),
    toolchain,
  };
  const snapshot: Snapshot = {
    configOverrides: overrides,
    snapshotId: id,
    candidateId,
    candidateDigest: hashObject(manifest),
    root: target,
    manifest,
    createdAt: now(),
  };
  atomicWrite(
    path.join(target, "candidate-manifest.json"),
    canonical(manifest),
  );
  ledger.putSnapshot(snapshot);
  return snapshot;
}
