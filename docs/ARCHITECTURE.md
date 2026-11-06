# Implementation architecture

The protected root DEEP_TECHNICAL_ARCHITECTURE_V2.md is authoritative and has not been modified. This file describes implementation, not a replacement specification. Sections 50–65 govern conflicts.

## Components

| Path | Implemented responsibility |
|---|---|
| apps/cli/src/main.ts and program.ts | Dependency-safe bootstrap, strict grammar, JSON envelopes and operator commands |
| apps/checkout-demo/src/server.ts | Loopback-only snapshot checkout and /__source identity response |
| packages/core/src/domain/models.ts | Typed models and strict boundary schemas |
| packages/core/src/infrastructure | Path guards, raw-byte manifest, inventory and bounded subprocesses |
| packages/core/src/application/run-checks.ts | One active run, candidate-scoped idempotency, lifecycle and orchestration |
| packages/checks/src | Four deterministic checks; separate Node data/browser workers |
| packages/evidence/src | Canonical JSON, SQLite migration/ledger and nonoverwriting artifact storage |
| packages/release/src | Fail-closed assessment, proposal lifecycle and interactive Level 1 attestation |

No extra messaging system, model runtime, microservice fleet or database server is introduced. Switch/Mattermost/Codex remain external. Domain policy does not call an LLM or browser.

## Candidate lifecycle

prepare copies allowlisted code/config/lockfile inputs and the chosen versioned scenario to a fresh .local/snapshots UUID. It computes sorted raw byte hashes and a canonical manifest with reviewed criteria/test identities, policy/check configuration and toolchain metadata. Every required glob must match. The explicit input configuration includes verifier code and SQL migration.

The manifest excludes volatile run IDs and timestamps. Its digest is recomputed before/after checks and on reads; inventory changes and changed current verifier inputs invalidate current use. Separate prepared snapshots are used for defective/corrected scenarios. No prepared file is intentionally edited during a run. Filesystem access remains cooperative; no hostile same-account immutability guarantee is made.

Effective check configuration follows committed config → .local/config.json → known SF_ environment values → explicit prepare overrides. Frozen canonical effective-checks.json is included in the input manifest. Unknown keys, unsafe storage paths, external sample URLs and unbounded values fail closed. Tool inventory hashes the actual matching Windows Chromium headless-shell executable, not the full-browser launcher.

## Execution and evidence

The coordinator acquires an exclusive PID/lease lock. The ledger records CREATED → VALIDATING → RUNNING → COMPLETED, or terminal INTERRUPTED. Four checks are sequential under an overall deadline. A legitimate domain defect is FAIL; missing review, malformed input/report, missing tool, resource exhaustion or interruption is ERROR. All mandatory nonpassing states block.

Each check preserves tool output/receipt, normalized result, coverage and hash references. Files are exclusively staged, flushed, renamed and then recorded. SQLite foreign keys, WAL and full synchronous transactions are enabled. Cross-file/database crash windows are handled by rejecting incomplete/missing evidence, not by trusting orphaned JSON.

## Readiness and review

ReleaseProof validates four distinct required results, toolchain, candidate, policy, criteria/test review and artifacts. Historical evidence remains historical; superseded runs cannot authorize a newer candidate. Only an actual interactive human action can create a Level 1 attestation through the normal CLI; same-account isolation is not claimed. No final human decision has been recorded during development.

The room workflow is still a distinct manual integration gate. Local engine or CLI tests do not substitute for it.
