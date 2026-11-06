import Database from "better-sqlite3";
import fs from "node:fs";
import { sanitizedJson } from "../../core/src/public/infrastructure.ts";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  snapshotSchema,
  proposalSchema,
  assessmentSchema,
} from "../../core/src/public/domain.ts";
import { canonical, hashObject } from "./canonical-json.ts";
import { confined } from "../../core/src/public/infrastructure.ts";
import { databasePath } from "../../core/src/public/infrastructure.ts";
import {
  now,
  invariant,
  resultSchema,
  runSchema,
  type Run,
  type Snapshot,
  type CheckResult,
  type Proposal,
  type Assessment,
} from "../../core/src/public/domain.ts";
function decode<T>(schema: z.ZodType<T>, input: unknown, json = false): T {
  let value = input;
  try {
    if (json) value = JSON.parse(input as string);
  } catch {
    invariant(false, "EVIDENCE_CORRUPT", "Malformed persisted JSON", 6);
  }
  const parsed = schema.safeParse(value);
  invariant(
    parsed.success,
    "EVIDENCE_CORRUPT",
    "Malformed persisted entity",
    6,
  );
  return parsed.data;
}
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
  private validateSnapshot(input: Snapshot): Snapshot {
    const s = decode(snapshotSchema, input);
    invariant(
      s.candidateId === s.manifest.candidateId &&
        hashObject(s.manifest) === s.candidateDigest,
      "EVIDENCE_CORRUPT",
      "Snapshot manifest binding mismatch",
      6,
    );
    try {
      const expected = confined(this.root, ".local/snapshots/" + s.snapshotId);
      invariant(
        fs.realpathSync(s.root) === fs.realpathSync(expected),
        "EVIDENCE_CORRUPT",
        "Snapshot root outside registry",
        6,
      );
    } catch {
      invariant(
        false,
        "EVIDENCE_CORRUPT",
        "Snapshot root unavailable or outside registry",
        6,
      );
    }
    return s;
  }
  auditJsonLines(runId: string): string {
    const rows = this.db
      .prepare("SELECT data FROM audit_events WHERE run_id=? ORDER BY rowid")
      .all(runId) as { data: string }[];
    return rows.map((r) => r.data).join("\n");
  }
  artifactRows(runId: string): { path: string; data: string }[] {
    return this.db
      .prepare("SELECT path,data FROM artifacts WHERE run_id=? ORDER BY path")
      .all(runId) as { path: string; data: string }[];
  }
  putSnapshot(input: Snapshot) {
    const s = this.validateSnapshot(input);
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
      .prepare("SELECT candidate_id,data FROM snapshots WHERE id=?")
      .get(id) as { candidate_id: string; data: string } | undefined;
    invariant(row, "INVALID_INPUT", "Unknown snapshot");
    const s = this.validateSnapshot(decode(snapshotSchema, row.data, true));
    invariant(
      s.snapshotId === id && s.candidateId === row.candidate_id,
      "EVIDENCE_CORRUPT",
      "Snapshot contradicts indexed identity",
      6,
    );
    return s;
  }
  snapshots(): Snapshot[] {
    return (
      this.db.prepare("SELECT id FROM snapshots ORDER BY rowid").all() as {
        id: string;
      }[]
    ).map((r) => this.getSnapshot(r.id));
  }
  getRun(id: string): Run {
    const row = this.db.prepare("SELECT * FROM runs WHERE id=?").get(id) as
      | {
          id: string;
          candidate_id: string;
          snapshot_id: string;
          idempotency_key: string;
          request_digest: string;
          status: string;
          data: string;
        }
      | undefined;
    invariant(row, "INVALID_INPUT", "Unknown run");
    const r = decode(runSchema, row.data, true);
    invariant(
      r.runId === row.id &&
        r.candidateId === row.candidate_id &&
        r.snapshotId === row.snapshot_id &&
        r.key === row.idempotency_key &&
        r.requestDigest === row.request_digest &&
        r.status === row.status,
      "EVIDENCE_CORRUPT",
      "Run payload contradicts indexed identity",
      6,
    );
    return r;
  }
  listRuns(): Run[] {
    return (
      this.db.prepare("SELECT id FROM runs ORDER BY rowid").all() as {
        id: string;
      }[]
    ).map((r) => this.getRun(r.id));
  }
  findRun(candidate: string, key: string): Run | undefined {
    const row = this.db
      .prepare("SELECT id FROM runs WHERE candidate_id=? AND idempotency_key=?")
      .get(candidate, key) as { id: string } | undefined;
    return row ? this.getRun(row.id) : undefined;
  }
  insertRun(run: Run) {
    decode(runSchema, run);
    const snapshot = this.getSnapshot(run.snapshotId);
    invariant(
      run.candidateId === snapshot.candidateId &&
        run.candidateDigest === snapshot.candidateDigest,
      "EVIDENCE_CORRUPT",
      "Run snapshot binding mismatch",
      6,
    );
    const previousRuns = this.listRuns()
      .filter((r) => r.candidateId === run.candidateId)
      .map((r) => r.runId);
    for (const row of this.db
      .prepare("SELECT id FROM approval_requests")
      .all() as { id: string }[]) {
      const p = this.getProposal(row.id);
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
    decode(runSchema, run);
    const previous = this.getRun(run.runId);
    invariant(
      !["COMPLETED", "INTERRUPTED"].includes(previous.status),
      "INVALID_INPUT",
      "Terminal run is immutable",
    );
    const {
      status: _oldStatus,
      finishedAt: _oldFinished,
      ...oldIdentity
    } = previous;
    const {
      status: _newStatus,
      finishedAt: _newFinished,
      ...newIdentity
    } = run;
    invariant(
      hashObject(oldIdentity) === hashObject(newIdentity),
      "EVIDENCE_CORRUPT",
      "Run identity is immutable",
      6,
    );
    const allowed: Record<string, string[]> = {
      CREATED: ["VALIDATING", "INTERRUPTED"],
      VALIDATING: ["RUNNING", "INTERRUPTED"],
      RUNNING: ["COMPLETED", "INTERRUPTED"],
    };
    invariant(
      allowed[previous.status]?.includes(run.status),
      "INVALID_INPUT",
      "Invalid run state transition",
    );
    this.db
      .prepare("UPDATE runs SET status=?,data=? WHERE id=?")
      .run(run.status, canonical(run), run.runId);
  }
  putResult(result: CheckResult) {
    decode(resultSchema, result);
    const run = this.getRun(result.runId);
    invariant(
      result.candidateDigest === run.candidateDigest,
      "EVIDENCE_CORRUPT",
      "Result candidate binding mismatch",
      6,
    );
    invariant(
      run.status === "RUNNING",
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
          "SELECT run_id,check_id,attempt,data FROM check_results WHERE run_id=? ORDER BY check_id,attempt",
        )
        .all(id) as {
        run_id: string;
        check_id: string;
        attempt: number;
        data: string;
      }[]
    ).map((r) => {
      const result = decode(resultSchema, r.data, true);
      invariant(
        result.runId === r.run_id &&
          result.checkId === r.check_id &&
          result.attempt === r.attempt &&
          result.candidateDigest === this.getRun(id).candidateDigest,
        "EVIDENCE_CORRUPT",
        "Malformed or misindexed check result",
        6,
      );
      return result;
    });
  }
  private validateAssessment(input: Assessment): Assessment {
    const a = decode(assessmentSchema, input);
    const { assessmentDigest, ...payload } = a;
    invariant(
      hashObject(payload) === assessmentDigest &&
        this.getRun(a.runId).candidateDigest === a.candidateDigest,
      "EVIDENCE_CORRUPT",
      "Assessment digest or candidate binding mismatch",
      6,
    );
    return a;
  }
  latestAssessment(runId: string): Assessment | undefined {
    const row = this.db
      .prepare(
        "SELECT id,run_id,data FROM assessments WHERE run_id=? ORDER BY rowid DESC LIMIT 1",
      )
      .get(runId) as { id: string; run_id: string; data: string } | undefined;
    if (!row) return undefined;
    const a = this.validateAssessment(decode(assessmentSchema, row.data, true));
    invariant(
      a.assessmentId === row.id && a.runId === row.run_id,
      "EVIDENCE_CORRUPT",
      "Assessment contradicts indexed identity",
      6,
    );
    return a;
  }
  putAssessment(input: Assessment) {
    const a = this.validateAssessment(input);
    this.db
      .prepare("INSERT INTO assessments VALUES(?,?,?)")
      .run(a.assessmentId, a.runId, canonical(a));
    this.audit("AssessmentComputed", a.runId, {
      digest: a.assessmentDigest,
      readiness: a.readiness,
    });
  }
  proposal(input: Proposal) {
    const p = decode(proposalSchema, input);
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
    const p = decode(proposalSchema, row.data, true);
    invariant(
      p.proposalId === id,
      "EVIDENCE_CORRUPT",
      "Proposal contradicts indexed identity",
      6,
    );
    if (p.decision === "REQUESTED" && Date.parse(p.expiresAt) <= Date.now()) {
      p.decision = "EXPIRED";
      this.updateProposal(p);
      this.audit("ApprovalExpired", null, { proposalId: p.proposalId });
    }
    return p;
  }
  proposals(): Proposal[] {
    return (
      this.db
        .prepare("SELECT id FROM approval_requests ORDER BY rowid")
        .all() as { id: string }[]
    ).map((row) => this.getProposal(row.id));
  }
  updateProposal(input: Proposal) {
    const p = decode(proposalSchema, input);
    const row = this.db
      .prepare("SELECT data FROM approval_requests WHERE id=?")
      .get(p.proposalId) as { data: string } | undefined;
    invariant(row, "APPROVAL_STALE", "Unknown proposal", 8);
    const prior = decode(proposalSchema, row.data, true);
    const scope = (value: Proposal) => {
      const {
        decision,
        consumedAt,
        humanActorRef,
        actorVerificationLevel,
        ...binding
      } = value;
      return binding;
    };
    invariant(
      hashObject(scope(prior)) === hashObject(scope(p)),
      "EVIDENCE_CORRUPT",
      "Proposal scope is immutable",
      6,
    );
    this.db
      .prepare("UPDATE approval_requests SET data=? WHERE id=?")
      .run(canonical(p), p.proposalId);
  }
}
