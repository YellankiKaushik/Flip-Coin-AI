import Database from "better-sqlite3";
import fs from "node:fs";
import { sanitizedJson } from "../../core/src/infrastructure/redaction.ts";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { canonical } from "./canonical-json.ts";
import { confined } from "../../core/src/infrastructure/filesystem-guard.ts";
import { databasePath } from "../../core/src/infrastructure/configuration.ts";
import {
  now,
  invariant,
  resultSchema,
  type Run,
  type Snapshot,
  type CheckResult,
  type Proposal,
  type Assessment,
} from "../../core/src/domain/models.ts";
export class Ledger {
  readonly db: Database.Database;
  constructor(readonly root: string) {
    confined(root, ".local", false);
    fs.mkdirSync(path.join(root, ".local"), { recursive: true });
    const database = databasePath(root);
    fs.mkdirSync(path.dirname(database), { recursive: true });
    this.db = new Database(database);
    this.db.pragma("foreign_keys=ON");
    this.db.pragma("busy_timeout=5000");
    this.db.pragma("journal_mode=WAL");
    this.db.pragma("synchronous=FULL");
    this.db
      .transaction(() =>
        this.db.exec(
          fs.readFileSync(
            new URL("./migrations/001_init.sql", import.meta.url),
            "utf8",
          ),
        ),
      )
      .immediate();
    invariant(
      this.db.pragma("foreign_keys", { simple: true }) === 1,
      "INTERNAL_ERROR",
      "Foreign key enforcement unavailable",
      9,
    );
  }
  close() {
    this.db.close();
  }
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn).immediate();
  }
  audit(type: string, runId: string | null, details: unknown = {}) {
    const event = {
      schemaVersion: 1,
      eventId: randomUUID(),
      runId,
      correlationId: runId || randomUUID(),
      timestamp: now(),
      type,
      details,
    };
    this.db
      .prepare("INSERT INTO audit_events VALUES(?,?,?)")
      .run(event.eventId, runId, canonical(sanitizedJson(event)));
    return event;
  }
  putSnapshot(s: Snapshot) {
    this.transaction(() => {
      this.db
        .prepare("INSERT OR IGNORE INTO candidates VALUES(?)")
        .run(s.candidateId);
      this.db
        .prepare("INSERT INTO snapshots VALUES(?,?,?)")
        .run(s.snapshotId, s.candidateId, canonical(s));
    });
  }
  getSnapshot(id: string): Snapshot {
    const row = this.db
      .prepare("SELECT data FROM snapshots WHERE id=?")
      .get(id) as { data: string } | undefined;
    invariant(row, "INVALID_INPUT", "Unknown snapshot");
    const snapshot = JSON.parse(row.data) as Snapshot;
    invariant(
      snapshot.snapshotId === id && /^[a-f0-9-]{36}$/.test(id),
      "EVIDENCE_CORRUPT",
      "Invalid snapshot identity",
      6,
    );
    const expected = confined(this.root, ".local/snapshots/" + id);
    invariant(
      fs.realpathSync(snapshot.root) === fs.realpathSync(expected),
      "EVIDENCE_CORRUPT",
      "Snapshot root outside registry",
      6,
    );
    return snapshot;
  }
  snapshots(): Snapshot[] {
    return (
      this.db.prepare("SELECT data FROM snapshots ORDER BY rowid").all() as {
        data: string;
      }[]
    ).map((r) => JSON.parse(r.data));
  }
  getRun(id: string): Run {
    const row = this.db.prepare("SELECT data FROM runs WHERE id=?").get(id) as
      { data: string } | undefined;
    invariant(row, "INVALID_INPUT", "Unknown run");
    return JSON.parse(row.data);
  }
  listRuns(): Run[] {
    return (
      this.db.prepare("SELECT data FROM runs ORDER BY rowid").all() as {
        data: string;
      }[]
    ).map((r) => JSON.parse(r.data));
  }
  findRun(candidate: string, key: string): Run | undefined {
    const row = this.db
      .prepare(
        "SELECT data FROM runs WHERE candidate_id=? AND idempotency_key=?",
      )
      .get(candidate, key) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : undefined;
  }
  insertRun(run: Run) {
    const previousRuns = this.listRuns()
      .filter((r) => r.candidateId === run.candidateId)
      .map((r) => r.runId);
    for (const row of this.db
      .prepare("SELECT data FROM approval_requests")
      .all() as { data: string }[]) {
      const p = JSON.parse(row.data) as Proposal;
      if (
        p.actionType === "RELEASE_READINESS" &&
        previousRuns.includes(p.evidenceRefs[0]) &&
        ["REQUESTED", "HUMAN_ATTESTED_FOR_DEMO", "APPROVED_FOR_DEMO"].includes(
          p.decision,
        )
      ) {
        p.decision = "SUPERSEDED";
        this.updateProposal(p);
        this.audit("ApprovalSuperseded", run.runId, {
          proposalId: p.proposalId,
        });
      }
    }
    this.db
      .prepare("INSERT INTO runs VALUES(?,?,?,?,?,?,?)")
      .run(
        run.runId,
        run.candidateId,
        run.snapshotId,
        run.key,
        run.requestDigest,
        run.status,
        canonical(run),
      );
    this.audit("RunCreated", run.runId);
  }
  updateRun(run: Run) {
    const previous = this.getRun(run.runId);
    invariant(
      !["COMPLETED", "INTERRUPTED"].includes(previous.status),
      "INVALID_INPUT",
      "Terminal run is immutable",
    );
    this.db
      .prepare("UPDATE runs SET status=?,data=? WHERE id=?")
      .run(run.status, canonical(run), run.runId);
  }
  putResult(result: CheckResult) {
    resultSchema.parse(result);
    invariant(
      this.getRun(result.runId).status === "RUNNING",
      "INVALID_INPUT",
      "Results require an active run",
    );
    this.db
      .prepare("INSERT INTO check_results VALUES(?,?,?,?)")
      .run(result.runId, result.checkId, result.attempt, canonical(result));
    this.audit("CheckCompleted", result.runId, {
      checkId: result.checkId,
      status: result.status,
    });
  }
  results(id: string): CheckResult[] {
    return (
      this.db
        .prepare(
          "SELECT data FROM check_results WHERE run_id=? ORDER BY check_id,attempt",
        )
        .all(id) as { data: string }[]
    ).map((r) => JSON.parse(r.data));
  }
  putAssessment(a: Assessment) {
    this.db
      .prepare("INSERT INTO assessments VALUES(?,?,?)")
      .run(a.assessmentId, a.runId, canonical(a));
    this.audit("AssessmentComputed", a.runId, {
      digest: a.assessmentDigest,
      readiness: a.readiness,
    });
  }
  proposal(p: Proposal) {
    this.db
      .prepare("INSERT INTO approval_requests VALUES(?,?)")
      .run(p.proposalId, canonical(p));
    this.audit("ApprovalRequested", null, {
      proposalId: p.proposalId,
      actionType: p.actionType,
    });
  }
  getProposal(id: string): Proposal {
    const row = this.db
      .prepare("SELECT data FROM approval_requests WHERE id=?")
      .get(id) as { data: string } | undefined;
    invariant(row, "APPROVAL_STALE", "Unknown proposal", 8);
    const p = JSON.parse(row.data) as Proposal;
    if (p.decision === "REQUESTED" && Date.parse(p.expiresAt) <= Date.now()) {
      p.decision = "EXPIRED";
      this.updateProposal(p);
      this.audit("ApprovalExpired", null, { proposalId: p.proposalId });
    }
    return p;
  }
  updateProposal(p: Proposal) {
    this.db
      .prepare("UPDATE approval_requests SET data=? WHERE id=?")
      .run(canonical(p), p.proposalId);
  }
}
