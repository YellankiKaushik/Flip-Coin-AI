import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  hashObject,
  canonical,
  sha256,
} from "../../evidence/src/canonical-json.ts";
import {
  validateManifest,
  fileInventory,
} from "../../core/src/infrastructure/hash-manifest.ts";
import { inventory } from "../../core/src/infrastructure/toolchain.ts";
import {
  confined,
  readJson,
} from "../../core/src/infrastructure/filesystem-guard.ts";
import {
  policySchema,
  now,
  type Assessment,
  type CheckResult,
  type Snapshot,
} from "../../core/src/domain/models.ts";
import type { Ledger } from "../../evidence/src/ledger.ts";
import type { ArtifactStore } from "../../evidence/src/artifact-store.ts";
import { blockersFor } from "./policy.ts";
import { resolveChecks } from "../../core/src/infrastructure/configuration.ts";
export function hasCriteriaReview(ledger: Ledger, s: Snapshot): boolean {
  const row = ledger.db
    .prepare("SELECT data FROM criteria_revisions WHERE id=?")
    .get(s.manifest.criteriaDigest + ":" + s.manifest.testDigest) as
    { data: string } | undefined;
  if (!row) return false;
  try {
    const review = JSON.parse(row.data);
    const p = ledger.getProposal(review.proposalId);
    const proposed = ledger.db
      .prepare("SELECT data FROM criteria_revisions WHERE id=?")
      .get("proposal:" + p.proposalId) as { data: string } | undefined;
    if (!proposed) return false;
    const content = JSON.parse(proposed.data);
    const decision = ledger.db
      .prepare("SELECT data FROM decisions WHERE proposal_id=?")
      .get(p.proposalId) as { data: string } | undefined;
    return (
      review.decision === "HUMAN_ATTESTED_FOR_DEMO" &&
      review.actorVerificationLevel === 1 &&
      typeof review.actorRef === "string" &&
      review.actorRef.length > 0 &&
      p.actionType === "CRITERIA_REVIEW" &&
      content.criteriaDigest === s.manifest.criteriaDigest &&
      content.testDigest === s.manifest.testDigest &&
      hashObject(content) === p.resourceDigest &&
      p.humanActorRef === review.actorRef &&
      p.decision === "HUMAN_ATTESTED_FOR_DEMO" &&
      !!p.consumedAt &&
      !!decision &&
      hashObject(JSON.parse(decision.data)) === hashObject(p)
    );
  } catch {
    return false;
  }
}
export function currentImplementationMatches(
  root: string,
  s: Snapshot,
): boolean {
  try {
    const inputs = readJson(confined(root, "config/candidate-inputs.json")) as {
      include: string[];
      exclude: string[];
    };
    const current = fileInventory(
      root,
      inputs.include.filter((p) => !p.startsWith("fixtures/current/")),
      inputs.exclude,
    );
    const effective = canonical(resolveChecks(root, s.configOverrides || {}));
    const effectiveIndex = current.findIndex(
      (f) => f.path === "config/effective-checks.json",
    );
    if (effectiveIndex >= 0)
      current[effectiveIndex] = {
        path: "config/effective-checks.json",
        sizeBytes: Buffer.byteLength(effective),
        sha256: sha256(effective),
      };
    const expected = s.manifest.files.filter(
      (f) => !f.path.startsWith("fixtures/current/"),
    );
    if (hashObject(current) !== hashObject(expected)) return false;
    return true;
  } catch {
    return false;
  }
}
function verifyCheckEvidence(
  runId: string,
  results: CheckResult[],
  store: ArtifactStore,
): boolean {
  try {
    if (!results.length) return false;
    for (const result of results) {
      if (!result.evidence.every((e) => store.verify(runId, e))) return false;
      const file = store.ledger.db
        .prepare("SELECT data FROM artifacts WHERE run_id=? AND path=?")
        .get(runId, "checks/" + result.checkId + "/result.json") as
        { data: string } | undefined;
      if (!file) return false;
      const ref = JSON.parse(file.data);
      if (
        !store.verify(runId, ref) ||
        canonical(
          readJson(confined(store.directory(runId), ref.relativePath)),
        ) !== canonical(result)
      )
        return false;
    }
    const rows = store.ledger.db
      .prepare("SELECT data FROM artifacts WHERE run_id=?")
      .all(runId) as { data: string }[];
    return rows.every((row) => store.verify(runId, JSON.parse(row.data)));
  } catch {
    return false;
  }
}
// Completion is published last. Database COMPLETED alone never establishes evidence durability.
export function verifyResults(
  runId: string,
  results: CheckResult[],
  store: ArtifactStore,
): boolean {
  try {
    if (!verifyCheckEvidence(runId, results, store)) return false;
    const rows = store.ledger.db
      .prepare("SELECT data FROM artifacts WHERE run_id=? ORDER BY path")
      .all(runId) as { data: string }[];
    const refs = rows.map((r) => JSON.parse(r.data));
    const marker = refs.find((r) => r.relativePath === "completion.json");
    if (!marker || !store.verify(runId, marker)) return false;
    const completion = readJson(
      confined(store.directory(runId), marker.relativePath),
    ) as { schemaVersion: number; runId: string; artifacts: unknown[] };
    if (
      completion.schemaVersion !== 1 ||
      completion.runId !== runId ||
      canonical(completion.artifacts) !==
        canonical(refs.filter((r) => r.relativePath !== "completion.json"))
    )
      return false;
    const required = [
      "candidate-manifest.json",
      "run.json",
      "assessment.json",
      "audit-events.jsonl",
      "evidence-index.json",
      ...["acceptance", "accessibility", "contract", "data"].map(
        (id) => "checks/" + id + "/result.json",
      ),
    ];
    return (
      required.every((p) => refs.some((r) => r.relativePath === p)) &&
      canonical(readJson(confined(store.directory(runId), "run.json"))) ===
        canonical(store.ledger.getRun(runId))
    );
  } catch {
    return false;
  }
}
export async function assess(
  root: string,
  ledger: Ledger,
  store: ArtifactStore,
  runId: string,
  persist = true,
): Promise<Assessment> {
  return computeAssessment(root, ledger, store, runId, persist, false);
}
// Coordinator-only provisional calculation, never exposed as a CLI or human-review override.
export async function assessBeforeFinalization(
  root: string,
  ledger: Ledger,
  store: ArtifactStore,
  runId: string,
): Promise<Assessment> {
  return computeAssessment(root, ledger, store, runId, true, true);
}
async function computeAssessment(
  root: string,
  ledger: Ledger,
  store: ArtifactStore,
  runId: string,
  persist: boolean,
  finalizing: boolean,
): Promise<Assessment> {
  const run = ledger.getRun(runId),
    snapshot = ledger.getSnapshot(run.snapshotId),
    results = ledger.results(runId);
  let valid = false,
    policyVersion = "INVALID";
  let policyDigest = snapshot.manifest.policyDigest;
  try {
    const p = policySchema.parse(
      readJson(confined(snapshot.root, "config/release-policy.json")),
    );
    policyVersion = p.version;
    valid =
      hashObject(p) === policyDigest &&
      run.candidateDigest === snapshot.candidateDigest &&
      run.candidateId === snapshot.candidateId &&
      run.criteriaRevision === snapshot.manifest.criteriaRevision &&
      run.policyDigest === policyDigest &&
      run.toolchainDigest === hashObject(snapshot.manifest.toolchain) &&
      validateManifest(
        snapshot.manifest,
        snapshot.candidateDigest,
        snapshot.root,
      ) &&
      currentImplementationMatches(root, snapshot) &&
      hashObject(await inventory(root)) ===
        hashObject(snapshot.manifest.toolchain);
  } catch {
    valid = false;
  }
  const blockers = blockersFor(
    run,
    results,
    finalizing
      ? verifyCheckEvidence(runId, results, store)
      : verifyResults(runId, results, store),
    valid,
    hasCriteriaReview(ledger, snapshot),
  );
  for (const r of results) {
    const expected = snapshot.manifest.toolchain.find(
      (t) => t.name === r.tool.name,
    );
    if (!expected || expected.version !== r.tool.version)
      blockers.push(r.checkId + ":TOOLCHAIN_MISMATCH");
  }
  const latest = ledger
    .listRuns()
    .filter((r) => r.candidateId === run.candidateId)
    .at(-1);
  if (latest && latest.runId !== runId) blockers.push("SUPERSEDED_RUN");
  const stable = {
    schemaVersion: 1 as const,
    runId,
    candidateDigest: run.candidateDigest,
    requiredChecks: [
      ...["acceptance", "accessibility", "contract", "data"],
    ] as Assessment["requiredChecks"],
    policyVersion,
    policyDigest,
    readiness: blockers.length
      ? ("BLOCKED" as const)
      : ("READY_FOR_HUMAN_APPROVAL" as const),
    blockers: [...new Set(blockers)].sort(),
    resultDigests: results.map((r) => hashObject(r)).sort(),
  };
  const prior = ledger.db
    .prepare(
      "SELECT data FROM assessments WHERE run_id=? ORDER BY rowid DESC LIMIT 1",
    )
    .get(runId) as { data: string } | undefined;
  if (prior) {
    const value = JSON.parse(prior.data) as Assessment;
    const { assessmentId, assessmentDigest, computedAt, ...previousStable } =
      value;
    if (
      hashObject(previousStable) === hashObject(stable) &&
      hashObject({ ...previousStable, assessmentId, computedAt }) ===
        assessmentDigest
    )
      return value;
  }
  const payload = { ...stable, assessmentId: randomUUID(), computedAt: now() };
  const assessment = { ...payload, assessmentDigest: hashObject(payload) };
  if (persist) ledger.putAssessment(assessment);
  return assessment;
}
