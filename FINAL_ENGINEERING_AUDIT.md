# FINAL ENGINEERING AUDIT — SWITCHFORGE

Audit date: November 6, 2026. Authoritative source: protected DEEP_TECHNICAL_ARCHITECTURE_V2.md, especially §§50–65. Implementation verified at **ff94de3182f4a99960bb1785c65dcc47539c9ac3**, branch `codex/switchforge-implementation`. This is an engineering self-audit, not human approval, a security certification or a submission receipt.

## Outcome

The local implementation, independent audit repairs, reproducibility checks, documentation and redacted evidence are prepared. **Full P0 and hackathon completion remain BLOCKED.** Six V2 gates remain incomplete: GATE-SW-01, GATE-SW-02, GATE-CORE-01, GATE-HUMAN-01, GATE-DEMO-01 and GATE-DEMO-02. GATE-CORE-02 and GATE-CORE-03 have scoped local proof. No completion percentage is invented.

Actual production ledger inspection at **2026-11-06T11:58:32.375Z** found **zero decisions and zero criteria attestations**. Development authorization has not been converted into approval. Pending request creation is not human review. The criteria and six proposed acceptance tests remain unchanged and PENDING.

The audit read the actual implementation, configuration, migration, tests, CLI and report generators. It independently reproduced defects instead of relying on the checkpoint's earlier 86-test summary. All 19 functional requirements, 10 nonfunctional requirements and eight V2 gates are retained in the traceability section.

## Protected source integrity

All three originals retain their exact original bytes. They were never reformatted, regenerated, renamed or deleted.

| Document                          |  Bytes | SHA-256                                                          |
| --------------------------------- | -----: | ---------------------------------------------------------------- |
| DEEP_TECHNICAL_ARCHITECTURE_V2.md | 260575 | 816ee4cb4a7de5762377ffb447395e0ae59b3d2b3b7cf4ff4ae45c11ca07c8eb |
| hack details.pdf                  | 340707 | 37ac819bf7b0af5cb3382b9acb28bf7b63db98f8dda278e539cd66b8777a5e15 |
| PROJECT_ANALYSIS.md               |  72716 | c44b9a27cb588cacce84f89ab0279d88be37b9caeaf54f8a0fd5b5794b2b9a5d |

## Project and implementation

SwitchForge is human-supervised release assurance for one synthetic local checkout. Intended users are the product/criteria owner, developer/QA reviewer and release reviewer; one real participant can demonstrate several roles. Four engines verify coupon behavior, checkout accessibility, OpenAPI compatibility and CSV consistency. ReleaseProof aggregates deterministic evidence and a separate human decision. No real payment provider, customer data, deployment service or general financial-reconciliation product was introduced.

The workspace is a TypeScript/npm repository with CLI, sample checkout, coordinator, check adapters, SQLite ledger, artifact store and release policy. Switch Console, its managed Codex agent and Mattermost supply collaboration. There is no custom Switch transport client or replacement messaging service. The CLI remains independently executable for reproducibility; a terminal-only run does not prove the Switch product workflow. Sources: architecture §§51–56 and 59.

`prepare` materializes a selected versioned scenario plus allowlisted code, tests, configuration and lockfile in a fresh snapshot. Canonical sorted raw-byte hashes bind criteria/test content, policy, effective checks and actual toolchain identity. `run` uses a candidate-scoped idempotency key, one workspace lease, literal subprocess argument arrays, sanitized environment, bounded output and an overall deadline. Candidate bytes are checked before/after checks and on assessment. Cooperative metadata monitoring remembers observed edits restored before a check ends.

Each engine records real receipts, normalized findings, coverage and hash references. SQLite uses foreign keys, WAL, FULL synchronous mode and immediate transactions. Evidence files publish without replacement. A last `completion.json` binds the complete registered artifact inventory. A database COMPLETED flag alone cannot establish valid evidence.

ReleaseProof requires exactly four mandatory valid PASS results, nonempty coverage/evidence, matching engine/candidate/toolchain/policy, current verifier/configuration, verified artifacts and a real criteria/test review. COMPLETED is not PASS; READY_FOR_HUMAN_APPROVAL is not human attestation or deployment. Criteria, patch and release actions have different scopes and one-time nonce hashes; requests expire after 15 minutes. Sources: §§55, 57–58.

