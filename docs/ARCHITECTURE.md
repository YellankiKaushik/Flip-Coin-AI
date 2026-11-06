# Implementation architecture

The protected root DEEP_TECHNICAL_ARCHITECTURE_V2.md is authoritative and has not been modified. This file describes implementation, not a replacement specification. Sections 50–65 govern conflicts.

## Components

| Path                                        | Implemented responsibility                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| apps/cli/src/main.ts and program.ts         | Dependency-safe bootstrap, strict grammar, JSON envelopes and operator commands |
| apps/checkout-demo/src/server.ts            | Loopback-only snapshot checkout and /__source identity response                 |
| packages/core/src/domain/models.ts          | Typed models and strict boundary schemas                                        |
| packages/core/src/infrastructure            | Path guards, raw-byte manifest, inventory and bounded subprocesses              |
| packages/core/src/application/run-checks.ts | One active run, candidate-scoped idempotency, lifecycle and orchestration       |
| packages/checks/src                         | Four deterministic checks; separate Node data/browser workers                   |
| packages/evidence/src                       | Canonical JSON, SQLite migration/ledger and nonoverwriting artifact storage     |
| packages/release/src                        | Fail-closed assessment, proposal lifecycle and interactive Level 1 attestation  |

No extra messaging system, model runtime, microservice fleet or database server is introduced. Switch/Mattermost/Codex remain external. Domain policy does not call an LLM or browser.

## Candidate lifecycle

prepare copies allowlisted code/config/lockfile inputs and the chosen versioned scenario to a fresh .local/snapshots UUID. It computes sorted raw byte hashes and a canonical manifest with reviewed criteria/test identities, policy/check configuration and toolchain metadata. Every required glob must match. The explicit input configuration includes verifier code and SQL migration.

The manifest excludes volatile run IDs and timestamps. Its digest is recomputed before/after checks and on reads; inventory changes and changed current verifier inputs invalidate current use. Separate prepared snapshots are used for defective/corrected scenarios. No prepared file is intentionally edited during a run. Filesystem access remains cooperative; no hostile same-account immutability guarantee is made.

Effective check configuration follows committed config → .local/config.json → known SF_ environment values → explicit prepare overrides. Frozen canonical effective-checks.json is included in the input manifest. Unknown keys, unsafe storage paths, external sample URLs and unbounded values fail closed. Tool inventory hashes the actual matching Windows Chromium headless-shell executable, not the full-browser launcher.

## Execution and evidence

The coordinator acquires an exclusive PID/lease lock. The ledger records CREATED → VALIDATING → RUNNING → COMPLETED, or terminal INTERRUPTED. Four checks are sequential under an overall deadline. A legitimate domain defect is FAIL; missing review, malformed input/report, missing tool, resource exhaustion or interruption is ERROR. All mandatory nonpassing states block.

Each check preserves tool output/receipt, normalized result, coverage and hash references. Files are exclusively staged, flushed, atomically published without replacement and then recorded. SQLite foreign keys, WAL and full synchronous transactions are enabled. Cross-file/database crash windows are handled by rejecting incomplete/missing evidence, not by trusting orphaned JSON.

## Readiness and review

ReleaseProof validates four distinct required results, toolchain, candidate, policy, criteria/test review and artifacts. Historical evidence remains historical; superseded runs cannot authorize a newer candidate. Only an actual interactive human action can create a Level 1 attestation through the normal CLI; same-account isolation is not claimed. No final human decision has been recorded during development.

The room workflow is still a distinct manual integration gate. Local engine or CLI tests do not substitute for it.

## Final audit changes

Evidence publication uses an exclusively created, flushed temporary file and atomic same-volume hard-link creation, followed by temporary-link removal. This prevents an arriving writer from replacing an existing artifact; unsupported hard links fail rather than silently overwriting. A final `completion.json` is published last and binds the complete registered evidence inventory. Public assessment and evidence verification reject a run without this record, even if its SQLite status says COMPLETED. Older evidence lacking the new record remains preserved historical evidence and is not eligible for a current release.

New runs explicitly record criteriaRevision, policyDigest and toolchainDigest in their JSON ledger payload. Legacy rows are read compatibly but cannot satisfy the new assessment identity checks without those original bindings. This is an additive payload change, not a claim that a new SQL migration was executed. The canonical schema already has candidate-scoped key uniqueness; no history was rebuilt or deleted.

Cooperative snapshot monitoring additionally checks file metadata while a run is active and remembers observed changes, including bytes restored before a check finishes. Raw bytes remain the candidate identity. Windows recursive native fs.watch aborted the pinned Node worker in an actual test; the shipped implementation uses watchFile polling plus synchronous metadata checks. This is not a hostile-account immutability guarantee or proof that every possible transient edit is observable.

At release decision time, synchronous tool hash/package-version checks run inside the immediate transaction after a full live inventory before it. TTL is checked again immediately before consuming the nonce. Reports also recheck request expiry and candidate/assessment/policy bindings. Human approval remains pending; no positive human decision was manufactured to test these branches.
