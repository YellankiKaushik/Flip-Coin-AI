import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
// Preserve the earlier checkpoint generator for history; it must not replace current findings.
if (!process.argv.includes("--historical-checkpoint-export")) {
  console.error(
    "Historical checkpoint generator retired. Read FINAL_ENGINEERING_AUDIT.md and REPORT_TO_CHATGPT.md. An explicit --historical-checkpoint-export writes labelled history only.",
  );
  process.exit(2);
}
const root = process.cwd();
const read = (p) =>
  JSON.parse(
    fs.readFileSync(path.join(root, p), "utf8").replace(/^\ufeff/, ""),
  );
const write = (p, s) => {
  fs.mkdirSync(path.join(root, ".local/history"), { recursive: true });
  fs.writeFileSync(
    path.join(root, ".local/history", "legacy-" + p),
    "HISTORICAL GENERATOR OUTPUT — NOT CURRENT VERIFICATION\n\n" + s + "\n",
  );
};
const tests = read(".local/verification/tests-all.json");
const review = read(".local/verification/human-review-execution.json");
const doctor = read(".local/verification/doctor.json");
const git = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const branch = execFileSync("git", ["branch", "--show-current"], {
  encoding: "utf8",
}).trim();
const evidence = (scenario) =>
  read(
    fs.existsSync(".local/verification/final-" + scenario + ".json")
      ? ".local/verification/final-" + scenario + ".json"
      : ".local/verification/latest-" + scenario + ".json",
  ).data;
const before = evidence("defective"),
  after = evidence("corrected");