New runs explicitly store criteriaRevision, policyDigest and toolchainDigest in their existing JSON ledger payload. Snapshot payloads retain ID, digest, root, full manifest and creation time; candidateDigest hashes the canonical manifest. This is an additive payload change, **not a new SQL migration**. The original migration already has correct candidate-scoped key uniqueness. No historical database was rebuilt or deleted, and no legacy V1 global-key upgrade was claimed. Legacy runs without current bindings/completion records remain preserved and ineligible for current readiness.

## Defects found and corrected

| Confirmed finding                                              | Repair / verification                                                                                                                   |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| PASS could contradict execution errors or blocking findings    | Semantic result validation rejects contradictions, empty PASS evidence/coverage and unknown versions                                    |
| A check could identify a different engine                      | Explicit check-to-tool mapping enforced by schema                                                                                       |
| AC-001 matched the prefix AC-0010                              | Exact whitespace-token criterion matching; regression retained                                                                          |
| Split UTF-8 subprocess chunks corrupted output                 | Per-stream StringDecoder; real split-multibyte subprocess reproduction                                                                  |
| Artifact existence-check/write race could replace bytes        | Exclusive flushed temporary file and atomic same-volume hard-link publication; arriving-writer regression                               |
| COMPLETED preceded durable final evidence                      | Publish completion record last; verify required files and complete inventory before public readiness                                    |
| Duplicate CSV rows undercounted and issue IDs collided         | Retain actual row counts and include row-specific finding content in stable issue IDs                                                   |
| Browser launch/close could leave server cleanup incomplete     | Browser launch is inside cleanup scope; nested finally closes browser/server                                                            |
| Resource/config enumeration gaps                               | CSV size checked before reading; candidate input cap and declared exclusions honored                                                    |
| Release transaction lacked a final tool/TTL recheck            | Synchronous executable/package revalidation and exact candidate/policy binding inside transaction; TTL checked again before consumption |
| Expired/malformed request could retain its displayed state     | Effective report decision rechecks expiry and candidate/assessment/policy identities                                                    |
| Criteria review lookup did not fully bind proposal content     | Require matching criteria/test digests, proposal resource hash and actor reference                                                      |
| E2E used real review ledger                                    | Fresh per-suite DB/artifact namespace; no dependence on later human approvals                                                           |
| Review generator used mutable current source                   | Prepare corrected frozen snapshot, execute actual Vitest there and record hashes/IDs                                                    |
| CI multiline commands could mask an earlier failure            | Separate dependency/tool steps and actual formatting check                                                                              |
| Documented Windows PowerShell install failed in clean checkout | Replace unavailable Get-FileHash with .NET SHA256 stream API, retaining pinned archive/binary verification                              |
| Historical generator could overwrite current reports           | Default invocation refuses; explicit historical export writes labelled history only                                                     |

The first five audit regressions genuinely failed against the checkpoint. A separate missing-finalization regression also failed before its repair. Later focused/full runs passed. Additional inspection-led fixes have scoped tests/probes. No six-case acceptance assertion or criterion was weakened or changed.

Atomic hard-link publication is a documented implementation decision replacing overwrite-capable rename. Unsupported hard links fail; no overwrite fallback is used. This retains the source's nonreplacement/integrity requirement (§58).

Two native recursive fs.watch attempts aborted the pinned Windows Node worker with `!_wcsnicmp(filename, dir, dirlen)` in src/win/fs-event.c:72. Canonicalizing the root did not solve it. The shipped watchFile polling plus synchronous metadata checks passed the restored-edit/exclusion tests. This does not establish hostile-account immutability.

Other unsuccessful attempts are retained in WORK_LOG.md: a scratch toolchain probe syntax error corrected before execution; UI child-cache/offscreen actions resolved through observation-based navigation; two accidentally formatted upstream licenses restored exactly and excluded from formatting; the first clean-checkout installer failure retained as failure evidence. No security barrier was bypassed.

