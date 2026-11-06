import fs from "node:fs";
import path from "node:path";
import {
  randomUUID,
  randomBytes,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { createInterface } from "node:readline/promises";
import {
  confined,
  readJson,
} from "../../core/src/infrastructure/filesystem-guard.ts";
import {
  canonical,
  hashObject,
  sha256,
} from "../../evidence/src/canonical-json.ts";
import {
  invariant,
  now,
  type Proposal,
  type Action,
  type Assessment,
} from "../../core/src/domain/models.ts";
import type { Ledger } from "../../evidence/src/ledger.ts";
import type { ArtifactStore } from "../../evidence/src/artifact-store.ts";
import {
  assess,
  verifyResults,
  currentImplementationMatches,
  hasCriteriaReview,
} from "./assessment.ts";
import { validateManifest } from "../../core/src/infrastructure/hash-manifest.ts";
import { toolchainStillMatches } from "../../core/src/infrastructure/toolchain.ts";
export function effectiveReleaseDecision(
  p: Proposal,
  a: Assessment,
  at = Date.now(),
): Proposal["decision"] {
  const expiry = Date.parse(p.expiresAt);
  if (!Number.isFinite(expiry) || expiry <= at) return "EXPIRED";
  if (
    a.readiness !== "READY_FOR_HUMAN_APPROVAL" ||
    p.assessmentDigest !== a.assessmentDigest ||
    p.candidateDigest !== a.candidateDigest ||
    p.policyDigest !== a.policyDigest
  )
    return "SUPERSEDED";
  return p.decision;
}
function nonce(root: string, id: string) {
  const file = path.join(root, ".local/attestation.key");
  if (!fs.existsSync(file)) {
    const fd = fs.openSync(file, "wx", 0o600);
    try {
      fs.writeFileSync(fd, randomBytes(32));
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
  }
  return createHmac("sha256", fs.readFileSync(file)).update(id).digest("hex");
}
export function createProposal(
  ledger: Ledger,
  actionType: Action,
  resourceDigest: string,
  extra: {
    candidateDigest?: string;
    assessmentDigest?: string;
    policyDigest?: string;
    evidenceRefs?: string[];
  } = {},
): Proposal {
  const id = randomUUID();
  const p: Proposal = {
    proposalId: id,
    actionType,
    candidateDigest: extra.candidateDigest || "",
    assessmentDigest: extra.assessmentDigest || "",
    policyDigest: extra.policyDigest || "",
    resourceDigest,
    requesterRef: "local-verification-assistant",
    actorVerificationLevel: 0,
    createdAt: now(),
    expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
    nonceDigest: sha256(nonce(ledger.root, id)),
    decision: "REQUESTED",
    evidenceRefs: extra.evidenceRefs || [],
  };
  ledger.proposal(p);
  return p;
}
export async function releaseRequest(
  root: string,
  ledger: Ledger,
  store: ArtifactStore,
  runId: string,
) {
  const a = await assess(root, ledger, store, runId);
  invariant(
    a.readiness === "READY_FOR_HUMAN_APPROVAL",
    "APPROVAL_STALE",
    "Run is not ready for human review",
    8,
  );
  return createProposal(ledger, "RELEASE_READINESS", a.assessmentDigest, {
    candidateDigest: a.candidateDigest,
    assessmentDigest: a.assessmentDigest,
    policyDigest: a.policyDigest,
    evidenceRefs: [runId],
  });
}
export function validateDecision(
  p: Proposal,
  resourceDigest: string,
  nonceValue: string,
  at = Date.now(),
) {
  invariant(
    p.decision === "REQUESTED" && Date.parse(p.expiresAt) > at,
    "APPROVAL_STALE",
    "Proposal consumed, expired or not pending",
    8,
  );
  invariant(
    p.resourceDigest === resourceDigest,
    "APPROVAL_STALE",
    "Reviewed content changed",
    8,
  );
  const actual = Buffer.from(sha256(nonceValue), "hex"),
    expected = Buffer.from(p.nonceDigest, "hex");
  invariant(
    actual.length === expected.length && timingSafeEqual(actual, expected),
    "UNAUTHORIZED_ACTION",
    "Invalid one-time decision nonce",
    4,
  );
}
export async function interactiveAttest(
  root: string,
  ledger: Ledger,
  store: ArtifactStore,
  proposalId: string,
  expectedAction: Action,
  reject = false,
) {
  invariant(
    process.stdin.isTTY && process.stderr.isTTY,
    "UNAUTHORIZED_ACTION",
    "Human attestation requires an interactive local terminal; agent/noninteractive calls denied. Level 1 only.",
    4,
  );
  const before = ledger.getProposal(proposalId);
  invariant(
    before.actionType === expectedAction,
    "UNAUTHORIZED_ACTION",
    "Wrong review action scope",
    4,
  );
  process.stderr.write(
    "\nLEVEL 1 HUMAN ATTESTATION FOR SYNTHETIC DEMO ONLY. Actor identity is not cryptographically verified. Same OS account is not an independent reviewer boundary.\n" +
      canonical(before) +
      "\n",
  );
  const prompt = createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  let actor = "",
    answer = "";
  try {
    actor = await prompt.question("Human reviewer name/reference: ");
    answer = await prompt.question(
      reject
        ? "Type REJECT to reject this exact request: "
        : "After reviewing the referenced content, type HUMAN REVIEWED " +
            proposalId +
            " to attest: ",
    );
  } finally {
    prompt.close();
  }
  invariant(
    actor.trim().length > 0 &&
      answer === (reject ? "REJECT" : "HUMAN REVIEWED " + proposalId),
    "UNAUTHORIZED_ACTION",
    "Human confirmation was not provided",
    4,
  );
  let currentDigest = before.resourceDigest;
  if (expectedAction === "RELEASE_READINESS") {
    const a = await assess(root, ledger, store, before.evidenceRefs[0]);
    invariant(
      a.readiness === "READY_FOR_HUMAN_APPROVAL" &&
        a.assessmentDigest === before.assessmentDigest,
      "APPROVAL_STALE",
      "Assessment is no longer ready",
      8,
    );
    currentDigest = a.assessmentDigest;
  }
  return ledger.transaction(() => {
    const p = ledger.getProposal(proposalId);
    validateDecision(p, currentDigest, nonce(root, proposalId));
    if (p.actionType === "RELEASE_READINESS") {
      const run = ledger.getRun(p.evidenceRefs[0]),
        snapshot = ledger.getSnapshot(run.snapshotId);
      invariant(
        run.status === "COMPLETED" &&
          run.candidateDigest === p.candidateDigest &&
          snapshot.candidateDigest === p.candidateDigest &&
          snapshot.manifest.policyDigest === p.policyDigest &&
          p.assessmentDigest === currentDigest &&
          validateManifest(
            snapshot.manifest,
            snapshot.candidateDigest,
            snapshot.root,
          ) &&
          currentImplementationMatches(root, snapshot) &&
          toolchainStillMatches(root, snapshot.manifest.toolchain) &&
          verifyResults(run.runId, ledger.results(run.runId), store) &&
          hasCriteriaReview(ledger, snapshot),
        "APPROVAL_STALE",
        "Evidence changed before decision transaction",
        8,
      );
      const latest = ledger
        .listRuns()
        .filter((r) => r.candidateId === run.candidateId)
        .at(-1);
      invariant(
        latest?.runId === run.runId,
        "APPROVAL_STALE",
        "Newer run supersedes this assessment",
        8,
      );
    }
    if (p.actionType === "CRITERIA_REVIEW") {
      const record = ledger.db
        .prepare("SELECT data FROM criteria_revisions WHERE id=?")
        .get("proposal:" + proposalId) as { data: string } | undefined;
      invariant(
        record,
        "APPROVAL_STALE",
        "Criteria proposal content missing",
        8,
      );
      const content = JSON.parse(record.data);
      invariant(
        hashObject(content) === p.resourceDigest &&
          hashObject(readJson(confined(root, content.criteriaPath))) ===
            content.criteriaDigest &&
          sha256(fs.readFileSync(confined(root, content.testPath))) ===
            content.testDigest,
        "APPROVAL_STALE",
        "Criteria/test proposal changed",
        8,
      );
      if (!reject) {
        ledger.db
          .prepare("INSERT OR REPLACE INTO criteria_revisions VALUES(?,?)")
          .run(
            content.criteriaDigest + ":" + content.testDigest,
            canonical({
              decision: "HUMAN_ATTESTED_FOR_DEMO",
              actorVerificationLevel: 1,
              actorRef: actor,
              proposalId,
              decidedAt: now(),
            }),
          );
      }
    }
    if (p.actionType === "PATCH_REVIEW") {
      const base = ledger.getSnapshot(p.evidenceRefs[1]);
      invariant(
        base.candidateDigest === p.candidateDigest &&
          validateManifest(base.manifest, base.candidateDigest, base.root) &&
          currentImplementationMatches(root, base),
        "APPROVAL_STALE",
        "Patch base candidate changed",
        8,
      );
      invariant(
        sha256(fs.readFileSync(confined(root, p.evidenceRefs[0]))) ===
          p.resourceDigest,
        "APPROVAL_STALE",
        "Patch changed during review",
        8,
      );
    }
    validateDecision(p, currentDigest, nonce(root, proposalId));
    p.decision = reject ? "REJECTED" : "HUMAN_ATTESTED_FOR_DEMO";
    p.humanActorRef = actor.trim();
    p.actorVerificationLevel = 1;
    p.consumedAt = now();
    ledger.db
      .prepare("INSERT INTO decisions VALUES(?,?)")
      .run(p.proposalId, canonical(p));
    ledger.updateProposal(p);
    ledger.audit("ApprovalRecorded", null, {
      proposalId,
      decision: p.decision,
      actorVerificationLevel: 1,
    });
    return p;
  });
}
