import fs from "node:fs";
import { sanitizedJson } from "../../core/src/infrastructure/redaction.ts";
import path from "node:path";
import { z } from "zod";
import {
  runProcess,
  type RunnerResult,
} from "../../core/src/infrastructure/process-runner.ts";
import {
  readJson,
  confined,
} from "../../core/src/infrastructure/filesystem-guard.ts";
import { canonical } from "../../evidence/src/canonical-json.ts";
import {
  checksSchema,
  criteriaSchema,
  invariant,
  now,
  resultSchema,
  type CheckId,
  type CheckResult,
  type ArtifactRef,
} from "../../core/src/domain/models.ts";
import type { CheckContext } from "./check-runner.ts";
import { validateLocalSpec } from "./openapi.ts";
import { parseVitestReport, parseOasdiffReport } from "./report-parsers.ts";
import { oasdiffPath } from "../../core/src/infrastructure/configuration.ts";
const workerSchema = z
  .object({
    schemaVersion: z.literal(1),
    status: z.enum(["PASS", "FAIL"]),
    coverage: z.number().int().positive(),
    findings: z.array(
      z
        .object({
          code: z.string(),
          severity: z.literal("ERROR"),
          location: z.string(),
          message: z.string(),
        })
        .passthrough(),
    ),
  })
  .passthrough();
