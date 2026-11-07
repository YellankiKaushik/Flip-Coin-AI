import { registeredChecks } from "../../../packages/checks/src/index.ts";
import { assessBeforeFinalization } from "../../../packages/release/src/index.ts";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { parseArgs } from "node:util";
import { randomUUID } from "node:crypto";
import { Ledger } from "../../../packages/evidence/src/index.ts";
import { ArtifactStore } from "../../../packages/evidence/src/index.ts";
import {
  canonical,
  hashObject,
  sha256,
} from "../../../packages/evidence/src/index.ts";
import {
  prepare,
  validateManifest,
} from "../../../packages/core/src/public/infrastructure.ts";
import { inventory } from "../../../packages/core/src/public/infrastructure.ts";
import {
  resolveChecks,
  validateEnvironment,
} from "../../../packages/core/src/public/infrastructure.ts";
import { runChecks } from "../../../packages/core/src/public/coordinator.ts";
import {
  confined,
  readJson,
  atomicWrite,
  safeId,
} from "../../../packages/core/src/public/infrastructure.ts";
import {
  SfError,
  invariant,
  criteriaSchema,
  now,
} from "../../../packages/core/src/public/domain.ts";
import {
  assess,
  verifyResults,
  currentImplementationMatches,
  hasCriteriaReview,
  inspectCriteriaReview,
} from "../../../packages/release/src/index.ts";
import {
  createProposal,
  releaseRequest,
  interactiveAttest,
  effectiveReleaseDecision,
} from "../../../packages/release/src/index.ts";
const root = fs.realpathSync(process.cwd());
const correlationId = randomUUID();
const originalArgs = process.argv.slice(2);
let ledger: Ledger | undefined;
function redact(text: string) {
  for (const value of [root, os.homedir()]) {
    text = text
      .replaceAll(value, "<local-path>")
      .replaceAll(value.replaceAll("\\", "\\\\"), "<local-path>")
      .replaceAll(value.replaceAll("\\", "/"), "<local-path>");
  }
  return text.replace(
    /(?:sk-[a-zA-Z0-9_-]{12,}|Bearer\s+[a-zA-Z0-9._-]+)/g,
    "<redacted-token>",
  );
}
async function main() {
  const parsed = parseArgs({
    args: originalArgs,
    allowPositionals: true,
    strict: true,
    options: {
      json: { type: "boolean" },
      "dry-run": { type: "boolean" },
      reject: { type: "boolean" },
      scenario: { type: "string" },
      candidate: { type: "string" },
      snapshot: { type: "string" },
      key: { type: "string" },
      run: { type: "string" },
      before: { type: "string" },
      after: { type: "string" },
      file: { type: "string" },
      proposal: { type: "string" },
      runs: { type: "string" },
      output: { type: "string" },
      "timeout-ms": { type: "string" },
      "browser-timeout-ms": { type: "string" },
      "max-output-bytes": { type: "string" },
      "sample-url": { type: "string" },
    },
  });
  const words = parsed.positionals;
  let command = words[0];
  if (command === "criteria" || command === "patch") command += " " + words[1];
  invariant(
    words.length === (command?.includes(" ") ? 2 : 1),
    "INVALID_INPUT",
    "Exactly one command is required",
  );
  const grammar: Record<string, string[]> = {
    doctor: [],
    prepare: [
      "scenario",
      "candidate",
      "timeout-ms",
      "browser-timeout-ms",
      "max-output-bytes",
      "sample-url",
    ],
    "criteria show": ["candidate"],
    "criteria inspect": ["proposal", "file"],
    "criteria propose": ["file"],
    "criteria attest": ["proposal", "reject"],
    "patch propose": ["file", "snapshot"],
    "patch attest": ["proposal", "reject"],
    run: ["snapshot", "key"],
    report: ["run"],
    compare: ["before", "after"],
    "verify-evidence": ["run"],
    "release-request": ["run"],
    "release-attest": ["proposal", "reject"],
    recover: ["run"],
    "export-demo": ["runs", "output"],
    purge: ["before", "dry-run"],
    "assert-ready": ["run"],
  };
  invariant(command in grammar, "INVALID_INPUT", "Unknown command");
  for (const key of Object.keys(parsed.values))
    invariant(
      key === "json" || grammar[command].includes(key),
      "INVALID_INPUT",
      "Flag not valid for this command: " + key,
    );
  const arg = (key: string) => {
    const value = parsed.values[key as keyof typeof parsed.values];
    invariant(
      typeof value === "string" && value.length > 0,
      "INVALID_INPUT",
      "Missing --" + key,
    );
    return value;
  };
  validateEnvironment(root);
  if (command === "doctor") {
    const tools = await inventory(root);
    return {
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
      tools,
      effectiveChecks: resolveChecks(root),
      approvalSecurityLevel: 1,
      warning:
        "Human actor identity is not cryptographically verified; real Switch execution remains a separate manual gate.",
    };
  }
  ledger = new Ledger(root, command === "criteria inspect");
  const store = new ArtifactStore(root, ledger);
  switch (command) {
    case "prepare": {
      const overrides: Record<string, unknown> = {};
      for (const [flag, key] of [
        ["timeout-ms", "timeoutMs"],
        ["browser-timeout-ms", "browserTimeoutMs"],
        ["max-output-bytes", "maxOutputBytes"],
      ] as const)
        if (parsed.values[flag] !== undefined) {
          invariant(
            /^\d+$/.test(parsed.values[flag]!),
            "INVALID_INPUT",
            "Override must be an integer",
          );
          overrides[key] = Number(parsed.values[flag]);
        }
      if (parsed.values["sample-url"])
        overrides.sampleUrl = parsed.values["sample-url"];
      return prepare(
        root,
        ledger,
        arg("scenario"),
        arg("candidate"),
        overrides,
      );
    }
    case "run":
      return runChecks(root, ledger, store, arg("snapshot"), arg("key"), {
        checks: registeredChecks,
        assess: (id) => assess(root, ledger!, store, id, false),
        assessBeforeFinalization: (id) =>
          assessBeforeFinalization(root, ledger!, store, id),
        currentImplementationMatches,
        hasCriteriaReview: (snapshot) => hasCriteriaReview(ledger!, snapshot),
      });
    case "report": {
      const id = arg("run");
      const run = ledger.getRun(id);
      const assessment = await assess(root, ledger, store, id, false);
      const decisions = ledger
        .proposals()
        .filter(
          (p) =>
            p.actionType === "RELEASE_READINESS" && p.evidenceRefs[0] === id,
        )
        .map((p) => ({
          ...p,
          effectiveDecision: effectiveReleaseDecision(p, assessment),
        }));
      return {
        run,
        results: ledger.results(id),
        assessment,
        decisionState: decisions.at(-1)?.effectiveDecision || "PENDING",
        decisions,
        historicalNotice:
          "Evidence describes this frozen candidate, not an unchecked mutable working tree.",
      };
    }
    case "verify-evidence": {
      const id = arg("run"),
        run = ledger.getRun(id),
        s = ledger.getSnapshot(run.snapshotId);
      const valid =
        validateManifest(s.manifest, s.candidateDigest, s.root) &&
        currentImplementationMatches(root, s) &&
        verifyResults(id, ledger.results(id), store) &&
        hashObject(await inventory(root)) === hashObject(s.manifest.toolchain);
      invariant(
        valid,
        "EVIDENCE_CORRUPT",
        "Missing, stale or invalid run evidence",
        6,
      );
      return { runId: id, valid: true };
    }
    case "compare": {
      const before = arg("before"),
        after = arg("after");
      const a = await assess(root, ledger, store, before, false),
        b = await assess(root, ledger, store, after, false);
      return {
        before: { run: ledger.getRun(before), assessment: a },
        after: { run: ledger.getRun(after), assessment: b },
        changes: ["acceptance", "accessibility", "contract", "data"].map(
          (checkId) => ({
            checkId,
            before:
              ledger!.results(before).find((r) => r.checkId === checkId)
                ?.status || "MISSING",
            after:
              ledger!.results(after).find((r) => r.checkId === checkId)
                ?.status || "MISSING",
          }),
        ),
      };
    }
    case "criteria inspect": {
      const criteria = criteriaSchema.parse(
        readJson(confined(root, arg("file"))),
      );
      const test = confined(root, "apps/checkout-demo/tests/checkout.spec.ts");
      return ledger.db.transaction(() =>
        inspectCriteriaReview(
          ledger!,
          hashObject(criteria),
          sha256(fs.readFileSync(test)),
          arg("proposal"),
        ),
      )();
    }
    case "criteria show": {
      const snapshots = ledger
        .snapshots()
        .filter((s) => s.candidateId === arg("candidate"));
      invariant(snapshots.length, "INVALID_INPUT", "Unknown candidate");
      const s = snapshots.at(-1)!;
      return {
        criteria: readJson(
          confined(s.root, "fixtures/current/criteria/approved.json"),
        ),
        criteriaDigest: s.manifest.criteriaDigest,
        testDigest: s.manifest.testDigest,
        reviewRequired: !hasCriteriaReview(ledger, s),
        approvalStatus: hasCriteriaReview(ledger, s)
          ? "HUMAN_ATTESTED_FOR_DEMO"
          : "PENDING",
        notice: "APPROVED fixture data does not authenticate a human review.",
      };
    }
    case "criteria propose": {
      const relative = arg("file"),
        criteria = criteriaSchema.parse(readJson(confined(root, relative))),
        testFile = "apps/checkout-demo/tests/checkout.spec.ts";
      const content = {
        criteria,
        criteriaDigest: hashObject(criteria),
        testDigest: sha256(fs.readFileSync(confined(root, testFile))),
        criteriaPath: relative,
        testPath: testFile,
      };
      const p = createProposal(ledger, "CRITERIA_REVIEW", hashObject(content), {
        evidenceRefs: [relative, testFile],
      });
      ledger.db
        .prepare("INSERT INTO criteria_revisions VALUES(?,?)")
        .run("proposal:" + p.proposalId, canonical(content));
      return {
        proposal: p,
        content,
        notice:
          "Pending actual human criteria AND test review. Fixture approval is not human authorization.",
      };
    }
    case "criteria attest":
      return interactiveAttest(
        root,
        ledger,
        store,
        arg("proposal"),
        "CRITERIA_REVIEW",
        !!parsed.values.reject,
      );
    case "patch propose": {
      const s = ledger.getSnapshot(arg("snapshot"));
      const relative = arg("file");
      const bytes = fs.readFileSync(confined(root, relative));
      return createProposal(ledger, "PATCH_REVIEW", sha256(bytes), {
        candidateDigest: s.candidateDigest,
        evidenceRefs: [relative, s.snapshotId],
      });
    }
    case "patch attest": {
      const p = ledger.getProposal(arg("proposal"));
      invariant(
        sha256(fs.readFileSync(confined(root, p.evidenceRefs[0]))) ===
          p.resourceDigest,
        "APPROVAL_STALE",
        "Patch changed",
        8,
      );
      return interactiveAttest(
        root,
        ledger,
        store,
        p.proposalId,
        "PATCH_REVIEW",
        !!parsed.values.reject,
      );
    }
    case "release-request":
      return releaseRequest(root, ledger, store, arg("run"));
    case "release-attest":
      return interactiveAttest(
        root,
        ledger,
        store,
        arg("proposal"),
        "RELEASE_READINESS",
        !!parsed.values.reject,
      );
    case "assert-ready": {
      const a = await assess(root, ledger, store, arg("run"), false);
      invariant(
        a.readiness === "READY_FOR_HUMAN_APPROVAL",
        "APPROVAL_STALE",
        "Release is blocked",
        8,
      );
      return a;
    }
    case "recover": {
      const run = ledger.getRun(arg("run"));
      invariant(
        !["COMPLETED", "INTERRUPTED"].includes(run.status),
        "INVALID_INPUT",
        "Terminal runs are immutable",
      );
      const lock = path.join(root, ".local/run.lock");
      if (fs.existsSync(lock)) {
        const owner = readJson(lock) as { pid: number };
        invariant(
          Number.isInteger(owner.pid) && owner.pid > 0,
          "INVALID_INPUT",
          "Invalid lock owner",
        );
        let live = true;
        try {
          process.kill(owner.pid, 0);
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code === "ESRCH") live = false;
        }
        invariant(
          !live,
          "DUPLICATE_CONFLICT",
          "Owner process is still alive or cannot be verified dead",
          5,
        );
        fs.unlinkSync(lock);
      }
      run.status = "INTERRUPTED";
      run.finishedAt = now();
      ledger.updateRun(run);
      ledger.audit("RunInterrupted", run.runId, { recovered: true });
      return run;
    }
    case "purge": {
      invariant(
        parsed.values["dry-run"],
        "UNAUTHORIZED_ACTION",
        "Only purge preview is implemented; deletion requires separate human authorization",
        4,
      );
      const threshold = Date.parse(arg("before"));
      invariant(
        Number.isFinite(threshold),
        "INVALID_INPUT",
        "Invalid retention date",
      );
      return {
        dryRun: true,
        runs: ledger
          .listRuns()
          .filter((r) => Date.parse(r.createdAt) < threshold)
          .map((r) => ({ runId: r.runId, createdAt: r.createdAt })),
        deleted: 0,
      };
    }
    case "export-demo": {
      const output = arg("output"),
        target = confined(root, output, false);
      invariant(
        !fs.existsSync(target),
        "INVALID_INPUT",
        "Export target must be new",
      );
      const runs = arg("runs").split(",");
      const exported: {
        path: string;
        sha256: string;
        sizeBytes: number;
        originalSha256?: string;
      }[] = [];
      for (const id of runs) {
        safeId(id);
        const run = ledger.getRun(id),
          s = ledger.getSnapshot(run.snapshotId);
        invariant(
          validateManifest(s.manifest, s.candidateDigest, s.root) &&
            verifyResults(id, ledger.results(id), store),
          "EVIDENCE_CORRUPT",
          "Cannot export invalid evidence",
          6,
        );
      }
      fs.mkdirSync(target, { recursive: true });
      for (const id of runs) {
        const rows = ledger.db
          .prepare(
            "SELECT path,data FROM artifacts WHERE run_id=? ORDER BY path",
          )
          .all(id) as { path: string; data: string }[];
        for (const row of rows) {
          const ref = JSON.parse(row.data);
          const original = fs.readFileSync(
            confined(store.directory(id), row.path),
          );
          const bytes =
            ref.mediaType === "image/png"
              ? original
              : Buffer.from(
                  redact(original.toString("utf8")).replace(
                    /"(?:humanActorRef|actorRef)"\s*:\s*"[^"]*"/g,
                    '"actorRef":"<redacted-reviewer>"',
                  ),
                );
          const rel = id + "/" + row.path;
          atomicWrite(confined(target, rel, false), bytes);
          exported.push({
            path: rel,
            sha256: sha256(bytes),
            sizeBytes: bytes.length,
            originalSha256: ref.sha256,
          });
        }
      }
      atomicWrite(
        path.join(target, "export-manifest.json"),
        canonical({
          schemaVersion: 1,
          createdAt: now(),
          redacted: true,
          warning:
            "Export hashes identify exported bytes; original hashes refer to private source artifacts.",
          files: exported,
        }),
      );
      return { output, files: exported.length, runs };
    }
    default:
      throw new SfError("INVALID_INPUT", "Unknown command");
  }
}
try {
  const data = await main();
  process.stdout.write(
    canonical({ schemaVersion: 1, ok: true, correlationId, data }) + "\n",
  );
} catch (error) {
  const invalid =
    error instanceof Error &&
    (error.name === "ZodError" ||
      error.name === "TypeError" ||
      ("code" in error && String(error.code).startsWith("ERR_PARSE_ARGS")));
  const e =
    error instanceof SfError
      ? error
      : new SfError(
          invalid ? "INVALID_INPUT" : "INTERNAL_ERROR",
          error instanceof Error ? error.message : "Internal failure",
          invalid ? 2 : 9,
        );
  try {
    ledger?.audit("CommandRejectedOrFailed", null, {
      correlationId,
      errorCode: e.code,
    });
  } catch {
    /* Preserve the original error if the ledger itself failed. */
  }
  process.stdout.write(
    canonical({
      schemaVersion: 1,
      ok: false,
      correlationId,
      error: {
        code: e.code,
        message: redact(e.message),
        retryable: false,
        details: e.details,
      },
    }) + "\n",
  );
  process.exitCode = e.exitCode;
} finally {
  ledger?.close();
}
