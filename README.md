# SwitchForge

Human-supervised engineering release assurance for one synthetic local checkout, operated through a Switch room with Codex and Mattermost.

**Current status:** local implementation and tests exist. Human criteria/test review is **PENDING**. The complete live Switch project workflow and final human readiness decision are **not verified**. This is not a production deployment or approval system. See [human review packet](HUMAN_REVIEW_PACKET.md).

Four engines check one frozen candidate:

| Engine           | Actual tool                     | Seeded defect                                  |
| ---------------- | ------------------------------- | ---------------------------------------------- |
| AcceptanceRelay  | Vitest                          | Coupon incorrectly accepted exactly at expiry  |
| A11yRelay        | Playwright/Chromium + axe       | Checkout email input lacks an accessible label |
| ContractGuardian | oasdiff                         | Existing response media type removed           |
| DataRescue       | csv-parse + deterministic rules | 1500-cent order versus 1000-cent ledger charge |

ReleaseProof accepts four distinct PASS results only when candidate, tools, policy, reviewed criteria/tests and evidence all match. A missing/error/stale/tampered result blocks. READY_FOR_HUMAN_APPROVAL is separate from human attestation.

## Supported local environment

Tested development target: Windows 11 x64, Node **24.16.0**, npm **11.9.0**. Versions are exact and recorded in package-lock.json and config/toolchain-expected.json. Other platforms are not yet supported by the binary installer or verified by this project.

Switch is installed separately. Existing setup used Switch Console 0.40.1, Core 0.31.0, local Mattermost 11.9.0 and Codex 0.166.0. This recorded connectivity does not establish project command execution. Keep the original connectivity agent restricted.

## Install and verify

From the repository root in PowerShell:

```powershell
node --version
npm --version
npm ci
npx playwright install chromium
powershell -NoProfile -File scripts/install-oasdiff.ps1
npm run typecheck
npm run format:check
npm run test:unit
npm run test:integration
npm run test:security
npm run test:e2e:local
npm --silent run sf -- doctor --json
```

The native better-sqlite3 package must load. No fallback ledger is silently substituted. The oasdiff installer downloads the pinned official Windows release and checks both archive and executable SHA-256 before execution. It uses the system tar command.

`npm --silent` suppresses npm banners. JSON commands emit one schema-versioned object; diagnostics and interactive reviewer prompts use stderr. The root `lint` script currently performs TypeScript static checking; no separate ESLint claim is made.

## Prepare and run

```powershell
$prepared = npm --silent run sf -- prepare --scenario defective --candidate checkout-v2 --json | ConvertFrom-Json
if (-not $prepared.ok) { throw $prepared.error.message }
$run = npm --silent run sf -- run --snapshot $prepared.data.snapshotId --key demo-defective-001 --json | ConvertFrom-Json
$run.data.results | Select-Object checkId,status,coverage
$run.data.assessment
```

While review is pending, AcceptanceRelay correctly reports ERROR before production test execution, and ReleaseProof remains BLOCKED. The other engines still execute independently. Direct standalone fixture tests are development verification, not approved release evidence.

Review [HUMAN_REVIEW_PACKET.md](HUMAN_REVIEW_PACKET.md) before recording anything. The agent must not perform the following human attestation itself:

```powershell
$proposal = npm --silent run sf -- criteria propose --file fixtures/scenarios/corrected/criteria/approved.json --json | ConvertFrom-Json
# A real human reviews the exact criteria AND test source, then in an interactive terminal:
npm --silent run sf -- criteria attest --proposal $proposal.data.proposal.proposalId --json
```

The terminal asks the reviewer for an actor reference and the exact confirmation. Request TTL is 15 minutes. Noninteractive calls are denied. This is **Level 1 HUMAN_ATTESTED_FOR_DEMO**, not cryptographic identity verification. A same-account agent remains a cooperative participant, not a separately isolated principal. Ordinary chat approval does not alter the ledger.

After genuine review, prepare fresh defective and corrected snapshots and use new keys. Do not edit a prepared snapshot. Get returned IDs from actual output, never invent them:

```powershell
# After genuine criteria/test review, run a FRESH defective snapshot too:
$reviewedBad = npm --silent run sf -- prepare --scenario defective --candidate checkout-v2 --json | ConvertFrom-Json
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$run = npm --silent run sf -- run --snapshot $reviewedBad.data.snapshotId --key "reviewed-defective-$stamp" --json | ConvertFrom-Json
# Complete separate actual correction review before selecting corrected fixtures.
$fixed = npm --silent run sf -- prepare --scenario corrected --candidate checkout-v2 --json | ConvertFrom-Json
$after = npm --silent run sf -- run --snapshot $fixed.data.snapshotId --key demo-corrected-001 --json | ConvertFrom-Json
npm --silent run sf -- report --run $after.data.run.runId --json
npm --silent run sf -- verify-evidence --run $after.data.run.runId --json
npm --silent run sf -- compare --before $run.data.run.runId --after $after.data.run.runId --json
```

A command exit 0 means the check operation completed; it does not mean release readiness. Use the JSON assessment. `assert-ready --run ID --json` is a separate policy gate returning nonzero when blocked.

When a current run is genuinely READY, `release-request --run ID` creates a request only. A real human may resolve it with interactive `release-attest --proposal ID`, or reject using `--reject`. This records synthetic readiness and never deploys.

## Why Switch is central

The complete product workflow is human request → Mattermost → Switch → Codex → real CLI → evidence → same-room explanation → reviewed correction → new run → separate human decision. Switch supplies shared context, addressing and human-agent handoff. The deterministic CLI remains independently runnable for reproducibility; a terminal-only demonstration is not a complete Switch hackathon workflow.

Use [the Switch setup guide](docs/SWITCH_GUIDE.md) for the dedicated runner/room. No custom transport client, webhook or replacement chat application is required.

## Other commands

See [CLI reference](docs/CLI.md). Implemented families include doctor, prepare, criteria show/propose/attest, run, report, compare, verify-evidence, release-request/attest, recover, export-demo and purge preview. Patch propose/attest and assert-ready are explicit supporting extensions. Purge never deletes; it requires --dry-run.

## Evidence and safety

- Candidate identity hashes raw source/test/spec/CSV/config/policy/lockfile bytes plus actual toolchain records, not just git HEAD or modification times.
- SQLite ledger: .local/switchforge.sqlite. Frozen snapshots: .local/snapshots. Evidence: artifacts/runs. These directories are ignored by Git.
- Hashes detect inconsistency; a same-user attacker able to rewrite files and ledger can forge both. Evidence is not audit-proof or immutable storage.
- Credential-shaped strings are redacted before text evidence and audit persistence. Hashes refer to persisted redacted bytes; tool findings/status are not changed. Inputs must remain synthetic.
- Only synthetic data and owned local browser targets. No real payments, customer data, external website scanning, deployments or model secrets.
- Automated axe checks cover the configured rule scope, not complete accessibility compliance.
- OpenAPI diffing is not live consumer-contract or runtime-implementation verification.
- Strong isolated human identity, multi-tenant security, cloud hosting, dashboards, additional agents and REA research are not implemented P0 dependencies.
- Provider/model access can transmit room context/code outside the host; local-first does not imply all data stays local.

For a new export directory inside the repository, use `export-demo --runs ID,ID --output demo-export --json`. Export rehashes redacted bytes and distinguishes original versus exported hashes. Inspect the export yourself before publishing; publication and final GitHub push require explicit authorization.

Further documents: [architecture](docs/ARCHITECTURE.md), [testing](docs/TESTING.md), [operations](docs/RUNBOOKS.md), [decisions](docs/DECISIONS.md), [demo/submission](docs/DEMO_AND_SUBMISSION.md), and [third-party notices](THIRD_PARTY_NOTICES.md).

License: Apache-2.0 for project code; dependencies retain their own licenses. No competition win, production readiness, compliance certification or measured commercial impact is claimed.

Finalization handoff: [engineering audit](FINAL_ENGINEERING_AUDIT.md), [required human actions](ACTION_REQUIRED_FROM_HUMAN.md), and [submission readiness](SUBMISSION_READINESS.md). The dedicated local room/agent now exist; authentic human command execution and all approval/submission gates remain separate and pending.

The full exact recording sequence and separate human checkpoints are in [FINAL_DEMO_SCRIPT](docs/FINAL_DEMO_SCRIPT.md). Current final engineering evidence is BLOCKED; it is not a completed reviewed demonstration.
