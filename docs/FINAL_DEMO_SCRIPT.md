# Authentic final demonstration script

This is a preparation script, not proof of a completed recording. Criteria/test, correction and final release decisions remain PENDING. Never automate the human messages or attestations. All commands run from the existing repository root. Inspect each JSON `ok` field and process exit. Exit 0 is completed operation, not readiness.

## 1. Show real collaboration and command proof

Show the actual Mattermost room switchforge-release-demo (private local reference) and the existing Codex agent. The human personally sends the single current retry from the local REPORT_TO_CHATGPT.md. Its exact Node-to-workspace-local-npm command has passed doctor in the existing standalone Codex workspace sandbox. This is not yet a successful real Switch receipt.

Preserve the earlier genuine bootstrap/version/access failures. Capture the real next reply, command, cwd, exit and complete JSON, including any genuine permission interaction. Keep Auto ON and Bypass OFF. A welcome message, ordinary terminal result or standalone sandbox result cannot close GATE-SW-02. Use the manual variables in ACTION_REQUIRED_FROM_HUMAN.md for later terminal examples; the runner cache is private and is not distributed in Git.

## 2. Genuine criteria and test review

Show HUMAN_REVIEW_PACKET.md and actual criteria/test files. Explain the equality-expiry defect, exact UTC/integer rules, and the explicit SAVE100/100-cent/zero-clamp/parser decisions. A human personally reviews and uses the criteria propose/attest procedure in ACTION_REQUIRED_FROM_HUMAN.md. Record the resulting real ledger state, or honestly show PENDING/rejection. No agent may type the confirmation.

If review remains pending, record the blocked workflow honestly and stop the positive acceptance/readiness sequence. Independent local tests do not substitute for this review.

## 3. Fresh defective execution after review

Human personally requests:

> @switchforge-demo-agent Prepare a fresh defective snapshot for candidate recorded-demo-20261106. Run the returned snapshot through the actual sf run command with a fresh key. Verify evidence and post exact command exits, snapshot/run IDs, candidate digest, all four statuses, ReleaseProof blockers and artifact references in this room. Do not attest anything.

Actual command template, using only returned values:

```powershell
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$candidate = "recorded-demo-$stamp"
$bad = & $nodeExe $npmCli --silent run sf -- prepare --scenario defective --candidate $candidate --json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $bad.ok) { throw 'Prepare failed' }
$before = & $nodeExe $npmCli --silent run sf -- run --snapshot $bad.data.snapshotId --key "defective-$stamp" --json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $before.ok) { throw 'Run failed; inspect preserved evidence' }
& $nodeExe $npmCli --silent run sf -- verify-evidence --run $before.data.run.runId --json
& $nodeExe $npmCli --silent run sf -- report --run $before.data.run.runId --json
```

After genuine matching review, expected business findings are the actual expiry failure, missing label, incompatible media-type removal and 500-cent CSV discrepancy. If a tool fails, show ERROR, not a manufactured business FAIL. Do not show current unreviewed acceptance ERROR as if it were an approved Vitest execution.

## 4. Separate correction review

Open PATCH_REVIEW_PACKET.md and the actual the local review procedure. The human reviews the real diff and base candidate, separately from criteria. Use patch propose/attest with the returned defective snapshot and genuine human input, as documented. Disclose that corrected scenario fixtures are precommitted. Selecting them is not a newly authored patch or authorization to overwrite a frozen snapshot. Record accepted/denied provider actions truthfully.

Human sends only after actually reviewing:

> @switchforge-demo-agent I reviewed the displayed correction through the separate supported review procedure. Disclose selection of the precommitted corrected scenario. Prepare a new corrected snapshot for the same candidate, run all four engines with a new key, verify evidence, and compare with the actual defective run. Cite both IDs, different digests, receipts and assessment. Do not record final attestation yourself.

## 5. Fresh corrected execution

```powershell
$fixed = & $nodeExe $npmCli --silent run sf -- prepare --scenario corrected --candidate $candidate --json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $fixed.ok) { throw 'Prepare failed' }
$after = & $nodeExe $npmCli --silent run sf -- run --snapshot $fixed.data.snapshotId --key "corrected-$stamp" --json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $after.ok) { throw 'Run failed; inspect preserved evidence' }
& $nodeExe $npmCli --silent run sf -- verify-evidence --run $after.data.run.runId --json
& $nodeExe $npmCli --silent run sf -- compare --before $before.data.run.runId --after $after.data.run.runId --json
& $nodeExe $npmCli --silent run sf -- assert-ready --run $after.data.run.runId --json
```

Show actual raw Vitest/axe/oasdiff/CSV reports, screenshot, completion inventory and distinct digests. Four valid PASS results and the actual ReleaseProof result are required. Current engineering corrected run remains BLOCKED; do not reuse it as approved evidence.

## 6. Separate human final decision

Only if the fresh corrected run is genuinely READY_FOR_HUMAN_APPROVAL:

```powershell
$release = & $nodeExe $npmCli --silent run sf -- release-request --run $after.data.run.runId --json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $release.ok) { throw 'Release is blocked' }
$release.data
# Human reviews candidate, assessment, policy and evidence, then personally runs:
& $nodeExe $npmCli --silent run sf -- release-attest --proposal $release.data.proposalId --json
& $nodeExe $npmCli --silent run sf -- report --run $after.data.run.runId --json
```

Human enters their real reference and exact requested confirmation, or rejects. Label success **Level 1 HUMAN_ATTESTED_FOR_DEMO, identity not cryptographically verified**. Requests expire after 15 minutes; recreate stale requests. This records synthetic readiness and never deploys. The agent reports the actual resulting state in the same room.

## 7. Reproducibility, limits and submission

Show actual Git SHA, documented fresh setup, 117-test report and six-case frozen-source proof. State that 625 combinations are one generated test. Explain cooperative same-account limits, selected axe rule, synthetic CSV scope, public acyclic package boundaries, strict evidence validation and retained security/provider limits in FINAL_ENGINEERING_AUDIT.md. Do not claim production readiness, WCAG certification or measured commercial impact.

Export the actual recorded runs to a new local path; inspect the result before publication. Current prepared engineering archive is explicitly BLOCKED evidence, not the final approved recording. Never upload DBs, tokens, private setup logs or original protected reference files.

Record the genuine walkthrough. Publish source/video only with explicit authorization, inspect the actual GitHub Actions run and public link access, then have a real person submit through the event interface and retain its receipt. Deadline November 7, 2026, 23:59 IST; internal freeze/submission targets are 17:00/20:00 IST. No video or receipt is fabricated by this script.

## Honest fallback if genuine live or review gates remain incomplete

Record actual screens and terminal results only. Show the preserved room failures, then the workspace-local doctor success in the standalone sandbox and label it clearly as local sandbox evidence. Show the existing verified diagnostic bad/good artifact sets: acceptance ERROR because human criteria/test review is PENDING; accessibility, contract and data FAIL→PASS; both release assessments BLOCKED. Explain that precommitted corrected fixtures are disclosed and that no final human decision exists. Do not stage messages, approvals, cursor actions or synthetic footage as authentic collaboration. A fallback video can demonstrate implemented behavior while clearly disclosing the missing live/review lifecycle; it cannot be advertised as a completed release workflow. No fallback video was recorded automatically during this repair.
