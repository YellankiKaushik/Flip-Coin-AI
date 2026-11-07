import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
const root = process.cwd(),
  criteriaPath = "fixtures/scenarios/corrected/criteria/approved.json",
  testPath = "apps/checkout-demo/tests/checkout.spec.ts";
const text = (p) =>
  fs.readFileSync(path.join(root, p), "utf8").replace(/^\ufeff/, "");
const hash = (p) =>
  createHash("sha256")
    .update(fs.readFileSync(path.join(root, p)))
    .digest("hex");
const before = {
  criteriaSha256: hash(criteriaPath),
  testSha256: hash(testPath),
};
const reportPath =
  ".local/verification/human-review-vitest-" + randomUUID() + ".json";
fs.mkdirSync(path.join(root, ".local/verification"), { recursive: true });
const prepared = spawnSync(
  process.execPath,
  [
    "--import",
    "tsx",
    "apps/cli/src/main.ts",
    "prepare",
    "--scenario",
    "corrected",
    "--candidate",
    "human-review-" + randomUUID(),
    "--json",
  ],
  { cwd: root, encoding: "utf8", windowsHide: true, timeout: 60000 },
);
if (prepared.error || prepared.status !== 0)
  throw new Error(
    "Review snapshot preparation failed: " + prepared.stderr + prepared.stdout,
  );
const snapshot = JSON.parse(prepared.stdout).data;
const argv = [
  path.join(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "--config",
  path.join(snapshot.root, "vitest.candidate.ts"),
  "--reporter=json",
  "--outputFile",
  path.join(root, reportPath),
];
const start = Date.now();
const result = spawnSync(process.execPath, argv, {
  cwd: snapshot.root,
  encoding: "utf8",
  windowsHide: true,
  timeout: 60000,
  maxBuffer: 1048576,
});
if (result.error) throw result.error;
if (!fs.existsSync(path.join(root, reportPath)))
  throw new Error("Actual Vitest report missing");
if (
  before.criteriaSha256 !== hash(criteriaPath) ||
  before.testSha256 !== hash(testPath)
)
  throw new Error("Review inputs changed during execution");
const report = JSON.parse(text(reportPath));
const cases = report.testResults.flatMap((t) => t.assertionResults || []);
const execution = {
  executedAt: new Date(start).toISOString(),
  durationMs: Date.now() - start,
  command: ["node", ...argv],
  exitStatus: result.status,
  ...before,
  snapshotId: snapshot.snapshotId,
  candidateDigest: snapshot.candidateDigest,
  source: "frozen corrected scenario fixtures/current/app/coupon.ts",
  couponSha256: createHash("sha256")
    .update(
      fs.readFileSync(
        path.join(snapshot.root, "fixtures/current/app/coupon.ts"),
      ),
    )
    .digest("hex"),
  total: report.numTotalTests,
  passed: report.numPassedTests,
  failed: report.numFailedTests,
  reportPath,
};
fs.writeFileSync(
  path.join(root, ".local/verification/human-review-execution.json"),
  JSON.stringify(execution, null, 2),
);
const fence = (language, value) =>
  "~~~" + language + "\n" + value.trim() + "\n~~~";
const packet = [
  "# HUMAN REVIEW PACKET — PENDING",
  "",
  "No human approval has been recorded. The user explicitly withheld approval and requested this packet. Ordinary development tests grant no approval.",
  "",
  "## 1. Exact acceptance criteria",
  "",
  criteriaPath +
    ". The filename follows the specification; its actual status is PENDING.",
  "",
  fence("json", text(criteriaPath)),
  "",
  "## 2. Actual test cases",
  "",
  testPath + ":",
  "",
  fence("typescript", text(testPath)),
  "",
  "## 3. Expected behavior",
  "",
  "- At or after the strict UTC expiry timestamp: EXPIRED_COUPON and unchanged subtotal.",
  "- One millisecond before expiry: SAVE100 subtracts 100 integer cents, with minimum zero.",
  "- Invalid/missing/ill-formed UTC timestamps reject with INVALID_TIME; negative, fractional, nonfinite or unsafe integer subtotals reject with INVALID_AMOUNT.",
  "- No payment provider or real customer data is involved. Unknown coupon handling exists but is outside the five proposed criteria.",
  "",
  "## 4. Differences and explicit decisions",
  "",
  "- Expiry boundary, before/at/after checks, strict cents, malformed inputs and actual Vitest align with protected architecture sections 8.5 and 55.2.",
  "- SAVE100, fixed 100-cent discount and zero clamping fill UNSPECIFIED business details; they are implementation decisions awaiting review, not invented source requirements.",
  "- Requiring millisecond-Z UTC strings is a deterministic parser decision. A broader ISO-8601 format was not silently assumed.",
  "- Test AC-004 now also exercises undefined expiration and missing/invalid now. This strengthens the stated missing-time check; no assertion was weakened.",
  "- Illustrative APPROVED fixture text has been replaced by PENDING, and production AcceptanceRelay requires a real matching criteria/test review record.",
  "",
  "## 5. Actual execution results",
  "",
  fence(
    "json",
    JSON.stringify(
      {
        ...execution,
        command: execution.command.map((arg) =>
          arg.replaceAll(root, "<project>"),
        ),
      },
      null,
      2,
    ),
  ),
  "",
  ...cases.map((c) => "- " + c.fullName + ": **" + c.status + "**."),
  "",
  "These are standalone corrected-fixture development tests, not an approved release. Earlier five-test engineering runs 4f7ca2f6-afaf-4bcb-bc13-c0d1cefe972d and 0c8ad110-6c18-41bb-b7f1-c2dadd3151c3 observed four FAIL and four PASS respectively, but both assessments stayed BLOCKED. Those historical snapshots do not establish current verifier validity.",
  "",
  "## 6. Unresolved risks and inconsistencies",
  "",
  "- Criteria approval remains PENDING. No human attestation, patch approval or final release decision exists.",
  "- Zero subtotal, zero-clamping and unknown coupon behavior remain outside the six proposed acceptance tests; separate engineering tests in tests/unit/checkout-edge-decisions.test.ts exercise those decisions without creating or extending human approval.",
  "- The strict timestamp format and chosen discount require human agreement; they are not commercial checkout requirements.",
  "- Level 1 same-account attestation cannot authenticate the reviewer cryptographically. Level 2 isolation is not implemented.",
  "- Dedicated SwitchForge command execution, real human correction and final readiness decision remain unverified. See FINAL_ENGINEERING_AUDIT.md for current service and integration observations.",
  "- Positive readiness cannot be demonstrated as a real approved release until this review is genuinely resolved. Independent engineering unit tests may use explicitly labelled synthetic state fixtures; they never create human decisions.",
  "",
  "The protected original architecture, rules PDF and PROJECT_ANALYSIS.md remain unchanged. No approval is inferred from this packet.",
  "",
].join("\n");
fs.writeFileSync(path.join(root, "HUMAN_REVIEW_PACKET.md"), packet);
console.log(JSON.stringify(execution));
process.exitCode = result.status || 0;