## Current infrastructure and Switch integration

At **2026-11-06T11:58:31.4589267Z**, Docker Engine **29.9.2** and Desktop were running. Switch `http://127.0.0.1:58821/health` returned `ok`; Mattermost `http://127.0.0.1:58822/api/v4/system/ping` returned `OK`. The preserved Mattermost container was healthy on loopback 58822→8065. Startup used `docker desktop start --detach` and the existing Console Start control. No reset, volume deletion, reinstall or database replacement occurred. Current health is an observation, not an uptime promise.

Created dedicated Codex agent **switchforge-demo-agent**, configured to the exact original workspace. Console displays Running. Auto mode remained on, Bypass permissions off and agent-management off; default owner-addressing label was retained. No independent negative provider authorization test is claimed. Agent instructions preserve the specification, require real CLI output, separate human reviews and prohibit attestation impersonation/publication.

Created **switchforge-release-demo**, bridged to the existing Mattermost connection with linked human and dedicated agent. Room instructions enforce the same boundaries. Existing existing connectivity agent, existing connectivity agent and switch-buddy-admin remain present. UIA setup observations are retained under `<PRIVATE_RECEIPT_LOCATION>`; genuine screenshots were observed through the UI tool.

Only the automatic bot welcome was observed in the project room. There is **no actual human-requested project CLI receipt or same-room result yet**. A Running indicator, welcome or earlier SETUP_OK is insufficient proof. No agent-authored human message was sent. [Human actions](ACTION_REQUIRED_FROM_HUMAN.md) supplies the exact real message and local room link.

## Actual final production runs

Both bind evaluator implementation **ff94de3182f4a99960bb1785c65dcc47539c9ac3**. Later documentation-only changes do not alter hashed evaluator inputs.

| Engine           | Defective | Corrected | Actual evidence                                                                |
| ---------------- | --------- | --------- | ------------------------------------------------------------------------------ |
| AcceptanceRelay  | ERROR     | ERROR     | Review denied before production Vitest; explicit error/result JSON, coverage 0 |
| A11yRelay        | FAIL      | PASS      | Actual axe label finding/recheck, browser receipts and screenshots             |
| ContractGuardian | FAIL      | PASS      | Actual validation/breaking JSON and tool exit codes                            |
| DataRescue       | FAIL      | PASS      | Actual 500-cent discrepancy then clean four-row reconciliation                 |
| ReleaseProof     | BLOCKED   | BLOCKED   | Human review and acceptance ERROR/zero coverage block                          |

| Scenario  | Run ID                               | Snapshot ID                          | Candidate digest                                                 |
| --------- | ------------------------------------ | ------------------------------------ | ---------------------------------------------------------------- |
| Defective | <DEMO_RECORD_ID> | <DEMO_RECORD_ID> | ce4484c1ac79cd73d0181eccebbf97ea1462805d96c20d8a2b11a2ab129c4e55 |
| Corrected | <DEMO_RECORD_ID> | <DEMO_RECORD_ID> | 2124398713aa2448bb0b9e05d78792ee26738c9ff55432151dbfe9a5da6f3988 |

Both `verify-evidence` operations returned valid=true. Corrected blockers: CRITERIA_AND_TEST_REVIEW_REQUIRED, acceptance:ERROR, acceptance:NO_COVERAGE. The older run additionally has the three actual FAIL findings and is superseded by the newer run of the same candidate. The run's historical evidence remains intact.

These are not four approved PASS results. A new pair of snapshots/runs is required after genuine review. No expired or historical positive fixture state authorizes the current workflow.

## Actual verification results

Latest main suite: **99/99 passed, 0 failed, 0 skipped, 15 files**. The 625-combination readiness matrix is **one reported generated test**, not 625 separate tests. A separate frozen corrected review run passed **6/6**, exit 0. Its criteria raw SHA-256 is f69fc54fcc167163ba6a715c10fabd4e9a63d2aaef27b5dd31efb259266a1e7c; test source SHA-256 is e62a5a42d226dbb351c8e532a3834a577c0cbaffca195695988944b4a6e99c2f. Detailed private execution: `<PRIVATE_RECEIPT_LOCATION>`.

