# Testing and evidence

## Current measured results

The complete sanitized-clone suite passed **137 tests across 19 files**, with zero failures or skips. It runs unit, integration, security and real local CLI/browser checks against isolated synthetic data. The 625 required-check state combinations are exercised inside one reported unit test. Counts from overlapping groups must not be added together.

The completed human-supervised room demo is separate evidence. Its defective run returned four FAIL results. After a real patch review, a separate corrected run returned four PASS results with valid evidence, positive coverage and zero blockers. Three separate human reviews were recorded. The final Level 1 recorded decision persists, while its later effective state is EXPIRED.

## Run the checks

```powershell
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run docs:check
npm run integrity
```

Use the pinned Windows tool installation in the [README](../README.md). Integration and E2E need the real Chromium and checksum-verified oasdiff executable. Lint currently invokes TypeScript static checking. The integrity command verifies private protected references when present locally and reports their exclusion from public checkouts. Markdown checking covers tracked local destinations outside fenced examples. It does not prove authenticated external-page access.

## Meaningful boundaries

Unit tests exercise canonical hashes, paths, model validation, candidate idempotency, approval expiry and fail-closed policy. Persistence regressions cover malformed stored data, evidence tampering, artifact overwrite denial, incomplete completion records and package interfaces. Integration tests use actual SQLite and oasdiff. Security tests use bounded child processes for timeout, output and literal-argument behavior. Local E2E executes the actual CLI and workers against separate defective and corrected fixture states.

Isolated test review records are TEST_ONLY fixtures. They do not create, replace or prove real human approval. Normal acceptance execution requires the reviewed criteria/test digests. Missing review yields ERROR and blocks readiness. Standalone fixture testing grants no approval.

## Real CI

The [workflow](../.github/workflows/ci.yml) declares seven Windows jobs with pinned action SHAs and exact tool setup. Each job writes actual command receipts and redacted synthetic reports with source, lockfile and tool provenance. The upload step selects only that job's private runtime output for the CI artifact.

All seven jobs passed on the implementation [push](https://github.com/YellankiKaushik/Flip-Coin-AI/actions/runs/42335780195), [PR](https://github.com/YellankiKaushik/Flip-Coin-AI/actions/runs/42335865503), and [first main merge](https://github.com/YellankiKaushik/Flip-Coin-AI/actions/runs/42339056170). Current later runs are visible on [Actions](https://github.com/YellankiKaushik/Flip-Coin-AI/actions).

The jobs are dependency-install, typecheck, unit, integration-checks, security-smoke, artifact-contract, and docs-link-check. The artifact-contract group repeats selected tests. These job counts are not extra tests to add to the full suite.

## What remains outside the evidence

This release tests the synthetic Windows x64 workflow. Automated axe coverage is the configured label rule. API compatibility is at OpenAPI document level. CSV rules cover narrow reconciliation cases. Business adoption, runtime consumer compatibility, complete accessibility, cross-platform operation, hostile same-account isolation and production deployment have no acceptance claim.
