import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { Ledger } from "../../../evidence/src/ledger.ts";
import { ArtifactStore } from "../../../evidence/src/artifact-store.ts";
import { canonical, hashObject } from "../../../evidence/src/canonical-json.ts";
import {
  checksSchema,
  ids,
  invariant,
  now,
  SfError,
  type CheckResult,
  type Run,
} from "../domain/models.ts";
import { readJson, safeId } from "../infrastructure/filesystem-guard.ts";
import { validateManifest } from "../infrastructure/hash-manifest.ts";
import { inventory } from "../infrastructure/toolchain.ts";
import { registeredChecks } from "../../../checks/src/index.ts";
import { watchSnapshot } from "../infrastructure/snapshot-watch.ts";
import {
  assess,
  assessBeforeFinalization,
  currentImplementationMatches,
  hasCriteriaReview,
} from "../../../release/src/assessment.ts";
function assertOperationalCompletion(results: CheckResult[], runId: string) {
  const codes = results.flatMap((r) => r.errors.map((e) => e.code));
  if (codes.includes("DEPENDENCY_UNAVAILABLE"))
    throw new SfError(
      "DEPENDENCY_UNAVAILABLE",
      "A required tool became unavailable; run evidence was preserved",
      3,
      [{ runId }],
    );
  if (codes.includes("SCANNER_TIMEOUT"))
    throw new SfError(
      "SCANNER_TIMEOUT",
      "A check timed out or exceeded execution bounds; run evidence was preserved",
      7,
      [{ runId }],
    );
}
export async function runChecks(
  root: string,
  ledger: Ledger,
  store: ArtifactStore,
  snapshotId: string,
  key: string,
) {
  safeId(key);
  const snapshot = ledger.getSnapshot(snapshotId);
  const requestDigest = hashObject({
    snapshotId,
    candidateDigest: snapshot.candidateDigest,
  });
  const existing = ledger.findRun(snapshot.candidateId, key);
  if (existing) {
    invariant(
      existing.requestDigest === requestDigest,
      "DUPLICATE_CONFLICT",
      "Key already used for different request",
      5,
    );
    assertOperationalCompletion(ledger.results(existing.runId), existing.runId);
    return {
      run: existing,
      results: ledger.results(existing.runId),
      assessment: await assess(root, ledger, store, existing.runId, false),
      reused: true,
    };
  }
  const lock = path.join(root, ".local/run.lock");
  let fd: number;
  try {
    fd = fs.openSync(lock, "wx", 0o600);
  } catch {
    throw new (await import("../domain/models.ts")).SfError(
      "DUPLICATE_CONFLICT",
      "Workspace run is locked",
      5,
    );
  }
  const lease = { pid: process.pid, createdAt: now(), leaseId: randomUUID() };
  fs.writeFileSync(fd, canonical(lease));
  fs.closeSync(fd);
  let run: Run | undefined;
  let snapshotWatch: ReturnType<typeof watchSnapshot> | undefined;
  const abort = new AbortController();
  const onInterrupt = () => abort.abort();
  process.once("SIGINT", onInterrupt);
  try {
    const inputPatterns = readJson(
      path.join(snapshot.root, "config/candidate-inputs.json"),
    ) as { include: string[]; exclude: string[] };
    snapshotWatch = watchSnapshot(
      snapshot.root,
      inputPatterns.include,
      inputPatterns.exclude,
    );
    invariant(
      validateManifest(
        snapshot.manifest,
        snapshot.candidateDigest,
        snapshot.root,
      ) && currentImplementationMatches(root, snapshot),
      "CANDIDATE_CHANGED",
      "Snapshot or verifier changed; prepare a new candidate",
      6,
    );
    invariant(
      hashObject(await inventory(root)) ===
        hashObject(snapshot.manifest.toolchain),
      "CANDIDATE_CHANGED",
      "Toolchain changed",
      6,
    );
    const cfg = checksSchema.parse(
      readJson(path.join(snapshot.root, "config/effective-checks.json")),
    );
    let gitSha: string | null = null;
    try {
      gitSha = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
        windowsHide: true,
      }).trim();
    } catch {}
    const previous = ledger
      .listRuns()
      .filter((r) => r.candidateId === snapshot.candidateId)
      .at(-1);
    run = {
      runId: randomUUID(),
      snapshotId,
      candidateId: snapshot.candidateId,
      candidateDigest: snapshot.candidateDigest,
      key,
      requestDigest,
      status: "CREATED",
      createdAt: now(),
      gitSha,
      criteriaRevision: snapshot.manifest.criteriaRevision,
      policyDigest: snapshot.manifest.policyDigest,
      toolchainDigest: hashObject(snapshot.manifest.toolchain),
      ...(previous ? { supersedesRunId: previous.runId } : {}),
    };
    ledger.transaction(() => ledger.insertRun(run!));
    store.put(
      run.runId,
      "candidate-manifest.json",
      canonical(snapshot.manifest),
    );
    run.status = "VALIDATING";
    ledger.updateRun(run);
    run.status = "RUNNING";
    ledger.updateRun(run);
    const deadlineEpochMs = Date.now() + cfg.overallTimeoutMs;
    for (const id of ids) {
      invariant(
        !snapshotWatch.changed() &&
          validateManifest(
            snapshot.manifest,
            snapshot.candidateDigest,
            snapshot.root,
          ),
        "CANDIDATE_CHANGED",
        "Snapshot changed before check",
        6,
      );
      ledger.audit("CheckStarted", run.runId, { checkId: id });
      const result = await registeredChecks[id].run({
        root,
        snapshot,
        runId: run.runId,
        store,
        deadlineEpochMs,
        criteriaReviewed: hasCriteriaReview(ledger, snapshot),
        abortSignal: abort.signal,
      });
      invariant(
        !abort.signal.aborted,
        "PROCESS_INTERRUPTED",
        "Operator interrupted run",
        130,
      );
      invariant(
        !snapshotWatch.changed() &&
          validateManifest(
            snapshot.manifest,
            snapshot.candidateDigest,
            snapshot.root,
          ),
        "CANDIDATE_CHANGED",
        "Snapshot changed during check",
        6,
      );
      ledger.putResult(result);
    }
    invariant(
      !snapshotWatch.changed(),
      "CANDIDATE_CHANGED",
      "Snapshot changed during run",
      6,
    );
    run.status = "COMPLETED";
    run.finishedAt = now();
    ledger.updateRun(run);
    store.put(run.runId, "run.json", canonical(run));
    const assessment = await assessBeforeFinalization(
      root,
      ledger,
      store,
      run.runId,
    );
    invariant(
      !snapshotWatch.changed(),
      "CANDIDATE_CHANGED",
      "Snapshot changed during final assessment",
      6,
    );
    store.put(run.runId, "assessment.json", canonical(assessment));
    const events = ledger.db
      .prepare("SELECT data FROM audit_events WHERE run_id=? ORDER BY rowid")
      .all(run.runId) as { data: string }[];
    store.put(
      run.runId,
      "audit-events.jsonl",
      events.map((e) => e.data).join("\n"),
      "application/x-ndjson",
    );
    store.put(
      run.runId,
      "evidence-index.json",
      canonical(
        ledger.db
          .prepare(
            "SELECT path,data FROM artifacts WHERE run_id=? ORDER BY path",
          )
          .all(run.runId),
      ),
    );
    const artifactRows = ledger.db
      .prepare("SELECT data FROM artifacts WHERE run_id=? ORDER BY path")
      .all(run.runId) as { data: string }[];
    store.put(
      run.runId,
      "completion.json",
      canonical({
        schemaVersion: 1,
        runId: run.runId,
        artifacts: artifactRows.map((r) => JSON.parse(r.data)),
      }),
    );
    assertOperationalCompletion(ledger.results(run.runId), run.runId);
    return {
      run,
      results: ledger.results(run.runId),
      assessment,
      reused: false,
    };
  } catch (e) {
    if (run && run.status !== "COMPLETED" && run.status !== "INTERRUPTED") {
      run.status = "INTERRUPTED";
      run.finishedAt = now();
      ledger.updateRun(run);
      ledger.audit("RunInterrupted", run.runId, {
        message: e instanceof Error ? e.message : "Error",
      });
    }
    throw e;
  } finally {
    process.removeListener("SIGINT", onInterrupt);
    snapshotWatch?.close();
    try {
      const owner = readJson(lock) as typeof lease;
      if (owner.leaseId === lease.leaseId) fs.unlinkSync(lock);
    } catch {}
  }
}