| Actual main command                                                                      | Exit | Duration |
| ---------------------------------------------------------------------------------------- | ---: | -------: |
| npm ci                                                                                   |    0 |  7089 ms |
| npm run typecheck                                                                        |    0 |   703 ms |
| npm run format:check                                                                     |    0 |  1213 ms |
| npm test -- --reporter=json --outputFile <PRIVATE_RECEIPT_LOCATION> |    0 | 53818 ms |
| npm audit --audit-level=high --json                                                      |    0 |  1821 ms |
| npm --silent run sf -- doctor --json                                                     |    0 |  1572 ms |

Audit reported zero vulnerabilities at execution time. No coverage percentage, throughput or complete reviewed-run performance measurement is invented. Command receipts: `<PRIVATE_RECEIPT_LOCATION>`. Native tools/package versions are recorded by actual doctor output.

### Clean checkout

An owned isolated temporary checkout of **ff94de3182f4a99960bb1785c65dcc47539c9ac3** began without .local, artifacts, node_modules or private protected reference documents. No ignored runtime data was copied from the original workspace. Locked install, documented Playwright/browser and pinned oasdiff installation, typecheck, formatting, **99/99 tests**, audit and doctor passed. Its final tracked worktree was clean after restoring the deliberately opposed mutable fixture.

Actual receipts/paths/durations: `<PRIVATE_RECEIPT_LOCATION>`, metadata.json, tests-all.json and COMPLETE.json. This was the **same Windows host** with declared Node/npm and shared Playwright cache, not a fresh OS or actual GitHub Actions run. The initial failed installer checkout is separately preserved under clean-checkout; subsequent successes do not erase it.

### Frozen-source isolation experiment

The actual Vitest executable ran with the same frozen-config/cwd arrangement used by the acceptance adapter, as a standalone engineering experiment without granting review:

| Frozen source | Opposing mutable source | Actual six-case result                 | Exit |
| ------------- | ----------------------- | -------------------------------------- | ---: |
| Defective     | Corrected               | 5 PASS, 1 FAIL: AC-001 expiry boundary |    1 |
| Corrected     | Defective               | 6 PASS, 0 FAIL                         |    0 |

Both directions have different actual frozen/mutable source hashes. Thus the exercised test path loads the chosen frozen coupon source rather than mutable current input. Exact cases, snapshot IDs/digests and hashes: `<PRIVATE_RECEIPT_LOCATION>`. This experiment is not normalized approved AcceptanceRelay evidence.

### Negative tests and contention

Executed checks cover process timeout, output flood, descendants, abort, literal argv, executable denial; traversal/junction restrictions; browser origin denial; CSV/schema/UTF-8/row/byte failures; external OpenAPI references and unknown/contradictory reports; stale/duplicate/malformed results; absent/tampered evidence; restart/rollback/recovery; idempotency and noninteractive attestation denial.

A separate two-process SQLite schema probe in an owned temporary DB produced exits 0 and 5, with the second writer denied by SQLITE_CONSTRAINT_PRIMARYKEY and exactly one **test-only** row. The payload explicitly is not human approval, and the production ledger was untouched. `<PRIVATE_RECEIPT_LOCATION>` records the 222 ms observation. This tests transaction/key contention, not concurrent genuine human attestations.

Not every browser launch/readiness/redirect fault has been injected through every production adapter. Full positive interactive review, independent agent-impersonation denial and simultaneous real human terminal decisions remain NOT VERIFIED. Deterministic fixtures and schema probes do not replace those human/provider tests.

## Criteria, patch and final decision

Human review is **PENDING**. [HUMAN_REVIEW_PACKET.md](HUMAN_REVIEW_PACKET.md) embeds the exact five criteria and six tests. At/after expiry rejects and preserves total; one millisecond before expiry applies SAVE100; malformed/missing UTC timestamps and invalid/unsafe integer cents reject.

