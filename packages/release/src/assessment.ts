import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { hashObject, canonical, sha256 } from "../../evidence/src/index.ts";
import {
  validateManifest,
  fileInventory,
} from "../../core/src/public/infrastructure.ts";
import { inventory } from "../../core/src/public/infrastructure.ts";
import { confined, readJson } from "../../core/src/public/infrastructure.ts";
import {
  policySchema,
  now,
  type Assessment,
  type CheckResult,
  type Snapshot,
} from "../../core/src/public/domain.ts";
import type { Ledger } from "../../evidence/src/index.ts";
import type { ArtifactStore } from "../../evidence/src/index.ts";
import { blockersFor } from "./policy.ts";
import { resolveChecks } from "../../core/src/public/infrastructure.ts";
export function hasCriteriaReview(ledger: Ledger, s: Snapshot): boolean {
  return inspectCriteriaReview(
    ledger,
    s.manifest.criteriaDigest,
    s.manifest.testDigest,
  ).valid;
}
/** Read-only canonical eligibility check; no nonce/key material or actor identity is returned. */
export function inspectCriteriaReview(
  ledger: Ledger,
  criteriaDigest: string,
  testDigest: string,
  expectedProposalId?: string,
) {
  const checks = {
    reviewRecorded: false,
    proposalMatches: false,
    actionMatches: false,
    levelOne: false,
    decisionConsumed: false,
    consumedWithinLifetime: false,
    criteriaMatches: false,
    testsMatch: false,
    resourceMatches: false,
    actorMatches: false,
    decisionRecordMatches: false,
    nonceRecordMatches: false,
  };
  let proposal:
    | {
        proposalId: string;
        actionType: string;
        decision: string;
        actorVerificationLevel: number;
        createdAt: string;
        expiresAt: string;
        consumedAt?: string;
      }
    | undefined;
  const result = () => ({
    valid: Object.values(checks).every(Boolean),
    approvalStatus: Object.values(checks).every(Boolean)
      ? "HUMAN_ATTESTED_FOR_DEMO"
      : "PENDING",
    proposalId: expectedProposalId || proposal?.proposalId || null,
    criteriaDigest,
    testDigest,
    proposal: proposal || null,
    checks,
    notice:
      "Level 1 manual demo attestation, not cryptographically verified human identity. No nonce/key is disclosed. Proposal TTL limits decision entry; a valid consumed criteria/test review remains reusable for identical digests.",
  });
  const row = ledger.db
    .prepare("SELECT data FROM criteria_revisions WHERE id=?")
    .get(criteriaDigest + ":" + testDigest) as { data: string } | undefined;
  try {
    const review = row ? JSON.parse(row.data) : null;
    const id = expectedProposalId || review?.proposalId;
    if (!id) return result();
    const p = ledger.getProposal(id, false);
    proposal = {
      proposalId: p.proposalId,
      actionType: p.actionType,
      decision: p.decision,
      actorVerificationLevel: p.actorVerificationLevel,
      createdAt: p.createdAt,
      expiresAt: p.expiresAt,
      consumedAt: p.consumedAt,
    };
    checks.reviewRecorded =
      !!review && review.decision === "HUMAN_ATTESTED_FOR_DEMO";
    checks.proposalMatches = !!review && review.proposalId === p.proposalId;
    checks.actionMatches = p.actionType === "CRITERIA_REVIEW";
    checks.levelOne =
      !!review &&
      review.actorVerificationLevel === 1 &&
      p.actorVerificationLevel === 1;
    checks.decisionConsumed =
      p.decision === "HUMAN_ATTESTED_FOR_DEMO" && !!p.consumedAt;
    checks.consumedWithinLifetime =
      !!p.consumedAt &&
      Date.parse(p.consumedAt) >= Date.parse(p.createdAt) &&
      Date.parse(p.consumedAt) < Date.parse(p.expiresAt);
    checks.actorMatches =
      !!review &&
      typeof review.actorRef === "string" &&
      review.actorRef.trim().length > 0 &&
      p.humanActorRef === review.actorRef;
    const proposed = ledger.db
      .prepare("SELECT data FROM criteria_revisions WHERE id=?")
      .get("proposal:" + p.proposalId) as { data: string } | undefined;
    if (!proposed) return result();
    const content = JSON.parse(proposed.data);
    const decision = ledger.db
      .prepare("SELECT data FROM decisions WHERE proposal_id=?")
      .get(p.proposalId) as { data: string } | undefined;
    checks.criteriaMatches =
      content.criteriaDigest === criteriaDigest &&
      hashObject(content.criteria) === criteriaDigest;
    checks.testsMatch = content.testDigest === testDigest;
    checks.resourceMatches = hashObject(content) === p.resourceDigest;
    const recorded = decision ? JSON.parse(decision.data) : null;
    checks.decisionRecordMatches =
      !!recorded && hashObject(recorded) === hashObject(p);
    checks.nonceRecordMatches =
      !!recorded &&
      recorded.nonceDigest === p.nonceDigest &&
      recorded.proposalId === p.proposalId;
  } catch {
    // Missing/corrupt/wrong-scope records cannot establish eligibility.
  }
  return result();
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
  const prior = ledger.latestAssessment(runId);
  if (prior) {
    const value = prior;
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
