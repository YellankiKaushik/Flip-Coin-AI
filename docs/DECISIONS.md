# Implementation decisions and unresolved items

The protected specification is unchanged. These choices fill implementation details; they do not waive requirements.

| Decision                                                                     | Reason / limit                                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Existing Flip-Coin-AI root and codex implementation branch                   | Preserve user repository/history; no nested clone                               |
| Exact Node 24.16.0/npm 11.9.0 and pinned packages                            | Actual tested Windows environment                                               |
| better-sqlite3 13.0.3, SQLite 3.53.4                                         | Native rebuild and transaction smoke passed; no fallback                        |
| oasdiff 1.35.0, response media-type removal                                  | Official checksums verified and actual break observed                           |
| SAVE100 subtracts 100 cents, clamp at zero                                   | Document leaves discount unspecified; awaiting human review                     |
| Strict UTC millisecond-Z timestamp strings                                   | Deterministic boundary; reject invalid calendar values                          |
| CSV exact header order, reject unknowns, skip blank lines, nonempty coverage | Explicit deterministic narrow policy                                            |
| Orders authoritative only for proposed synthetic correction                  | Separate proposal output; no input modification; human review required          |
| axe label rule only                                                          | One reliable documented defect; no broad accessibility claim                    |
| Assigned loopback port per snapshot worker                                   | Avoid wrong-worktree server reuse; port/source recorded                         |
| Candidate manifest also binds verifier/SQL/root config                       | Prevent same source candidate being judged by silently changed code             |
| Current source inventory must match prepared verifier                        | Fresh snapshot required after implementation/config changes                     |
| Criteria input PENDING and ledger review required                            | User explicitly withheld approval; illustrative APPROVED cannot authorize       |
| Level 1 interactive attestation                                              | Independent reviewer OS account not implemented; no strong identity claim       |
| Explicit --reject for review commands; patch propose/attest                  | Makes documented rejection and patch scopes concrete; no deployment side effect |
| Seven-day retention discussed, preview only implemented                      | No deletion without human-controlled action                                     |

Configuration precedence is implemented and tested: committed settings, local overrides, known SF_ environment values, then explicit prepare overrides. Effective values are part of frozen candidate identity. The tested browser is matching Chromium headless-shell; full-browser launch returned spawn UNKNOWN and no security settings were bypassed.

Unresolved: real Switch command proof; positive human attestation and final readiness lifecycle; final video/submission; extensive crash/concurrent-process stress; remote audit/identity; broader accessibility/API/OS support. These remain incomplete rather than being removed from the source requirements.
