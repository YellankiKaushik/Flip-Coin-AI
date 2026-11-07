# CLI reference

Use `npm --silent run sf -- COMMAND --json`. All required commands support JSON. Responses are one object with schemaVersion, ok, correlationId, and either data or structured error. Unknown flags and command-specific flag misuse are rejected.

| Command          | Arguments                                     | Authority                                |
| ---------------- | --------------------------------------------- | ---------------------------------------- |
| doctor           | none                                          | Read environment/tool inventory          |
| prepare          | --scenario defective/corrected --candidate ID | Reviewed developer preparation           |
| criteria show    | --candidate ID                                | Read latest criteria for candidate       |
| criteria propose | --file relative-path                          | Pending proposal only                    |
| criteria attest  | --proposal ID [--reject]                      | Interactive real human only; Level 1     |
| run              | --snapshot UUID --key KEY                     | Verification, no approval                |
| report           | --run UUID                                    | Revalidated historical report            |
| compare          | --before UUID --after UUID                    | Before/after results                     |
| verify-evidence  | --run UUID                                    | Integrity verification                   |
| release-request  | --run UUID                                    | Proposal only; requires current READY    |
| release-attest   | --proposal ID [--reject]                      | Interactive real human only; Level 1     |
| recover          | --run UUID                                    | Interrupted-run operator reconciliation  |
| export-demo      | --runs UUID,UUID --output relative-directory  | New redacted local bundle                |
| purge            | --before ISO-date --dry-run                   | Preview only; zero deletion              |
| patch propose    | --file relative-patch --snapshot UUID         | Patch digest plus base candidate binding |
| patch attest     | --proposal ID [--reject]                      | Interactive real human review            |
| assert-ready     | --run UUID                                    | Optional CI policy assertion             |

Exit contract: 0 completed check operation, even when domain findings block; 2 invalid input; 3 unavailable dependency; 4 unauthorized action; 5 run/idempotency conflict; 6 corrupt/stale candidate evidence; 7 timeout; 8 stale/invalid approval; 9 persistence/internal error; 130 handled operator interruption. Per-check statuses and raw subprocess codes are separate. Current full-run ERROR aggregation and any unverified exit-code cases are listed in local implementation reports; do not infer readiness from exit 0.

Same candidate and key with identical canonical request returns the original run. Different request with the same scoped key conflicts; a different candidate may reuse the key. Fixes require a new snapshot/run, not overwriting results.

Optional prepare overrides: --timeout-ms, --browser-timeout-ms, --max-output-bytes and --sample-url. They are validated, frozen into the snapshot and retained for later identity comparison. They do not waive a required check. Default sample URL is http://127.0.0.1:4173; an explicitly configured port 0 requests a recorded assigned loopback port. Local overrides use .local/config.json. Artifact/DB/tool overrides remain confined to artifacts or .local; the MVP workspace remains the owned checkout application.

No command accepts arbitrary shell text, an external URL to scan, a forced PASS, a waiver, or strong approval from chat. Export remains local; no GitHub push or entry submission is performed.
