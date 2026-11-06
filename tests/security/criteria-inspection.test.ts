import { test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { Ledger } from "../../packages/evidence/src/ledger.ts";
import {
  canonical,
  hashObject,
  sha256,
} from "../../packages/evidence/src/canonical-json.ts";
import {
  hasCriteriaReview,
  inspectCriteriaReview,
} from "../../packages/release/src/assessment.ts";
import type {
  Proposal,
  Snapshot,
} from "../../packages/core/src/domain/models.ts";

// Artificial records in an isolated temporary ledger ONLY. Never real human authority.
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sf-test-only-review-"));
  const ledger = new Ledger(root);
  const relative = "fixtures/scenarios/corrected/criteria/approved.json";
  const testPath = "apps/checkout-demo/tests/checkout.spec.ts";
  for (const file of [relative, testPath]) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.copyFileSync(path.join(process.cwd(), file), path.join(root, file));
  }
  const criteria = JSON.parse(
    fs.readFileSync(path.join(root, relative), "utf8"),
  );
  const content = {
    criteria,
    criteriaDigest: hashObject(criteria),
    testDigest: sha256(fs.readFileSync(path.join(root, testPath))),
    criteriaPath: relative,
    testPath,
  };
  const p: Proposal = {
    proposalId: randomUUID(),
    actionType: "CRITERIA_REVIEW",
    candidateDigest: "",
    assessmentDigest: "",
    policyDigest: "",
    resourceDigest: hashObject(content),
    requesterRef: "TEST_ONLY",
    humanActorRef: "TEST_ONLY",
    actorVerificationLevel: 1,
    createdAt: "2020-01-01T00:00:00.000Z",
    expiresAt: "2020-01-01T00:15:00.000Z",
    consumedAt: "2020-01-01T00:01:00.000Z",
    nonceDigest: sha256("TEST_ONLY_NOT_AN_AUTHENTICATOR"),
    decision: "HUMAN_ATTESTED_FOR_DEMO",
    evidenceRefs: [relative, testPath],
  };
  const review = {
    decision: p.decision,
    actorVerificationLevel: 1,
    actorRef: "TEST_ONLY",
    proposalId: p.proposalId,
    decidedAt: p.consumedAt,
  };
  ledger.proposal(p);
  ledger.db
    .prepare("INSERT INTO criteria_revisions VALUES(?,?)")
    .run("proposal:" + p.proposalId, canonical(content));
  const reviewKey = content.criteriaDigest + ":" + content.testDigest;
  ledger.db
    .prepare("INSERT INTO criteria_revisions VALUES(?,?)")
    .run(reviewKey, canonical(review));
  ledger.db
    .prepare("INSERT INTO decisions VALUES(?,?)")
    .run(p.proposalId, canonical(p));
  const inspect = () =>
    inspectCriteriaReview(
      ledger,
      content.criteriaDigest,
      content.testDigest,
      p.proposalId,
    );
  return {
    root,
    ledger,
    relative,
    testPath,
    content,
    p,
    review,
    reviewKey,
    inspect,
  };
}

test("consumed review remains valid after proposal TTL; snapshot and inspection share validation; repeated reads do not write", () => {
  const f = fixture();
  const changes = f.ledger.db.prepare("SELECT total_changes() AS n").get();
  expect(f.inspect().valid).toBe(true);
  expect(f.inspect().checks.nonceRecordMatches).toBe(true);
  expect(
    hasCriteriaReview(f.ledger, { manifest: f.content } as unknown as Snapshot),
  ).toBe(true);
  expect(f.ledger.db.prepare("SELECT total_changes() AS n").get()).toEqual(
    changes,
  );
  expect(fs.existsSync(path.join(f.root, ".local/attestation.key"))).toBe(
    false,
  );
  const output = JSON.stringify(f.inspect());
  expect(output).not.toContain(f.p.nonceDigest);
  expect(output).not.toContain("TEST_ONLY");
  f.ledger.close();
});