function completed(r: RunnerResult) {
  invariant(
    !r.spawnErrorCode,
    "DEPENDENCY_UNAVAILABLE",
    "Tool process could not start",
    3,
  );
  invariant(
    !r.timedOut && !r.outputTruncated && !r.spawnErrorCode && r.signal === null,
    "SCANNER_TIMEOUT",
    "Tool did not complete with bounded output",
    7,
  );
}
export async function executeCheck(
  id: CheckId,
  ctx: CheckContext,
): Promise<CheckResult> {
  const started = Date.now();
  const startedAt = now();
  const { snapshot: s, runId, store, root } = ctx;
  const cfg = checksSchema.parse(
    readJson(path.join(s.root, "config/effective-checks.json")),
  );
  const evidence: ArtifactRef[] = [];
  const version = (name: string) =>
    s.manifest.toolchain.find((t) => t.name === name)?.version || "UNKNOWN";
  let status: CheckResult["status"] = "ERROR",
    findings: CheckResult["findings"] = [],
    errors: CheckResult["errors"] = [],
    coverage = 0;
  const put = (
    name: string,
    bytes: string | Uint8Array,
    mediaType = "application/json",
  ) => {
    const ref = store.put(runId, "checks/" + id + "/" + name, bytes, mediaType);
    evidence.push(ref);
    return ref;
  };
  const invoke = async (
    exe: string,
    args: string[],
    name: string,
    timeout = cfg.timeoutMs,
  ) => {
    const allowed = [process.execPath, oasdiffPath(root)];
    const remaining = Math.min(timeout, ctx.deadlineEpochMs - Date.now());
    invariant(remaining > 0, "SCANNER_TIMEOUT", "Overall deadline exceeded", 7);
    const raw = await runProcess(
      exe,
      args,
      s.root,
      allowed,
      remaining,
      cfg.maxOutputBytes,
      ctx.abortSignal,
    );
    put(
      name + "-receipt.json",
      canonical({
        executable: path.basename(exe),
        argv: args.map((a) =>
          a.replaceAll(s.root, "<snapshot>").replaceAll(root, "<project>"),
        ),
        candidateDigest: s.candidateDigest,
        ...raw,
      }),
    );
    completed(raw);
    return raw;
  };
  try {
    if (id === "acceptance") {
      const criteria = criteriaSchema.parse(
        readJson(confined(s.root, "fixtures/current/criteria/approved.json")),
      );
      invariant(
        criteria.status !== "DRAFT" && ctx.criteriaReviewed,
        "UNAUTHORIZED_ACTION",
        "Actual human criteria AND test review is pending; fixture status is not authorization",
        4,
      );
      const output = path.join(
        root,
        ".local",
        "workers",
        runId + "-vitest.json",
      );
      fs.mkdirSync(path.dirname(output), { recursive: true });
      const raw = await invoke(
        process.execPath,
        [
          path.join(root, "node_modules/vitest/vitest.mjs"),
          "run",
          "--config",
          path.join(s.root, "vitest.candidate.ts"),
          "--reporter=json",
          "--outputFile",
          output,
        ],
        "vitest",
      );
      invariant(
        fs.existsSync(output),
        "INVALID_INPUT",
        "Missing Vitest report",
      );
      const bytes = fs.readFileSync(output);
      put("raw-report.json", bytes);
      const report = JSON.parse(bytes.toString("utf8"));
      const { cases, failed } = parseVitestReport(
        report,
        raw.exitCode,
        criteria.cases.map((c) => c.id),
      );
      coverage = cases.length;
      status = failed.length ? "FAIL" : "PASS";
      findings = failed.map((t: any) => ({
        code: "ACCEPTANCE_ASSERTION",
        severity: "ERROR",
        location: t.fullName,
        message: String(t.failureMessages?.[0] || "Approved test failed"),
      }));
    } else if (id === "contract") {
      const binary = oasdiffPath(root);
      for (const [i, rel] of [
        "fixtures/current/api/base.yaml",
        "fixtures/current/api/candidate.yaml",
      ].entries()) {
        validateLocalSpec(fs.readFileSync(confined(s.root, rel)));
        const valid = await invoke(
          binary,
          [
            "validate",
            "--config",
            "config/oasdiff.json",
            "--format",
            "json",
            "--allow-external-refs=false",
            rel,
          ],
          "validate-" + i,
        );
        const report = JSON.parse(valid.stdout);
        put("validation-" + i + ".json", valid.stdout);
        invariant(
          valid.exitCode === 0 && Array.isArray(report),
          "INVALID_INPUT",
          "Invalid OpenAPI specification",
        );
      }
      const raw = await invoke(
        binary,
        [
          "breaking",
          "--config",
          "config/oasdiff.json",
          "--fail-on",
          "ERR",
          "--format",
          "json",
          "--allow-external-refs=false",
          "fixtures/current/api/base.yaml",
          "fixtures/current/api/candidate.yaml",
        ],
        "oasdiff",
      );
      put("oasdiff.json", raw.stdout);
      const list = JSON.parse(raw.stdout);
      const blocking = parseOasdiffReport(list, raw.exitCode);
      status = blocking.length ? "FAIL" : "PASS";
      coverage = 1;
      findings = blocking.map((x: any) => ({
        code: x.id,
        severity: "ERROR",
        location: x.path,
        message: x.text,
      }));
    } else {
      const worker = path.join(s.root, "packages/checks/src/worker.ts");
      const raw = await invoke(
        process.execPath,
        [
          "--import",
          "tsx",
          worker,
          id,
          s.root,
          s.candidateDigest,
          canonical(cfg),
        ],
        id === "data" ? "csv" : "browser",
        id === "accessibility" ? cfg.browserTimeoutMs : cfg.timeoutMs,
      );
      invariant(
        raw.exitCode === 0,
        "INVALID_INPUT",
        "Worker failed: " + raw.stderr,
      );
      const parsed = workerSchema.parse(JSON.parse(raw.stdout));
      status = parsed.status;
      coverage = parsed.coverage;
      findings = parsed.findings.map((f) => ({
        code: f.code,
        severity: f.severity,
        location: f.location,
        message: f.message,
      }));
      if (id === "accessibility") {
        invariant(
          parsed.candidateDigest === s.candidateDigest &&
            parsed.browserVersion === version("chromium"),
          "EVIDENCE_CORRUPT",
          "Browser identity mismatch",
          6,
        );
        const { screenshot, ...rawReport } = parsed;
        put("axe-result.json", canonical(rawReport));
        invariant(
          typeof screenshot === "string",
          "INVALID_INPUT",
          "Missing screenshot",
        );
        put("screenshot.png", Buffer.from(screenshot, "base64"), "image/png");
      } else {
        put("reconciliation.json", canonical(parsed));
        invariant(
          typeof parsed.proposedCorrections === "string",
          "INVALID_INPUT",
          "Missing correction proposal",
        );
        put("proposed-corrections.csv", parsed.proposedCorrections, "text/csv");
      }
    }
  } catch (e) {
    status = "ERROR";
    errors = [
      {
        code:
          e instanceof Error && "code" in e
            ? String(e.code)
            : "CHECK_EXECUTION_ERROR",
        message: e instanceof Error ? e.message : "Check failed",
      },
    ];
    put("error.json", canonical(errors));
  }
  const toolName = {
    acceptance: "vitest",
    accessibility: "axe-core",
    contract: "oasdiff",
    data: "csv-parse",
  }[id];
  const result = resultSchema.parse({
    schemaVersion: 1,
    runId,
    checkId: id,
    attempt: 1,
    candidateDigest: s.candidateDigest,
    tool: { name: toolName, version: version(toolName) },
    status,
    startedAt,
    finishedAt: now(),
    durationMs: Date.now() - started,
    summary: id + ": " + status,
    findings,
    evidence,
    errors,
    coverage,
  });
  const normalized = sanitizedJson(result);
  put("result.json", canonical(normalized));
  return normalized;
}
