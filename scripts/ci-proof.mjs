import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { spawnSync, execFileSync } from "node:child_process";

const jobs = {
  "dependency-install": [["ci"], ["audit", "--audit-level=high", "--json"]],
  typecheck: [
    ["run", "typecheck"],
    ["run", "format:check"],
  ],
  unit: [["run", "test:unit", "--", "--reporter=json"]],
  "integration-checks": [
    ["run", "test:integration", "--", "--reporter=json"],
    ["run", "test:e2e:local", "--", "--reporter=json"],
  ],
  "security-smoke": [["run", "test:security", "--", "--reporter=json"]],
  "artifact-contract": [
    [
      "exec",
      "--",
      "vitest",
      "run",
      "tests/integration/persistence.test.ts",
      "tests/security/persistence-boundaries.test.ts",
      "--reporter=json",
    ],
  ],
  "docs-link-check": [["run", "docs:check"]],
};
const job = process.argv[2];
if (!Object.hasOwn(jobs, job)) throw new Error("Unknown CI job");
const root = process.cwd();
const npmCli = process.env.npm_execpath;
if (!npmCli || !fs.existsSync(npmCli))
  throw new Error("Invoke through npm run ci:proof -- <job>");
const directory = path.join(root, ".local/ci", job);
fs.mkdirSync(directory, { recursive: true });
const redact = (text) => {
  let value = String(text);
  for (const local of [root, os.homedir()])
    for (const variant of [
      local,
      local.replaceAll("\\", "\\\\"),
      local.replaceAll("\\", "/"),
    ])
      value = value.replaceAll(variant, "<local-path>");
  return value.replace(
    /(?:sk-[a-zA-Z0-9_-]{12,}|Bearer\s+[a-zA-Z0-9._-]+)/g,
    "<redacted-token>",
  );
};
const receipts = [];
let failed = false;
const run = (args, name) => {
  const startedAt = new Date().toISOString(),
    started = Date.now();
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    timeout: 600000,
    maxBuffer: 16 * 1024 * 1024,
  });
  const receipt = {
    command: "npm " + args.join(" "),
    startedAt,
    durationMs: Date.now() - started,
    exitStatus: result.status,
    signal: result.signal,
    error: result.error?.message,
    stdout: redact(result.stdout || ""),
    stderr: redact(result.stderr || ""),
  };
  fs.writeFileSync(
    path.join(directory, name + ".json"),
    JSON.stringify(receipt, null, 2),
  );
  receipts.push({
    command: receipt.command,
    exitStatus: result.status,
    startedAt,
    durationMs: receipt.durationMs,
    receipt: name + ".json",
  });
  if (result.status !== 0 || result.error) failed = true;
  console.log(
    JSON.stringify({
      job,
      command: receipt.command,
      exitStatus: result.status,
    }),
  );
  return result;
};
const doctor = run(
  ["--silent", "run", "sf", "--", "doctor", "--json"],
  "doctor",
);
let tools = [];
try {
  const parsed = JSON.parse(doctor.stdout);
  if (!parsed.ok || !Array.isArray(parsed.data?.tools))
    throw new Error("Invalid actual doctor report");
  tools = parsed.data.tools;
  if (
    !["chromium", "oasdiff"].every((name) =>
      tools.some(
        (t) =>
          t.name === name &&
          typeof t.version === "string" &&
          t.version !== "UNKNOWN",
      ),
    )
  )
    throw new Error("Missing actual tool versions");
} catch {
  failed = true;
}
for (const [i, configuredArgs] of jobs[job].entries()) {
  const args = [...configuredArgs];
  const rawReport = ".local/ci-raw/" + job + "-" + i + ".json";
  const hasReport = args.includes("--reporter=json");
  if (hasReport) {
    fs.mkdirSync(path.dirname(rawReport), { recursive: true });
    args.push("--outputFile", rawReport);
  }
  run(args, "command-" + i);
  if (hasReport) {
    try {
      const bytes = fs.readFileSync(rawReport);
      const report = JSON.parse(bytes.toString("utf8"));
      const published = redact(bytes.toString("utf8"));
      fs.writeFileSync(path.join(directory, "tests-" + i + ".json"), published);
      receipts.at(-1).testSummary = {
        total: report.numTotalTests,
        passed: report.numPassedTests,
        failed: report.numFailedTests,
        skipped: report.numPendingTests,
        originalSha256: createHash("sha256").update(bytes).digest("hex"),
        publishedSha256: createHash("sha256").update(published).digest("hex"),
      };
      if (
        !report.success ||
        !(report.numTotalTests > 0) ||
        report.numFailedTests !== 0 ||
        report.numPendingTests !== 0
      )
        failed = true;
    } catch (error) {
      failed = true;
      fs.writeFileSync(
        path.join(directory, "report-error-" + i + ".json"),
        JSON.stringify({ error: redact(error.message) }),
      );
    }
  }
}
const metadata = {
  schemaVersion: 1,
  scope:
    process.env.GITHUB_ACTIONS === "true" ? "GitHub Actions" : "LOCAL_ONLY",
  gitSha: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
    windowsHide: true,
  }).trim(),
  workingTreeStatus: execFileSync("git", ["status", "--porcelain"], {
    encoding: "utf8",
    windowsHide: true,
  }).trim(),
  lockfileSha256: createHash("sha256")
    .update(fs.readFileSync("package-lock.json"))
    .digest("hex"),
  nodeVersion: process.version,
  browserVersion:
    tools.find((t) => t.name === "chromium")?.version || "UNAVAILABLE",
  oasdiffVersion:
    tools.find((t) => t.name === "oasdiff")?.version || "UNAVAILABLE",
  tools,
  ciJobId: process.env.GITHUB_JOB || "LOCAL_ONLY:" + job,
  ciRunId: process.env.GITHUB_RUN_ID || null,
  job,
  receipts,
  result: failed ? "FAILED" : "PASSED",
  timestamp: new Date().toISOString(),
};
fs.writeFileSync(
  path.join(directory, "metadata.json"),
  JSON.stringify(metadata, null, 2),
);
if (failed) process.exitCode = 1;