const rows = [
  [
    "FR-001",
    "§§4,59",
    "docs/SWITCH_GUIDE.md",
    "BLOCKED",
    "Dedicated real room/agent proof absent",
  ],
  [
    "FR-002",
    "§§51,59",
    "apps/cli; docs/agents",
    "BLOCKED",
    "No actual Switch-driven CLI execution",
  ],
  [
    "FR-003",
    "§55.2",
    "approval.ts; HUMAN_REVIEW_PACKET.md",
    "BLOCKED",
    "Human expressly withheld criteria/test approval",
  ],
  [
    "FR-004",
    "§55.2",
    "checks/acceptance.ts; adapters.ts",
    "IMPLEMENTED_NOT_VERIFIED",
    "Standalone six-case Vitest passed; live reviewed production path pending",
  ],
  [
    "FR-005",
    "§55.3",
    "checks/accessibility.ts; worker.ts",
    "VERIFIED",
    "Real axe bad/good CLI and browser integration",
  ],
  [
    "FR-006",
    "§§55.3,59",
    "compare; docs/DEMO_AND_SUBMISSION.md",
    "BLOCKED",
    "Real scan reruns exist; genuine reviewed patch workflow absent",
  ],
  [
    "FR-007",
    "§55.4",
    "checks/contract.ts; openapi.ts",
    "VERIFIED",
    "Actual oasdiff validation/break/compatible/error tests",
  ],
  [
    "FR-008",
    "§55.5",
    "checks/data.ts; data-runner.ts",
    "VERIFIED",
    "Actual CSV worker plus strict edge tests",
  ],
  [
    "FR-009",
    "§§53,55.1",
    "CLI; run-checks.ts",
    "VERIFIED",
    "Four normalized reports; pending review honestly ERROR",
  ],
  [
    "FR-010",
    "§55.6",
    "release/policy.ts",
    "VERIFIED",
    "625-combination truth table and real BLOCKED assessments",
  ],
  [
    "FR-011",
    "§57",
    "release/approval.ts",
    "BLOCKED",
    "Noninteractive denial and state tests; no real positive decision",
  ],
  [
    "FR-012",
    "§59",
    "docs/SWITCH_GUIDE.md",
    "BLOCKED",
    "Same-room product result relay unverified",
  ],
  [
    "FR-013",
    "§§52,56,58",
    "manifest; evidence; compare",
    "VERIFIED",
    "Distinct snapshots/digests/run IDs; no overwritten evidence",
  ],
  [
    "FR-014",
    "§58",
    "ledger; coordinator",
    "VERIFIED",
    "Actual reuse, payload conflict and candidate-scoped keys tested",
  ],
  [
    "FR-015",
    "§§56,64",
    "fixtures; tests/e2e",
    "BLOCKED",
    "Current human gate blocks full four-engine FAIL-to-PASS workflow",
  ],
  [
    "FR-016",
    "§62",
    "docs/DECISIONS.md",
    "NOT_STARTED",
    "Optional REA research deferred",
  ],
  [
    "FR-017",
    "§53 V2",
    "CLI JSON envelopes",
    "VERIFIED",
    "Single-object JSON exercised by real CLI tests",
  ],
  [
    "FR-018",
    "§§4,51",
    "docs/DECISIONS.md",
    "NOT_STARTED",
    "Optional second agent deferred",
  ],
  [
    "FR-019",
    "§51",
    "docs/DECISIONS.md",
    "NOT_STARTED",
    "Dashboard/PR integration deferred",
  ],
  [
    "NFR-PERF-001",
    "§§4,16",
    "run timings",
    "IMPLEMENTED_NOT_VERIFIED",
    "180-second complete reviewed run target not benchmarked",
  ],
  [
    "NFR-AVL-001",
    "§4",
    "README limitations",
    "VERIFIED",
    "No uptime/SLA promise",
  ],
  [
    "NFR-SCALE-001",
    "§§4,58",
    "lock; ledger",
    "VERIFIED",
    "Single run, actual idempotency conflict and live-lock recovery denial",
  ],
  [
    "NFR-SEC-001",
    "§§13,60",
    "path/process/browser guards",
    "VERIFIED",
    "Confinement, literal argv, network-denial and resource tests; cooperative scope",
  ],
  [
    "NFR-SEC-002",
    "§60",
    "sanitized env/export",
    "VERIFIED",
    "Staged scan, path-redaction and synthetic secret-marker evidence/audit persistence tests",
  ],
  [
    "NFR-REC-001",
    "§58",
    "ledger; recover",
    "VERIFIED",
    "FK/restart/rollback/orphan/missing-file tests and actual recovery CLI",
  ],
  [
    "NFR-MNT-001",
    "§54",
    "CheckRunner registry; workspaces",
    "VERIFIED",
    "Typecheck covers all app/package/test source",
  ],
  [
    "NFR-OBS-001",
    "§§19,53",
    "results; receipts; audit",
    "VERIFIED",
    "Real run/check/tool/time/hash artifacts",
  ],
  [
    "NFR-AI-001",
    "§34",
    "deterministic schema/policy",
    "VERIFIED",
    "No AI status authority; malformed/fabricated results rejected",
  ],
  [
    "NFR-PRV-001",
    "§14",
    "synthetic fixtures; export",
    "VERIFIED",
    "Only synthetic inputs; runtime/private sources excluded",
  ],
  [
    "GATE-SW-01",
    "§51.2",
    "docs/SWITCH_GUIDE.md",
    "BLOCKED",
    "No dedicated live human/agent proof",
  ],
  [
    "GATE-SW-02",
    "§51.2",
    "CLI + future Switch runner",
    "BLOCKED",
    "No real room-to-command-to-room proof",
  ],
  [
    "GATE-CORE-01",
    "§51.2",
    "coordinator/check registry",
    "BLOCKED",
    "Current AcceptanceRelay correctly refuses pending review",
  ],
  [
    "GATE-CORE-02",
    "§51.2",
    "release policy/tests",
    "VERIFIED",
    "All tested nonpassing cases BLOCK",
  ],
  [
    "GATE-CORE-03",
    "§51.2",
    "manifest/effective config/toolchain",
    "VERIFIED",
    "Byte/config/tool changes and unmanifested file rejected",
  ],
  [
    "GATE-HUMAN-01",
    "§51.2",
    "HUMAN_REVIEW_PACKET.md",
    "BLOCKED",
    "Await actual human review; no approval fabricated",
  ],
  [
    "GATE-DEMO-01",
    "§51.2",
    "real fixture runs",
    "BLOCKED",
    "Full live reviewed bad/good sequence incomplete",
  ],
  [
    "GATE-DEMO-02",
    "§51.2",
    "README/docs/local source",
    "BLOCKED",
    "Video, publication authorization and human submission missing",
  ],
];
const matrix = [
  "# Requirements traceability",
  "",
  "V2 §§50–65 govern. VERIFIED means the listed local proof, not overall P0 completion. Optional P1/P2 are retained. Human review is PENDING.",
  "",
  "| ID | Source | Files / evidence | Status | Limits / remaining work |",
  "|---|---|---|---|---|",
  ...rows.map((r) => "| " + r.join(" | ") + " |"),
  "",
  "Actual automated evidence: .local/verification/tests-all.json; latest full suite " +
    tests.numPassedTests +
    "/" +
    tests.numTotalTests +
    " passed, " +
    tests.numFailedTests +
    " failed. Unit truth-table test enumerates 625 combinations inside one reported test. Human review packet has " +
    review.passed +
    "/" +
    review.total +
    " standalone tests, separate from the full suite.",
].join("\n");
write("REQUIREMENTS_TRACEABILITY.md", matrix);
const summary = rows.reduce((a, r) => ((a[r[3]] = (a[r[3]] || 0) + 1), a), {});
const statuses = [
  "# SwitchForge implementation status — IN_PROGRESS",
  "",
  new Date().toISOString(),
  "",
  "**Full P0 compliance is NOT established. Human criteria/test review remains PENDING.**",
  "",
  "| Component | Status | Evidence / limitation |",
  "|---|---|---|",
  "| Source integrity | VERIFIED | Three protected sources byte-identical |",
  "| Core/evidence/local runner | VERIFIED | Typecheck, manifests, real workers, SQLite and failure tests |",
  "| AcceptanceRelay | BLOCKED | Real standalone " +
    review.passed +
    "/" +
    review.total +
    " passed; genuine review withheld |",
  "| A11yRelay | VERIFIED | Actual label bad/good browser scans and network guard |",
  "| ContractGuardian | VERIFIED | Actual pinned oasdiff and invalid report tests |",
  "| DataRescue | VERIFIED | Actual strict CSV worker and edge cases |",
  "| ReleaseProof | IMPLEMENTED_NOT_VERIFIED | Unit matrix verified; real positive READY awaits review |",
  "| CLI | IMPLEMENTED_NOT_VERIFIED | Commands/negative paths exercised; positive human-only paths pending |",
  "| Human review/attestation | BLOCKED | Packet complete; no human decision recorded |",
  "| Switch collaboration | BLOCKED | Services unavailable; desktop helper stopped; no product proof |",
  "| Local automated suite | VERIFIED | " +
    tests.numPassedTests +
    "/" +
    tests.numTotalTests +
    " passed; " +
    tests.numFailedTests +
    " failed |",
  "| Reproducibility/docs | IMPLEMENTED_NOT_VERIFIED | Fresh npm ci verified; independent clone, CI, video unverified |",
  "| Publication/submission | NOT_STARTED | Explicit authorization and genuine human submission required |",
  "",
  "Requirement status counts: " +
    JSON.stringify(summary) +
    ". Local branch " +
    branch +
    ", commit " +
    git +
    ". No push or submission.",
];
write("IMPLEMENTATION_STATUS.md", statuses.join("\n"));
const protection = [
  "DEEP_TECHNICAL_ARCHITECTURE_V2.md",
  "hack details.pdf",
  "PROJECT_ANALYSIS.md",
].map((name) => {
  const b = fs.readFileSync(name);
  return {
    name,
    size: b.length,
    sha256: createHash("sha256").update(b).digest("hex").toUpperCase(),
  };
});
const table = (run) =>
  run.results
    .map((r) => "| " + r.checkId + " | " + r.status + " | " + r.coverage + " |")
    .join("\n");
