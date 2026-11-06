# Human actions required — PENDING

Prepared November 6, 2026. This file records mandatory human gates; it does not issue approval. Work from the existing repository root. Do not run attest commands until you have personally reviewed the exact referenced content. Requests expire after 15 minutes; create a fresh request if expired. Do not edit the criteria status to APPROVED.

## 1. Criteria and acceptance test review

Read HUMAN_REVIEW_PACKET.md, fixtures/scenarios/corrected/criteria/approved.json and apps/checkout-demo/tests/checkout.spec.ts. Review the six test cases and five criteria. At/after expiry rejects without changing total; one millisecond before expiry applies SAVE100 (100 cents, clamped to zero); malformed/missing UTC timestamps and invalid/unsafe integer cents reject. SAVE100, discount size, zero clamping and exact millisecond-Z format are implementation decisions requiring your agreement. Additional zero/unknown-coupon engineering tests do not add human-approved criteria.

If correct, personally run in an interactive PowerShell terminal:

```powershell
$review = npm --silent run sf -- criteria propose --file fixtures/scenarios/corrected/criteria/approved.json --json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $review.ok) { throw 'Criteria proposal failed' }
$review.data.content
npm --silent run sf -- criteria attest --proposal $review.data.proposal.proposalId --json
```

Enter your real reviewer reference and exactly `HUMAN REVIEWED <returned proposalId>` only after review. To reject, use the same command with `--reject` and type `REJECT`. This is Level 1 HUMAN_ATTESTED_FOR_DEMO; identity is not cryptographically verified. An ordinary chat response never updates the ledger. No agent may type this attestation for you.

## 2. Genuine Switch command proof

Open the existing Mattermost room:

SwitchForge room (private local reference)

The dedicated Codex agent is `@switchforge-demo-agent`, configured to the original workspace. Keep the connectivity agent and room intact. Type and send this yourself:

> @switchforge-demo-agent In your configured SwitchForge project directory, read package.json and run npm --silent run sf -- doctor --json. Do not edit files or approve anything. Reply here with the actual working directory, exact command, process exit status and real JSON tool inventory. Do not substitute a greeting or earlier SETUP_OK evidence.

A bot's automatic welcome message is not this proof. If the provider requires sign-in or mandatory permission, personally complete it without disabling protections. Capture the real same-room reply. The command may require a normal provider tool permission; do not enable Bypass permissions.

After the real criteria review is recorded, send:

> @switchforge-demo-agent Prepare a fresh defective snapshot for candidate human-demo-20261106 using npm --silent run sf -- prepare --scenario defective --candidate human-demo-20261106 --json. Run the returned snapshot with a new idempotency key through the actual sf run command. Report exact command exits, snapshot/run IDs, candidate digest, all four statuses, ReleaseProof blockers and artifact references here. Verify the evidence. Do not attest or alter approval state.

Use a different candidate name if that identifier has already been used for an unrelated demonstration. Keys must be new per payload.

## 3. Separate patch review

Have the agent explain the real failing artifacts and prepare a diff in a staging path, never edit a frozen snapshot. Review the actual diff. Precommitted corrected fixtures must be disclosed as such; changing the selected scenario is not proof of a newly authored patch. A ready-to-review scenario repair diff is prepared locally at the local review procedure if present in the final audit. It is a proposal only.

For the actual defective snapshot returned in step 2:

Use the tracked CLI commands documented in the repository. This historical example used a local review setup.

The human enters their reference and exact confirmation. Agent-side application needs the corresponding genuine provider/human authorization; patch attestation does not automatically apply a diff. Do not apply a scenario-directory diff as though it were a working-app patch. These precommitted fixtures demonstrate the documented defects/corrections, with a new snapshot required for every recheck.

Then personally request:

> @switchforge-demo-agent I have reviewed the displayed correction through the separate supported review procedure. Disclose that we are selecting the precommitted corrected scenario. Prepare a fresh corrected snapshot for the same candidate, run all four engines with a new key, verify evidence, and compare it with the actual defective run. Cite both run IDs, different digests, tool receipts and assessment. Do not claim readiness unless ReleaseProof returns READY_FOR_HUMAN_APPROVAL. Do not record final release attestation yourself.

Send that message only if its review statement is true.

## 4. Separate final readiness decision

Only after the corrected run genuinely has four valid PASS results and current READY_FOR_HUMAN_APPROVAL:

```powershell
$release = npm --silent run sf -- release-request --run <actual-corrected-runId> --json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $release.ok) { throw 'Release is blocked' }
$release.data
npm --silent run sf -- release-attest --proposal $release.data.proposalId --json
npm --silent run sf -- report --run <actual-corrected-runId> --json
```

Review the exact candidate, assessment, policy and evidence. Enter the attestation yourself, or reject. This records synthetic readiness and never deploys. Readiness, criteria review, patch review and final decision are separate. Any source/tool/policy/evidence change requires new verification; expired or superseded proposals cannot be reused.

## 5. Publication, recording and actual submission

No GitHub push, video upload or hackathon submission has occurred. After inspecting the local branch and redacted export, explicitly authorize publication or perform it yourself:

```powershell
git push -u origin codex/switchforge-implementation
```

Destination is the existing YellankiKaushik/Flip-Coin-AI repository. Inspect the actual GitHub Actions run and fix failures before claiming CI success. Record the genuine human → Switch → agent → CLI → evidence → reviewed correction → new run → human decision sequence. Inspect repo/video/evidence link access, credits and notices. Submit personally through the event interface and retain its actual receipt. Deadline November 7, 2026, 23:59 IST; internal targets freeze 17:00 IST, submit 20:00 IST.
