# Verification strategy

Unit suites exercise canonical hashes, path confinement, strict CSV rules, state validation and all 625 combinations of PASS/FAIL/ERROR/SKIPPED/missing across four required checks. Those inputs are explicitly unit-test fixtures, not recorded tool executions or human approvals.

Integration suites use actual SQLite and oasdiff. Security tests use bounded real processes to test timeout/output exhaustion, allowlisting and literal argument handling. Local E2E invokes the actual CLI and real browser/API/data workers against both scenarios. Acceptance remains ERROR in the production workflow while the human criteria/test review is pending; other engines still execute.

Standalone coupon verification:

~~~powershell
npx vitest run --config vitest.candidate.ts
~~~

This command is development testing and grants no approval. The reviewed acceptance test source and raw machine report are linked by HUMAN_REVIEW_PACKET.md.

Use npm run test:unit, test:integration, test:security, test:e2e:local, and typecheck. `npm test` runs all tests. Never use ignored failures or turn unknown output into PASS. Test report counts must come from actual executed reports. No invented coverage percentage is provided.

Evidence under .local/verification and artifacts/runs is private local runtime output. Validate with verify-evidence before use. Changing verifier/config/lockfile invalidates old candidates; prepare a new snapshot after source changes. Tests do not fabricate human review records.

Not established by local tests: genuine Switch project execution, human review/attestation, complete accessibility, runtime consumer compatibility, hostile same-account isolation, cross-platform support or production readiness.

A checksum-pinned Windows GitHub Actions workflow is prepared in .github/workflows/ci.yml. It has not been pushed or run. Its local engine tests deliberately retain the pending human gate and cannot prove live Switch collaboration or final approval.