**Implementation decisions requiring agreement:** SAVE100, fixed 100-cent discount, zero clamping and exact millisecond-Z timestamp format fill details UNSPECIFIED by the source; they are not invented source requirements. Separate zero/sub-discount/unknown-coupon engineering tests do not extend the six proposed acceptance tests or confer approval. Sources: §§55.2 and 57.

Criteria request <DEMO_RECORD_ID> and patch request <DEMO_RECORD_ID> were created as REQUESTED at Level 0. Their 15-minute request windows have expired. A human must create a fresh request using the documented procedure after personally inspecting the exact content. No attestation was executed.

The actual patch diff is the local review procedure, 3344 bytes, SHA-256 2344c847a48c1751ae7018acfa2da43cbee8f579a25f54f92cfe2f9fd54488ee, bound to the defective snapshot/digest above. [PATCH_REVIEW_PACKET.md](PATCH_REVIEW_PACKET.md) discloses that the corrected fixtures were precommitted. Selecting them is not evidence of a newly authored/applied human-approved repair. No frozen snapshot was intentionally patched during a run.

No final release decision exists. The implemented positive label is **Level 1 HUMAN_ATTESTED_FOR_DEMO**, with actor identity not cryptographically verified. Level 2 isolated reviewer authority is not implemented; Level 3 production authorization is out of scope. Ordinary chat or development authorization cannot set privileged state. No deployment exists.

## Evidence bundle and presentation

Local redacted directory: `.local/demo-export-final-1793958517304`, **46 evidence files plus export-manifest.json**. All exported lengths/SHA-256 values matched. Tested home/workspace-path and credential patterns were absent. The real corrected browser screenshot was visually inspected and shows the associated Email label. These checks do not replace the human's publication review.

ZIP: `.local/demo-export-final-1793958517304.zip`, **56592 bytes**, SHA-256 **db0bc479a7955b085e0163dd53ed4276314b35b08db7fc68c6d4966ddee8ac11**. Original/exported hashes differ where redaction changes bytes. This presentation export is not an importable authoritative ledger or independent approval proof. No upload/publication occurred.

README, CLI/setup/architecture/tests/runbooks/decisions, third-party notices, human review procedures, demo script and submission checklist are prepared. Original reference documents and private DBs/binaries/setup logs are not staged. No authentic full-workflow video exists yet.

## CI and Git

The Windows workflow has pinned action commits, exact Node/npm, locked dependencies, real tool installs, separate error-preserving steps, typecheck, formatting, tests, audit, doctor and read-only repository permission. Equivalent commands passed in the original workspace and clean checkout. **Actual GitHub Actions is NOT VERIFIED.** Local simulation is not remote CI. No push was performed.

Local implementation commits: f4db9c3 (audit hardening and review preparation), 3cdeb25 (portable checksum installer), ff94de3 (malformed expiry denial); previous checkpoint 34af68c and origin/history preserved. A final documentation-only commit is recorded separately in WORK_LOG.md. No history rewrite or force push. Destination remains YellankiKaushik/Flip-Coin-AI, branch codex/switchforge-implementation; publication requires explicit authorization or human action.

## Architecture conformance and residual risks

These limits remain recorded; the protected specification was not changed to remove them:

- Shared-account Level 1, hashes and cooperative monitoring do not defend against a hostile account that can rewrite source, database, timestamps or keys. No audit-proof or production security claim.
- Package versions and npm lock integrity are verified; every installed node_modules byte is not independently hashed.
- The common CheckRunner interface is typed and tested. Private cross-package implementation imports remain instead of fully enforced abstract public ports (§54.3); no architecture-lint or independently enforced package-cycle boundary is claimed. This remains architecture debt, not proof of complete conformance.
- Persistence readers apply scoped identity, root, hash and decision checks; not every stored entity has a complete independent versioned strict schema. Additional corruption/compatibility hardening remains a follow-up.
- Snapshot polling and synchronous metadata tests detect the exercised restored edit; they cannot guarantee observation of every malicious transient mutation. Raw bytes, not timestamps, remain the manifest identity.
- Full positive human/provider authorization paths and some per-adapter fault injections are unverified. No Level 2 boundary was fabricated to close this gap.
- Windows only is verified. The 180-second full reviewed-run target remains unmeasured. No SLA, p95/p99 or capacity claims.
- axe scope is the configured label rule; no WCAG certification. OpenAPI document comparison is not live consumer/runtime compatibility. CSV policy is synthetic and narrow.
- Retention is preview only; no deletion. External model/provider access may transmit context; local-first is not all-local inference.
- Optional REA, second agent, dashboard, cloud, PR automation and production deployment remain NOT_STARTED.

