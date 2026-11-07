import { test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
const root = process.cwd(),
  cli = path.join(root, "apps/cli/src/main.ts");
const isolationId = randomUUID();
const isolatedEnv = {
  ...process.env,
  SF_DB_PATH: ".local/tests/" + isolationId + "/ledger.sqlite",
  SF_ARTIFACT_ROOT: "artifacts/tests/" + isolationId,
};
function sf(...args: string[]) {
  const r = spawnSync(
    process.execPath,
    ["--import", "tsx", cli, ...args, "--json"],
    {
      cwd: root,
      env: isolatedEnv,
      encoding: "utf8",
      timeout: 120000,
      windowsHide: true,
    },
  );
  expect(r.error).toBeUndefined();
  expect(r.stdout.trim().split("\n")).toHaveLength(1);
  return { exit: r.status, body: JSON.parse(r.stdout) };
}
test("live CLI scenarios preserve human review gate, real engines, idempotency and evidence", () => {
  const candidate = "e2e-pair-" + Date.now();
  const completed: any[] = [];
  for (const scenario of ["defective", "corrected"]) {
    const p = sf("prepare", "--scenario", scenario, "--candidate", candidate);
    expect(p.exit).toBe(0);
    if (scenario === "corrected")
      expect(
        sf(
          "run",
          "--snapshot",
          p.body.data.snapshotId,
          "--key",
          "first-defective",
        ).exit,
      ).toBe(5);
    const r = sf(
      "run",
      "--snapshot",
      p.body.data.snapshotId,
      "--key",
      "first-" + scenario,
    );
    expect(r.exit).toBe(0);
    expect(r.body.data.results).toHaveLength(4);
    expect(
      r.body.data.results.find((c: any) => c.checkId === "acceptance").status,
    ).toBe("ERROR");
    for (const id of ["accessibility", "contract", "data"])
      expect(
        r.body.data.results.find((c: any) => c.checkId === id).status,
      ).toBe(scenario === "defective" ? "FAIL" : "PASS");
    expect(r.body.data.assessment.readiness).toBe("BLOCKED");
    expect(r.body.data.assessment.blockers).toContain(
      "CRITERIA_AND_TEST_REVIEW_REQUIRED",
    );
    const id = r.body.data.run.runId;
    expect(sf("verify-evidence", "--run", id).body.data.valid).toBe(true);
    expect(sf("report", "--run", id).body.data.run.runId).toBe(id);
    const repeated = sf(
      "run",
      "--snapshot",
      p.body.data.snapshotId,
      "--key",
      "first-" + scenario,
    );
    expect(repeated.body.data.reused).toBe(true);
    expect(repeated.body.data.run.runId).toBe(id);
    expect(sf("release-request", "--run", id).exit).toBe(8);
    expect(sf("assert-ready", "--run", id).exit).toBe(8);
    expect(
      sf("criteria", "show", "--candidate", candidate).body.data.approvalStatus,
    ).toBe("PENDING");
    completed.push(r.body.data);
    fs.mkdirSync(path.join(root, ".local/verification"), { recursive: true });
    fs.writeFileSync(
      path.join(root, ".local/verification", "latest-" + scenario + ".json"),
      JSON.stringify(r.body, null, 2),
    );
  }
  expect(completed[0].run.candidateDigest).not.toBe(
    completed[1].run.candidateDigest,
  );
  const comparison = sf(
    "compare",
    "--before",
    completed[0].run.runId,
    "--after",
    completed[1].run.runId,
  );
  expect(comparison.body.data.changes).toHaveLength(4);
  expect(comparison.body.data.before.assessment.blockers).toContain(
    "SUPERSEDED_RUN",
  );
  const output = ".local/verification/export-" + Date.now();
  const exported = sf(
    "export-demo",
    "--runs",
    completed.map((c) => c.run.runId).join(","),
    "--output",
    output,
  );
  expect(exported.exit).toBe(0);
  expect(exported.body.data.files).toBeGreaterThan(10);
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, output, "export-manifest.json"), "utf8"),
  );
  expect(manifest.redacted).toBe(true);
  for (const file of manifest.files) {
    if (file.path.endsWith(".json") || file.path.endsWith(".jsonl"))
      expect(
        fs.readFileSync(path.join(root, output, file.path), "utf8"),
      ).not.toContain(root.replaceAll("\\", "\\\\"));
  }
}, 120000);

test("new source files inside a prepared snapshot cannot reuse the manifest", () => {
  const p = sf(
    "prepare",
    "--scenario",
    "corrected",
    "--candidate",
    "fault-injection-" + Date.now(),
  );
  expect(p.exit).toBe(0);
  fs.writeFileSync(
    path.join(p.body.data.root, "packages/core/src/domain/unmanifested.ts"),
    "// Explicit test-only mutation, not release source\n",
  );
  const r = sf("run", "--snapshot", p.body.data.snapshotId, "--key", "mutated");
  expect(r.exit).toBe(6);
  expect(r.body.error.code).toBe("CANDIDATE_CHANGED");
});
test("CLI unknown flags, invalid paths and unreviewed attestation fail closed", () => {
  expect(sf("doctor", "--invented").exit).toBe(2);
  expect(sf("prepare", "--scenario", "other", "--candidate", "test").exit).toBe(
    2,
  );
  expect(sf("criteria", "propose", "--file", "../escape").exit).toBe(2);
  expect(sf("criteria", "attest", "--proposal", "untrusted").exit).toBe(4);
  expect(sf("release-attest", "--proposal", "untrusted").exit).toBe(4);
  expect(sf("patch", "attest", "--proposal", "untrusted").exit).not.toBe(0);
  expect(
    sf("purge", "--before", "2026-01-01T00:00:00.000Z", "--dry-run").body.data
      .deleted,
  ).toBe(0);
});