test.each([
  "missing-review",
  "missing-proposal",
  "missing-content",
  "missing-decision",
  "wrong-proposal",
  "wrong-action",
  "wrong-level",
  "rejected",
  "unconsumed",
  "late-consumption",
  "wrong-actor",
  "changed-criteria",
  "changed-tests",
  "resource-mismatch",
  "nonce-mismatch",
  "decision-mismatch",
  "malformed-review",
])("canonical review rejects %s", (fault) => {
  const f = fixture();
  const p = { ...f.p },
    review = { ...f.review },
    content = { ...f.content };
  if (fault === "missing-review")
    f.ledger.db
      .prepare("DELETE FROM criteria_revisions WHERE id=?")
      .run(f.reviewKey);
  if (fault === "missing-proposal") {
    f.ledger.db.prepare("DELETE FROM decisions").run();
    f.ledger.db.prepare("DELETE FROM approval_requests").run();
  }
  if (fault === "missing-content")
    f.ledger.db
      .prepare("DELETE FROM criteria_revisions WHERE id=?")
      .run("proposal:" + p.proposalId);
  if (fault === "missing-decision")
    f.ledger.db.prepare("DELETE FROM decisions").run();
  if (fault === "wrong-proposal") review.proposalId = randomUUID();
  if (fault === "wrong-action") p.actionType = "PATCH_REVIEW";
  if (fault === "wrong-level") p.actorVerificationLevel = 2;
  if (fault === "rejected") p.decision = "REJECTED";
  if (fault === "unconsumed") delete p.consumedAt;
  if (fault === "late-consumption") p.consumedAt = p.expiresAt;
  if (fault === "wrong-actor") review.actorRef = "DIFFERENT_TEST_ACTOR";
  if (fault === "changed-criteria") content.criteriaDigest = sha256("changed");
  if (fault === "changed-tests") content.testDigest = sha256("changed");
  if (fault === "resource-mismatch") p.resourceDigest = sha256("changed");
  f.ledger.db
    .prepare("UPDATE approval_requests SET data=? WHERE id=?")
    .run(canonical(p), p.proposalId);
  if (!["missing-review", "malformed-review"].includes(fault))
    f.ledger.db
      .prepare("UPDATE criteria_revisions SET data=? WHERE id=?")
      .run(canonical(review), f.reviewKey);
  if (fault === "malformed-review")
    f.ledger.db
      .prepare("UPDATE criteria_revisions SET data=? WHERE id=?")
      .run("{", f.reviewKey);
  f.ledger.db
    .prepare("UPDATE criteria_revisions SET data=? WHERE id=?")
    .run(canonical(content), "proposal:" + p.proposalId);
  const decision = { ...p };
  if (fault === "nonce-mismatch")
    decision.nonceDigest = sha256("different nonce");
  if (fault === "decision-mismatch") decision.humanActorRef = "different";
  f.ledger.db
    .prepare("UPDATE decisions SET data=? WHERE proposal_id=?")
    .run(canonical(decision), p.proposalId);
  expect(f.inspect().valid).toBe(false);
  expect(
    hasCriteriaReview(f.ledger, { manifest: f.content } as unknown as Snapshot),
  ).toBe(false);
  f.ledger.close();
});

test("expired pending proposal inspection cannot consume or transition it", () => {
  const f = fixture();
  const pending = { ...f.p, decision: "REQUESTED", actorVerificationLevel: 0 };
  delete pending.humanActorRef;
  delete pending.consumedAt;
  f.ledger.db
    .prepare("UPDATE approval_requests SET data=? WHERE id=?")
    .run(canonical(pending), pending.proposalId);
  const before = f.ledger.db.serialize();
  expect(f.inspect().valid).toBe(false);
  expect(f.ledger.db.serialize()).toEqual(before);
  f.ledger.close();
  const readOnly = new Ledger(f.root, true);
  expect(readOnly.getProposal(pending.proposalId).decision).toBe("REQUESTED");
  expect(readOnly.db.serialize()).toEqual(before);
  readOnly.close();
});

test("actual CLI inspection reads current files, rejects unsafe flags/paths, leaves logical ledger unchanged and cannot write", () => {
  const f = fixture();
  const before = f.ledger.db.serialize();
  f.ledger.close();
  const call = (args: string[]) =>
    spawnSync(
      process.execPath,
      [
        "--import",
        pathToFileURL(
          path.join(process.cwd(), "node_modules/tsx/dist/loader.mjs"),
        ).href,
        path.join(process.cwd(), "apps/cli/src/main.ts"),
        "criteria",
        "inspect",
        ...args,
        "--json",
      ],
      { cwd: f.root, encoding: "utf8", windowsHide: true },
    );
  const args = ["--proposal", f.p.proposalId, "--file", f.relative];
  const good = call(args);
  expect(good.status, good.stdout + good.stderr).toBe(0);
  expect(JSON.parse(good.stdout).data.valid).toBe(true);
  fs.appendFileSync(path.join(f.root, f.testPath), "\n// TEST_ONLY drift\n");
  const drift = call(args);
  expect(drift.status).toBe(0);
  expect(JSON.parse(drift.stdout).data.valid).toBe(false);
  expect(call([...args, "--reject"]).status).toBe(2);
  expect(
    call(["--proposal", f.p.proposalId, "--file", "../outside.json"]).status,
  ).toBe(2);
  expect(
    call(["--proposal", randomUUID(), "--file", f.relative]).stdout,
  ).toContain('"valid":false');
  const readOnly = new Ledger(f.root, true);
  expect(readOnly.db.serialize()).toEqual(before);
  expect(() => readOnly.audit("TEST_ONLY", null)).toThrow();
  readOnly.close();
  expect(fs.existsSync(path.join(f.root, ".local/attestation.key"))).toBe(
    false,
  );
});