## Hackathon alignment

Protected rules PDF pp.18–20 gives Switch 30%, technical execution 25%, creativity/impact 25%, presentation 20%; pp.24/28 identify repository/README/video and deadline; pp.29–33 require genuine human participation/submission. Recommended track: Best Business Workflow. Actual track selection, registration/eligibility, video URL and submission receipt remain UNSPECIFIED.

Technical local proof is substantial, but Switch use remains a major judging risk until a real human request produces a real command receipt and same-room explanation, genuine correction review and rerun. No commercial impact or competition result is claimed. Authentic recording, public source/video access, actual remote CI and submission remain incomplete.

Deadline: **November 7, 2026, 23:59 IST**. Internal targets: feature freeze November 7, 17:00 IST; human submission 20:00 IST. These are targets, not completion statements.

## Remaining sequence

1. Human personally reviews the criteria/test packet and records the supported decision, or rejects; create fresh short-lived requests.
2. Human sends the exact addressed Mattermost message. Verify actual directory, command, exit, JSON, run ID/digest and same-room reply.
3. Capture separate correction review and fresh post-review defective/corrected four-engine runs. Four real valid PASS results are required before READY.
4. Human separately reviews/records final readiness; verify its effective state and exact bindings.
5. Retain/fix the disclosed architecture and negative-test follow-ups without weakening source requirements or claiming unsupported conformance.
6. Publish only with explicit authorization, inspect actual GitHub Actions, record real demo, check public links and submit personally; retain actual receipt.

No approval, human message, video, remote CI success or submission was fabricated.

## Complete requirement traceability

The 37-row current matrix is appended from the maintained requirement register below. VERIFIED refers only to its scoped local evidence, not overall completion.