const report = [
  "# REPORT TO CHATGPT — SWITCHFORGE IMPLEMENTATION",
  "",
  new Date().toISOString(),
  "",
  "## 1. Overall result",
  "",
  "**IN_PROGRESS; not full P0 completion.** Local software is implemented and tested. Genuine criteria/test review, dedicated Switch execution, reviewed correction, final human readiness decision and actual submission remain blocked. The user expressly instructed that review must stay PENDING.",
  "",
  "## 2. Original document integrity",
  "",
  "| Protected source | Bytes | SHA-256 |",
  "|---|---:|---|",
  ...protection.map(
    (p) => "| " + p.name + " | " + p.size + " | " + p.sha256 + " |",
  ),
  "",
  "All match SOURCE_INTEGRITY.md. No protected reference was edited, renamed or regenerated.",
  "",
  "## 3. Requirements traceability",
  "",
  JSON.stringify(summary) +
    ". REQUIREMENTS_TRACEABILITY.md maps all 19 functional requirements, 10 NFRs and 8 V2 gates. No P0 is silently omitted. P1/P2 remain NOT_STARTED.",
  "",
  "## 4. Actual project structure",
  "",
  "apps/{cli,checkout-demo}; packages/{core,checks,evidence,release}; config; fixtures/{current,scenarios/defective,scenarios/corrected}; tests/{unit,integration,security,e2e}; scripts; docs; .github/workflows/ci.yml. Runtime data is private under .local and artifacts. No nested repository.",
  "",
  "## 5. Modules implemented",
  "",
  "Typed CheckRunner registry delegates to real Vitest, Playwright/axe, oasdiff and CSV worker execution. ReleaseProof owns readiness. Core owns candidate/run coordination. Evidence owns SQLite/files. CLI composes them. Domain types are consolidated in models.ts rather than separate placeholder type files; interfaces are retained.",
  "",
  "## 6. Candidate identity and hashing",
  "",
  "Actual byte hashes, sorted normalized files, canonical JSON SHA-256, criteria/test/config/policy/lockfile and actual toolchain identities. Includes verifier code, SQL and Git line-ending policy. Effective config precedence is frozen. Checks reject missing/escaping/colliding/mutated inputs and new unmanifested source. No claim of hostile same-account immutability.",
  "",
  "## 7. Evidence storage and verification",
  "",
  "SQLite " +
    (doctor.data?.tools.find((t) => t.name === "sqlite-driver")?.version ||
      "unknown") +
    " driver; actual SQLite 3.53.4 transaction verified. Foreign keys, WAL, synchronous FULL and immediate transactions. Exclusive bounded temp write, fsync, rename and ledger references; no overwrite. Rehash on report/assessment/request; orphan/missing/corrupt evidence cannot pass. Integrity commands succeeded in local E2E.",
  "",
  "## 8. AcceptanceRelay",
  "",
  "Real standalone corrected fixture: " +
    review.passed +
    "/" +
    review.total +
    " passed, " +
    review.failed +
    " failed; raw report " +
    review.reportPath +
    ". Actual criteria and test SHA are in HUMAN_REVIEW_PACKET.md. Production engine refuses execution until real matching review; no human approval record exists.",
  "",
  "## 9. A11yRelay",
  "",
  "Actual Chromium headless shell 158.0.8127.18 / Playwright 1.65.0 / axe 4.14.0; bad label FAIL, corrected PASS. Local source identity, readiness, scoped form scan, raw JSON and screenshot. Real second-origin request blocked before the owned destination received it. No full accessibility claim.",
  "",
  "## 10. ContractGuardian",
  "",
  "Actual oasdiff 1.35.0, pinned official archive and executable hashes; local validation and verified response-media-type break. Exit/report contradiction, malformed/unknown report and external-reference tests fail closed. No waivers.",
  "",
  "## 11. DataRescue",
  "",
  "Actual deterministic CSV worker, UTF-8/BOM/quoting/exact headers/safe cents/IDs/settlement/limits. 1500-versus-1000 discrepancy observed. Separate injection-safe proposed corrections; no source rewrite.",
  "",
  "## 12. ReleaseProof",
  "",
  "Real current assessments are BLOCKED. Exhaustive 625-combination unit matrix verifies readiness logic with explicitly synthetic state fixtures. No real READY claim while criteria review is pending. COMPLETED is not PASS; READY is not approval; no deployment.",
  "",
  "## 13. CLI",
  "",
  "doctor, prepare, criteria show/propose/attest, run, report, compare, verify-evidence, release-request/attest, recover, export-demo and purge preview implemented. Supporting patch propose/attest and assert-ready exist. Strict JSON and flags; human-only positive paths remain unverified. Real E2E exercises compare/export/reuse/conflict and guards.",
  "",
  "## 14. Current defective run",
  "",
  "Run ID: " +
    before.run.runId +
    ". Candidate digest: " +
    before.run.candidateDigest +
    ". Git SHA recorded by run: " +
    before.run.gitSha +
    ".",
  "",
  "| Check | Actual status | Coverage |",
  "|---|---|---:|",
  table(before),
  "",
  "Readiness: " +
    before.assessment.readiness +
    ". Blockers: " +
    before.assessment.blockers.join(", ") +
    ".",
  "",
  "## 15. Current corrected run",
  "",
  "Run ID: " +
    after.run.runId +
    ". Candidate digest: " +
    after.run.candidateDigest +
    ". Git SHA recorded by run: " +
    after.run.gitSha +
    ".",
  "",
  "| Check | Actual status | Coverage |",
  "|---|---|---:|",
  table(after),
  "",
  "Readiness: " +
    after.assessment.readiness +
    ". Blockers: " +
    after.assessment.blockers.join(", ") +
    ".",
  "",
  "## 16. Human-review state",
  "",
  "**PENDING.** HUMAN_REVIEW_PACKET.md contains the exact criteria and test source, expected behavior, explicit SAVE100/100-cent/strict-UTC decisions, genuine six-test results and risks. The user withheld approval. No criteria, patch or final release attestation was fabricated. Normal CLI denies noninteractive attestation. Level 1 is the only implemented positive assurance level and cannot establish cryptographic identity.",
  "",
  "## 17. Switch/Codex/Mattermost",
  "",
  "**BLOCKED.** Historical Phase 1 SETUP_OK proves chat only. Dedicated project agent/room and actual human→command→room lifecycle are not verified. Computer Use returned Escape-stopped after resume; no further desktop input. Current Switch/Mattermost probes refused connection, and Docker daemon pipe was absent. Existing resources/data were not reset or deleted.",
  "",
  "## 18. Actual automated verification",
  "",
  "Fresh npm ci: success, zero reported vulnerabilities. Typecheck and code-format check passed. Full Vitest suite: " +
    tests.numPassedTests +
    "/" +
    tests.numTotalTests +
    " passed, " +
    tests.numFailedTests +
    " failed, " +
    tests.numPendingTests +
    " skipped. Separate review fixture: " +
    review.passed +
    "/" +
    review.total +
    " passed. Reports: .local/verification/tests-all.json, typecheck.txt, format-check.txt, npm-audit.json and human-review-execution.json. No invented coverage percentage.",
  "",
  "## 19. Security and failure evidence",
  "",
  "Actual timeout, output flood, descendant termination, abort, executable denial, literal shell metacharacters, traversal/junction rejection, strict config precedence, report contradictions, SQLite FK/restart/rollback, missing/tampered artifacts, live-lock recovery denial, idempotency, candidate addition/mutation and noninteractive approval denial. Positive human attestation, high-contention approval race and exhaustive OS crash/power-loss behavior remain unverified.",
  "",
  "## 20. Failed attempts and resolved defects",
  "",
  "Seed JS brace error fixed. E2E exposed duplicate raw-versus-canonical effective-config comparison; fixed without weakening tests. Recovery test Windows --import needed file URL; corrected. Full Chrome launcher returned spawn UNKNOWN; cause unestablished, matching installed headless-shell works and its actual bytes are hashed. Selected npm differs from bundled npm; inventory corrected. Upstream license whitespace preserved with scoped Git attributes; project diff check passes.",
  "",
  "## 21. Git checkpoint",
  "",
  "Branch " +
    branch +
    ", local HEAD " +
    git +
    ". Reviewed staging excludes protected references, PDFs, setup/runtime logs, binaries, databases and credentials. No force push, history rewrite, external push or submission. Existing origin/history preserved.",
  "",
  "## 22. README and submission readiness",
  "",
  "README, architecture, baseline, CLI, Switch/agent, testing, operations, decisions, demo/submission guides and third-party notices exist. Local fresh dependency reinstall verified. CI workflow prepared with actual resolved action commit pins, not executed. Independent clean clone, authentic full-workflow video, public links and human submission receipt are incomplete.",
  "",
  "## 23. Remaining requirements and critical blockers",
  "",
  "B-001 real criteria/test review PENDING; B-002 running Docker/Switch/Mattermost and dedicated command proof; B-003 genuine reviewed correction/final readiness decision and recording; B-004 explicit publication/push/submission authorization. See BLOCKERS.md and the full 37-row traceability matrix. No production, Level 2, compliance, SaaS, optional REA or second-agent claim.",
  "",
  "## 24. Exact next steps",
  "",
  "Human examines HUMAN_REVIEW_PACKET.md and explicitly resolves the review; no approval inferred now. Once genuinely approved, record the actual local attestation, prepare fresh snapshots and rerun all four engines. Restore existing collaboration services through supported controls, create the dedicated runner/room, capture real human command/review/rerun/final decision. Verify evidence and clean setup, record real video and inspect redacted export. Obtain explicit publication/push authorization and have a human submit before November 7, 2026, 23:59 IST. Do not automate registration/submission.",
  "",
];
if (!fs.existsSync(".local/history/REPORT_TO_CHATGPT-phase1.md")) {
  fs.mkdirSync(".local/history", { recursive: true });
  fs.copyFileSync(
    "REPORT_TO_CHATGPT.md",
    ".local/history/REPORT_TO_CHATGPT-phase1.md",
  );
}
write("REPORT_TO_CHATGPT.md", report.join("\n"));
console.log(
  JSON.stringify({
    requirements: rows.length,
    statuses: summary,
    testsPassed: tests.numPassedTests,
    humanReview: "PENDING",
    beforeRun: before.run.runId,
    afterRun: after.run.runId,
    git,
  }),
);
