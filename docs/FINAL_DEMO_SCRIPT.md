# Authentic final demonstration script

This is a preparation script, not proof of a completed recording. Criteria/test, correction and final release decisions remain PENDING. Never automate the human messages or attestations. All commands run from the existing repository root. Inspect each JSON `ok` field and process exit. Exit 0 is completed operation, not readiness.

## 1. Show real collaboration and command proof

Show the actual Mattermost room switchforge-release-demo (private local reference), genuine human request<PRIVATE_POST_ID> and the existing agent's genuine successful room receipt (private local reference). The actual23:25 IST command used installed Node and the workspace-local npm11.9.0 CLI; provider exit0 and JSON correlation<DEMO_RECORD_ID> match the room. Show original real screens/receipts, not staged messages. This invocation is VERIFIED and need not be repeated merely for preparation.

Preserve the earlier genuine failures as history. Explain that doctor has no snapshot/run ID and does not approve tests or release. Keep Auto ON and Bypass OFF. The next human action is genuine criteria/test review. Use the manual variables in ACTION_REQUIRED_FROM_HUMAN.md for later examples; runtime caches and private evidence are not published automatically.

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

Record actual screens and terminal results only. Show the preserved genuine failures and later successful live doctor receipt, with the actual command/exit/JSON. If showing standalone sandbox evidence too, label that separately. Show the existing verified diagnostic bad/good artifact sets: acceptance ERROR because human criteria/test review is PENDING; accessibility, contract and data FAIL→PASS; both release assessments BLOCKED. Explain that precommitted corrected fixtures are disclosed and that no final human decision exists. Do not stage messages, approvals, cursor actions or synthetic footage as authentic collaboration. A fallback video can demonstrate implemented behavior while clearly disclosing the missing live/review lifecycle; it cannot be advertised as a completed release workflow. No fallback video was recorded automatically during this repair.

## Manual recording controls and order

1. Open the existing room, human review packet, actual run reports and repository README. Close unrelated private windows; do not show credentials or private setup logs. Use the existing screen recorder's New/Record controls to select only the project windows. No recorder or microphone authorization is bypassed.
2. Start recording and explain the synthetic checkout problem and why Switch carries the shared human/agent workflow. Show the real successful doctor request and response; do not resend it merely to stage an interaction.
3. Follow sections 2–6 only as the human genuinely performs each review. Show the real defective findings, separately reviewed precommitted correction, new corrected evidence, actual ReleaseProof assessment and separate human decision. If a prerequisite remains pending, use the honest fallback above and say so on camera.
4. Show actual evidence verification and the source branch. Distinguish local source/CI preparation from published GitHub content. End by stating any remaining limitations or gates truthfully.
5. Stop recording and save the genuine video locally, preferably as MP4 if the recorder supports it. Play the entire saved file to check legible text, continuity, narration and accidental private content. If an unintended secret appears, keep the raw file private and rerecord the affected demonstration without altering the claimed event sequence.
6. Only after explicit publication authorization, upload the actual reviewed video and verify its real public URL/access before entering the submission form. No video file, duration, upload or public URL currently exists in this handoff; do not fill those fields with placeholders presented as real links.
