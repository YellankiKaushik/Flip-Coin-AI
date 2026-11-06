# Human actions required — PENDING

Updated November 6, 2026 after the workspace-local npm repair. These instructions prepare genuine human gates and issue no approval. The existing standalone Codex sandbox passed doctor through the copied npm 11.9.0 runtime. A successful human-requested Switch room command is still required. Criteria/test, patch and release decisions remain PENDING.

## 1. Verified manual CLI entry point

Open an ordinary interactive PowerShell terminal in the existing repository root. The private runner cache is ignored by Git and is not supplied by a fresh source checkout. On this configured machine:

```powershell
$nodeExe = 'C:\Program Files\nodejs\node.exe'
$npmCli = Join-Path (Get-Location).Path '.local\switchforge-runner-tools\npm\bin\npm-cli.js'
if (-not (Test-Path -LiteralPath $npmCli)) { throw 'Verified runner cache is absent; do not substitute another npm version' }
& $nodeExe $npmCli --silent run sf -- doctor --json
if ($LASTEXITCODE -ne 0) { throw 'Doctor failed; preserve the exact error' }
```

This manual result is local evidence. It does not establish a Switch room execution. Keep Auto mode ON and Bypass permissions OFF; never change security controls to force a command through.

## 2. Genuine Switch execution gate

Use the single current human retry message prepared in the local REPORT_TO_CHATGPT.md and its private evidence directory. Send it personally in switchforge-release-demo (private local reference). The saved agent instructions name the exact Node executable and workspace-local npm CLI tested in the existing standalone sandbox. The agent remains restricted to its seven existing project subcommands.

Preserve the genuine earlier failures. Capture the actual next command, cwd, exit and full JSON in that same room. Only a successful human-requested Switch invocation can close GATE-SW-02. This assistant has not sent the message. Any genuine provider permission or authentication prompt remains a human action; no bypass or impersonation.

## 3. Fresh criteria and acceptance-test review

Read HUMAN_REVIEW_PACKET.md, fixtures/scenarios/corrected/criteria/approved.json and apps/checkout-demo/tests/checkout.spec.ts personally. The criteria filename does not mean approval: its status remains PENDING. Review all six actual tests and five criteria, including exact millisecond-Z UTC input, expiry equality rejection, SAVE100's 100-cent discount, zero clamping and safe integer cents. Engineering tests do not grant approval.

The old criteria <DEMO_RECORD_ID> and patch <DEMO_RECORD_ID> proposals expired on November 6 at14:55 UTC. Do not reuse them. Generate a fresh 15-minute criteria request only when ready to review:

```powershell
$review = & $nodeExe $npmCli --silent run sf -- criteria propose --file fixtures/scenarios/corrected/criteria/approved.json --json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $review.ok) { throw 'Criteria proposal failed' }
$review.data.content
$review.data.proposal
```

Only after reviewing that exact content, personally run this separate command in the same interactive terminal:

```powershell
& $nodeExe $npmCli --silent run sf -- criteria attest --proposal $review.data.proposal.proposalId --json
```

Do not pipe or redirect the attestation, automate stdin, use an agent TTY or ask an agent to type. The implementation requires both stdin and stderr to be real TTYs. At the displayed prompts enter your real reviewer name/reference, then exactly `HUMAN REVIEWED <the returned proposalId>`. To reject, add `--reject` and enter your reference and `REJECT`. An expired proposal must be recreated and reviewed again. Do not edit the criteria JSON to APPROVED. This is Level 1 HUMAN_ATTESTED_FOR_DEMO; reviewer identity is not cryptographically authenticated.

No fresh request or human attestation was created during the sandbox repair. A chat statement, command request, passing test or doctor cannot grant criteria approval.

## 4. Fresh defective run after genuine review

Once the real criteria/test review is recorded, request a fresh synthetic defective snapshot and run through the existing Switch agent. Use only returned snapshot/run IDs and a fresh candidate/idempotency key. For a manual fallback, the same commands in this interactive terminal are local evidence only:

```powershell
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$candidate = "human-demo-$stamp"
$bad = & $nodeExe $npmCli --silent run sf -- prepare --scenario defective --candidate $candidate --json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $bad.ok) { throw 'Prepare failed' }
$before = & $nodeExe $npmCli --silent run sf -- run --snapshot $bad.data.snapshotId --key "defective-$stamp" --json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $before.ok) { throw 'Run failed; inspect preserved evidence' }
& $nodeExe $npmCli --silent run sf -- verify-evidence --run $before.data.run.runId --json
& $nodeExe $npmCli --silent run sf -- report --run $before.data.run.runId --json
```

Inspect actual statuses and artifacts from all four engines; exit0 alone is not readiness. Do not describe unreviewed acceptance ERROR as a reviewed failing test. The existing diagnostic runs stay BLOCKED and cannot substitute for fresh reviewed runs.

## 5. Separate correction review

Review PATCH_REVIEW_PACKET.md and the exact the local review procedure, against the fresh defective snapshot. The proposed scenario correction is precommitted; selecting the corrected fixture is not proof of a newly authored application patch or permission to overwrite frozen snapshots.

Use the tracked CLI commands documented in the repository. This historical example used a local review setup.

After personally reviewing the exact diff and base digest, run without redirection:

```powershell
& $nodeExe $npmCli --silent run sf -- patch attest --proposal $patch.data.proposalId --json
```

Enter the real human reference and exact returned-proposal confirmation, or reject. Patch attestation does not apply a diff or grant a separate provider action. Never apply a scenario-directory patch as if it were a working-app change. Then personally request a fresh corrected scenario for the same candidate, disclosing the precommitted fixtures.

```powershell
$fixed = & $nodeExe $npmCli --silent run sf -- prepare --scenario corrected --candidate $candidate --json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $fixed.ok) { throw 'Corrected prepare failed' }
$after = & $nodeExe $npmCli --silent run sf -- run --snapshot $fixed.data.snapshotId --key "corrected-$stamp" --json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $after.ok) { throw 'Corrected run failed' }
& $nodeExe $npmCli --silent run sf -- verify-evidence --run $after.data.run.runId --json
& $nodeExe $npmCli --silent run sf -- compare --before $before.data.run.runId --after $after.data.run.runId --json
& $nodeExe $npmCli --silent run sf -- assert-ready --run $after.data.run.runId --json
```

All four real engines, current matching evidence/reviews and actual ReleaseProof readiness must support the conclusion. Never force READY or reuse expired/stale approval.

## 6. Separate final human decision

Only after the fresh corrected run genuinely returns READY_FOR_HUMAN_APPROVAL:

```powershell
$release = & $nodeExe $npmCli --silent run sf -- release-request --run $after.data.run.runId --json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $release.ok) { throw 'Release is blocked' }
$release.data
& $nodeExe $npmCli --silent run sf -- release-attest --proposal $release.data.proposalId --json
& $nodeExe $npmCli --silent run sf -- report --run $after.data.run.runId --json
```

Personally inspect the exact candidate, assessment, policy and evidence and answer the interactive prompts, or reject. This records synthetic readiness only and never deploys. The assistant must not perform criteria, patch or release attestation.

## 7. Recording, publication and submission

Follow docs/FINAL_DEMO_SCRIPT.md. Record the genuine human → Switch → agent → CLI → evidence sequence. If live execution or reviews remain incomplete, use its honest fallback: show standalone sandbox success, preserved real room failures, diagnostic FAIL→PASS for the other three engines, acceptance ERROR/PENDING and ReleaseProof BLOCKED. Do not fabricate a successful collaboration loop, reviewer approval or footage.

No push, video upload or submission has occurred. Inspect local source and redacted export before explicitly authorizing publication or performing it yourself. Destination remains YellankiKaushik/Flip-Coin-AI; after publication inspect actual GitHub Actions and public links. The prepared ZIP is evidence, not a completed entry. Personally sign in, confirm actual form labels/team/track/declarations, submit and retain its real receipt. These details remain UNSPECIFIED where no evidence exists. Deadline: November7,2026,23:59 IST; internal freeze17:00 IST and submit20:00 IST. Never publish `.local`, tool caches, private DBs or setup logs.