| ID            | Source     | Evidence                             | Status                   | Scope and remaining work                                                                                 |
| ------------- | ---------- | ------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| FR-001        | §§4,59     | docs/SWITCH_GUIDE.md                 | BLOCKED                  | Dedicated room/agent exist; genuine human addressed interaction absent                                   |
| FR-002        | §§51,59    | apps/cli; docs/agents                | BLOCKED                  | No actual Switch-driven CLI execution                                                                    |
| FR-003        | §55.2      | approval.ts; HUMAN_REVIEW_PACKET.md  | BLOCKED                  | Human expressly withheld criteria/test approval                                                          |
| FR-004        | §55.2      | checks/acceptance.ts; adapters.ts    | IMPLEMENTED_NOT_VERIFIED | Opposing frozen-source Vitest proved 5/6 defective, 6/6 corrected; reviewed production path PENDING      |
| FR-005        | §55.3      | checks/accessibility.ts; worker.ts   | VERIFIED                 | Real axe bad/good CLI and browser integration                                                            |
| FR-006        | §§55.3,59  | compare; docs/DEMO_AND_SUBMISSION.md | BLOCKED                  | Real scan reruns exist; genuine reviewed patch workflow absent                                           |
| FR-007        | §55.4      | checks/contract.ts; openapi.ts       | VERIFIED                 | Actual oasdiff validation/break/compatible/error tests                                                   |
| FR-008        | §55.5      | checks/data.ts; data-runner.ts       | VERIFIED                 | Actual CSV worker plus strict edge tests                                                                 |
| FR-009        | §§53,55.1  | CLI; run-checks.ts                   | VERIFIED                 | Four normalized reports; pending review honestly ERROR                                                   |
| FR-010        | §55.6      | release/policy.ts                    | VERIFIED                 | 625-combination truth table and real BLOCKED assessments                                                 |
| FR-011        | §57        | release/approval.ts                  | BLOCKED                  | Noninteractive denial and state tests; no real positive decision                                         |
| FR-012        | §59        | docs/SWITCH_GUIDE.md                 | BLOCKED                  | Same-room product result relay unverified                                                                |
| FR-013        | §§52,56,58 | manifest; evidence; compare          | VERIFIED                 | Distinct snapshots/digests/run IDs; no overwritten evidence                                              |
| FR-014        | §58        | ledger; coordinator                  | VERIFIED                 | Actual reuse, payload conflict and candidate-scoped keys tested                                          |
| FR-015        | §§56,64    | fixtures; tests/e2e                  | BLOCKED                  | Current human gate blocks full four-engine FAIL-to-PASS workflow                                         |
| FR-016        | §62        | docs/DECISIONS.md                    | NOT_STARTED              | Optional REA research deferred                                                                           |
| FR-017        | §53 V2     | CLI JSON envelopes                   | VERIFIED                 | Single-object JSON exercised by real CLI tests                                                           |
| FR-018        | §§4,51     | docs/DECISIONS.md                    | NOT_STARTED              | Optional second agent deferred                                                                           |
| FR-019        | §51        | docs/DECISIONS.md                    | NOT_STARTED              | Dashboard/PR integration deferred                                                                        |
| NFR-PERF-001  | §§4,16     | run timings                          | IMPLEMENTED_NOT_VERIFIED | 180-second complete reviewed run target not benchmarked                                                  |
| NFR-AVL-001   | §4         | README limitations                   | VERIFIED                 | No uptime/SLA promise                                                                                    |
| NFR-SCALE-001 | §§4,58     | lock; ledger                         | VERIFIED                 | Single run, actual idempotency conflict and live-lock recovery denial                                    |
| NFR-SEC-001   | §§13,60    | path/process/browser guards          | VERIFIED                 | Confinement, literal argv, network-denial and resource tests; cooperative scope                          |
| NFR-SEC-002   | §60        | sanitized env/export                 | VERIFIED                 | Staged scan, path-redaction and synthetic secret-marker evidence/audit persistence tests                 |
| NFR-REC-001   | §58        | ledger; recover                      | VERIFIED                 | FK/restart/rollback/orphan/missing-file tests and actual recovery CLI                                    |
| NFR-MNT-001   | §54        | CheckRunner registry; workspaces     | VERIFIED                 | Typecheck covers all app/package/test source                                                             |
| NFR-OBS-001   | §§19,53    | results; receipts; audit             | VERIFIED                 | Real run/check/tool/time/hash artifacts                                                                  |
| NFR-AI-001    | §34        | deterministic schema/policy          | VERIFIED                 | No AI status authority; malformed/fabricated results rejected                                            |
| NFR-PRV-001   | §14        | synthetic fixtures; export           | VERIFIED                 | Only synthetic inputs; runtime/private sources excluded                                                  |
| GATE-SW-01    | §51.2      | docs/SWITCH_GUIDE.md                 | BLOCKED                  | Room/agent Running; only automatic welcome, genuine human interaction absent                             |
| GATE-SW-02    | §51.2      | CLI + future Switch runner           | BLOCKED                  | No real room-to-command-to-room proof                                                                    |
| GATE-CORE-01  | §51.2      | coordinator/check registry           | BLOCKED                  | Current AcceptanceRelay correctly refuses pending review                                                 |
| GATE-CORE-02  | §51.2      | release policy/tests                 | VERIFIED                 | All tested nonpassing cases BLOCK                                                                        |
| GATE-CORE-03  | §51.2      | manifest/effective config/toolchain  | VERIFIED                 | Byte/config/tool changes, unmanifested additions and observed restored edits rejected; cooperative scope |
| GATE-HUMAN-01 | §51.2      | HUMAN_REVIEW_PACKET.md               | BLOCKED                  | Await actual human review; no approval fabricated                                                        |
| GATE-DEMO-01  | §51.2      | real fixture runs                    | BLOCKED                  | Full live reviewed bad/good sequence incomplete                                                          |
| GATE-DEMO-02  | §51.2      | README/docs/local source             | BLOCKED                  | Video, publication authorization and human submission missing                                            |
