# Verification strategy

Unit suites exercise canonical hashes, path confinement, strict CSV rules, state validation and all 625 combinations of PASS/FAIL/ERROR/SKIPPED/missing across four required checks. Those inputs are explicitly unit-test fixtures, not recorded tool executions or human approvals.

Integration suites use actual SQLite and oasdiff. Security tests use bounded real processes to test timeout/output exhaustion, allowlisting and literal argument handling. Local E2E invokes the actual CLI and real browser/API/data workers against both scenarios. Acceptance remains ERROR in the production workflow while the human criteria/test review is pending; other engines still execute.

Standalone coupon verification:

```powershell
npx vitest run --config vitest.candidate.ts
```

This command is development testing and grants no approval. The reviewed acceptance test source and raw machine report are linked by HUMAN_REVIEW_PACKET.md.

Use npm run test:unit, test:integration, test:security, test:e2e:local, and typecheck. `npm test` runs all tests. Never use ignored failures or turn unknown output into PASS. Test report counts must come from actual executed reports. No invented coverage percentage is provided.

Evidence under .local/verification and artifacts/runs is private local runtime output. Validate with verify-evidence before use. Changing verifier/config/lockfile invalidates old candidates; prepare a new snapshot after source changes. Tests do not fabricate human review records.

Not established by local tests: genuine Switch project execution, human review/attestation, complete accessibility, runtime consumer compatibility, hostile same-account isolation, cross-platform support or production readiness.

A checksum-pinned Windows GitHub Actions workflow is prepared in .github/workflows/ci.yml. It has not been pushed or run. Its local engine tests deliberately retain the pending human gate and cannot prove live Switch collaboration or final approval.

## Final audit verification additions

The audit regression file covers contradictory PASS payloads, engine identity, exact criterion IDs, split UTF-8 process output, concurrent artifact overwrite denial, missing finalization and duplicate CSV rows. Snapshot monitoring tests include an edit restored before validation and an excluded runtime file. The zero/unknown-coupon tests are engineering tests of explicit implementation decisions; the six proposed acceptance tests remain unchanged.

Run `npm run format:check` for the actual Prettier check. Upstream license text is excluded from formatting. E2E commands use a fresh isolated test ledger/artifact root and never read or create real human review records. The 625 state combinations are exercised inside one reported unit test.

`node scripts/review-packet.mjs` prepares a new corrected frozen snapshot, runs the actual Vitest executable from that snapshot and records hashes, IDs and execution data in HUMAN_REVIEW_PACKET.md. It grants no approval. The local finalization report records the separate opposing-source experiment and clean-checkout results; remote CI remains a separate verification gate.

## Current delivery verification

Main and isolated checkout: 117/117 across 18 files, no failures/skips. Added 12 persistence boundary regressions, five production-adapter faults and a package import/public-interface/cycle check to the previous 99-test baseline. Initial nine persistence regressions actually failed before the repair. Negative adapter tests explicitly damage owned isolated inputs and never create review authority or production PASS evidence.

All seven declared CI jobs passed through the actual ci-proof script locally in the isolated checkout. Groups: 67 unit, 19 integration, 28 security, 3 local E2E; the artifact-contract job repeats 18 tests. Receipts retain exact command exits, counts, Node/browser/oasdiff versions, git SHA/worktree state, lock hash and original/redacted report hashes. Only job-specific redacted synthetic receipts/reports are selected for upload. No remote Actions run has occurred. Offline docs:check checks tracked local Markdown destinations, excluding code examples; it does not check external URL reachability or heading anchors.
