# Patch review packet — LIVE DEFECTIVE BASE / PENDING HUMAN PATCH REVIEW

The previously open human PowerShell terminal could not read the pinned browser at its AppData path. The private review helpers now select the verified project-local cache at `.local/switchforge-runner-tools/playwright-browsers/`. Two canonical verifications and two complete read-only patch preflights passed in each of fresh ordinary PowerShell 5.1, profile-enabled PowerShell 5.1, and the managed Codex sandbox. The same already-open terminal still needs its read-only check. The current helper SHA256 is `4d03bd3ad13fbccef001d5aa8cc772b7d8d0481434e69d6231fa73d17a067511`. The reviewed patch, evidence, criteria and tests retain their original hashes.

Current preflight repair: the full non-attesting path now passes in ordinary Windows PowerShell5.1 and bundled7, including profile-enabled5.1 started from user home. Two historical dependency failures are confirmed in the audit, but the exact failed dependency remains UNKNOWN. The private helper now captures complete native errors and exact child exit with an explicit project directory. Every validation remains mandatory. If a failure recurs, it stops before any proposal and prints a unique private diagnostic receipt. No system/toolchain/security settings changed.

Use the SAME simple action from the existing project prompt:

Use the tracked CLI commands documented in the repository. This historical example used a local review setup.

You personally inspect the diff and enter READY/reviewer confirmation only if you approve. `-PreflightOnly` is a separate strictly non-attesting diagnostic mode: it cannot create a proposal or enter any human prompt. The default helper still refuses redirected/noninteractive use.

Updated 2026-11-06T20:17:37.890430+00:00. Protected original V2 §§50–65 govern. Actual live room report (private local reference). Previous historical packet is archived privately; this packet binds the verified fresh base.

## Exact base and proposed change

Human patch review is **PENDING**. No fresh proposal has been created early, no human input has been supplied by the assistant, and no corrected reviewed run has executed. The proposed change is **selection of existing precommitted demonstration fixtures**, not a newly authored production fix. There are no application/config/test/fixture code edits in this phase.

| Binding                                  | Actual value                                                       |
| ---------------------------------------- | ------------------------------------------------------------------ |
| Candidate                                | `live-reviewed-defective-20261107-9afe6866-01`                     |
| Defective snapshot                       | `<DEMO_RECORD_ID>`                             |
| Defective run                            | `<DEMO_RECORD_ID>`                             |
| Base candidate digest                    | `9b44dae5eafad01e0b2a8a7582161ada67e0f26eaf6a752229c0a8c87f196922` |
| Assessment ID                            | `<DEMO_RECORD_ID>`                             |
| Assessment digest                        | `51307451cb599442865301e2a7d3481516ab4850397fc251c3ce4414e36c114f` |
| Evaluator/source SHA recorded by the run | `093c6cf7e8a86c83fa1e83b5b7fa7d53059fc357`                         |
| Patch file                               | the local review procedure                           |
| Exact raw patch SHA256                   | `2344c847a48c1751ae7018acfa2da43cbee8f579a25f54f92cfe2f9fd54488ee` |
| Exact raw patch bytes                    | 3344                                                               |

Actual source diff was recomputed with `git diff --no-index -- fixtures/scenarios/defective fixtures/scenarios/corrected`: exit **1** is the expected differences-found result, not a failed comparison. It matches the existing patch after line-ending normalization; the original 3344-byte patch was not rewritten. Every defective scenario input byte matches the frozen snapshot's fixtures/current input. Corrected scenario inventory/hashes are pinned in private local review tooling. No frozen snapshot was altered.

## Four actual findings and corrections

| Engine           | Actual status / coverage                    | Actual evidence and proposed bounded correction                                                                                                                                                                              |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AcceptanceRelay  | FAIL; 6 executed tests, 5 pass / 1 fail     | AC-001 at exact expiry returns APPLIED/1400 rather than EXPIRED_COUPON/1500. Existing corrected coupon changes `>` to `>=`; after-expiry rejection and the unchanged six tests remain intact.                                |
| A11yRelay        | FAIL; 1 scan                                | axe `label` violation at `#email`. Existing corrected HTML adds `<label for="email">Email</label>`. Coverage is the selected label rule, not a WCAG certification.                                                           |
| ContractGuardian | FAIL; 1 comparison                          | oasdiff `response-media-type-removed`, GET `/orders/{id}`, status 200, application/json removed. Corrected candidate restores the baseline JSON object with required nonnegative integer `totalAmount`; no exception/waiver. |
| DataRescue       | FAIL; 4 rows (2 orders + 2 ledger), 1 issue | AMOUNT_MISMATCH O-1002: expected1500/observed1000/difference500 cents. Proposed corrected synthetic ledger uses1500 and settled=true.                                                                                        |

## Reconciliation authority and proposed CSV

V2 §55.5, required rule4, requires a PAID order to have a settled ledger counterpart with equal safe-integer cents; rule7 requires a separate proposed output, never in-place mutation. Its **Fixture** paragraph explicitly names O-1002 order1500 versus ledger1000 and says the corrected fixture changes the charge to1500. `docs/DECISIONS.md` records “Orders authoritative only for proposed synthetic correction”; `packages/checks/src/data.ts` builds proposed ledger rows from orders and emits “Proposed corrections assume orders are authoritative for this synthetic fixture; human review required.”

The frozen `fixtures/current/data/orders.csv` row is `O-1002,1500,PAID`; its ledger row is `O-1002,1000,true`. This is a documented synthetic demo choice, not an inferred rule for real accounting or external data. The human must review that choice and reject if inappropriate. No real payment, account or ledger is updated.

Actual DataRescue proposed-corrections.csv (84 bytes, SHA256 `c67bb79198d497c16c8cc8fc7ba7454020585cc486c6bf0741de970ce5cc02b7`):

```csv
"order_id","charged_cents","settled"
"O-1001","1000","true"
"O-1002","1500","true"
```

The generated proposal uses quoted CSV/CRLF; the precommitted corrected fixture uses unquoted cells. The rows and values agree, but their raw bytes/hashes differ. Neither source CSV was overwritten.

## Exact existing before/after diff

```diff
diff --git a/fixtures/scenarios/defective/api/candidate.yaml b/fixtures/scenarios/corrected/api/candidate.yaml
index fb0610d..556d8fc 100644
--- a/fixtures/scenarios/defective/api/candidate.yaml
+++ b/fixtures/scenarios/corrected/api/candidate.yaml
@@ -22,9 +22,18 @@
           "200": {
             "description": "Order",
             "content": {
-              "text/plain": {
+              "application/json": {
                 "schema": {
-                  "type": "string"
+                  "type": "object",
+                  "required": [
+                    "totalAmount"
+                  ],
+                  "properties": {
+                    "totalAmount": {
+                      "type": "integer",
+                      "minimum": 0
+                    }
+                  }
                 }
               }
             }
diff --git a/fixtures/scenarios/defective/app/coupon.ts b/fixtures/scenarios/corrected/app/coupon.ts
index 7be0b55..3905eeb 100644
--- a/fixtures/scenarios/defective/app/coupon.ts
+++ b/fixtures/scenarios/corrected/app/coupon.ts
@@ -2,7 +2,7 @@ export function applyCoupon({subtotalCents,couponCode,couponExpiresAt,now}:{subt
  if(!Number.isSafeInteger(subtotalCents)||subtotalCents<0)throw new Error('INVALID_AMOUNT');
  const utc=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if(!utc.test(couponExpiresAt)||!utc.test(now)||!Number.isFinite(Date.parse(couponExpiresAt))||!Number.isFinite(Date.parse(now))||new Date(couponExpiresAt).toISOString()!==couponExpiresAt||new Date(now).toISOString()!==now)throw new Error('INVALID_TIME');
- if(Date.parse(now) > Date.parse(couponExpiresAt))return {code:'EXPIRED_COUPON',totalCents:subtotalCents};
+ if(Date.parse(now) >= Date.parse(couponExpiresAt))return {code:'EXPIRED_COUPON',totalCents:subtotalCents};
  if(couponCode!=='SAVE100')return {code:'INVALID_COUPON',totalCents:subtotalCents};
  return {code:'APPLIED',totalCents:Math.max(0,subtotalCents-100)};
 }
diff --git a/fixtures/scenarios/defective/app/index.html b/fixtures/scenarios/corrected/app/index.html
index 4d6012a..dfbd426 100644
--- a/fixtures/scenarios/defective/app/index.html
+++ b/fixtures/scenarios/corrected/app/index.html
@@ -1 +1 @@
-<!doctype html><html lang="en"><head><meta charset="utf-8"><title>SwitchForge synthetic checkout</title></head><body><main><h1>Checkout verification fixture</h1><form id="checkout-form" data-testid="checkout-ready"><input id="email" type="email" autocomplete="email"><button type="button">Review synthetic order</button></form></main></body></html>
\ No newline at end of file
+<!doctype html><html lang="en"><head><meta charset="utf-8"><title>SwitchForge synthetic checkout</title></head><body><main><h1>Checkout verification fixture</h1><form id="checkout-form" data-testid="checkout-ready"><label for="email">Email</label><input id="email" type="email" autocomplete="email"><button type="button">Review synthetic order</button></form></main></body></html>
\ No newline at end of file
diff --git a/fixtures/scenarios/defective/data/ledger.csv b/fixtures/scenarios/corrected/data/ledger.csv
index 83745d6..6099c67 100644
--- a/fixtures/scenarios/defective/data/ledger.csv
+++ b/fixtures/scenarios/corrected/data/ledger.csv
@@ -1,3 +1,3 @@
 order_id,charged_cents,settled
 O-1001,1000,true
-O-1002,1000,true
+O-1002,1500,true
```

The four changed files are api/candidate.yaml, app/coupon.ts, app/index.html and data/ledger.csv under the existing corrected scenario. Other scenario files are unchanged. Criteria raw SHA256 remains `f69fc54fcc167163ba6a715c10fabd4e9a63d2aaef27b5dd31efb259266a1e7c`; canonical criteria digest `51c39baba13fee5d5cd52078f3adab301566588b29dc1b405b5eff7706818eb7`; all six test-source bytes remain SHA256 `e62a5a42d226dbb351c8e532a3834a577c0cbaffca195695988944b4a6e99c2f`. The genuine existing criteria review does not grant this patch review or final release review.

## Supported human procedure and private helper

The existing authoritative commands are:

Use the tracked CLI commands documented in the repository. This historical example used a local review setup.

V2 §§52/57.1 require `baseCandidateDigest + patchDigest`. The implementation binds those as candidateDigest and resourceDigest in one proposal/decision, with evidenceRefs `[patch path, exact base snapshot ID]`. The canonical interactive transaction checks pending status, one-time nonce, expiry, current frozen manifest/current implementation, unchanged patch bytes and correct PATCH_REVIEW action. It writes a consumed Level1 decision atomically. It does not apply a patch, select a scenario or run a check. Release readiness remains a third separate action. No plaintext nonce or human confirmation is placed in the room.

Prepared private helper: the local review procedure, SHA256 `4dfe06b5d81d1d0ef0cb01ea80716e35e31492ebfcd212c640a03430339bc8d6`. Exact human launch from an ordinary interactive PowerShell terminal:

Use the tracked CLI commands documented in the repository. This historical example used a local review setup.

The first TTY guard refuses noninteractive/redirected use **before any CLI call**. It verifies helper/binding/diff hashes and runs canonical verify-evidence for the actual current toolchain and evidence. Its read-only inspector separately checks the exact run/snapshot/digest, all frozen/current scenario hashes, genuine criteria review, protected originals and six unchanged tests. It displays this exact diff, the source-of-truth choice and actual DataRescue proposal. It waits for the human to type READY and choose the approval or rejection prompt; any other entry cancels without creating a proposal. It rechecks after reading, creates a fresh 15-minute proposal only then, validates returned scope/digests/base/expiry and invokes the existing authoritative unredirected patch attest command. Only the human enters reviewer reference and the exact confirmation requested by that CLI. Ctrl+C cancels; if a request already exists it remains undecided and expires naturally—nothing is deleted or reused.

After canonical attestation, a private **read-only supplementary verifier** uses the application's Ledger in SQLite read-only mode to compare the persisted proposal/decision, Level1 actor binding, consumption time, scope, base, patch and nonce-record equality. It reports actual approval or rejection without writing a decision or exposing actor/key/nonce data. This is inspection of the existing mechanism, not a substitute approval path. Same-account Level1 storage is not tamper-proof or cryptographically authenticated. The genuine positive human terminal path is **NOT executed by the assistant**.

The interactive PowerShell helper remains human-only and is prohibited through the agent. The inspection capability gap was closed without changing any frozen application inputs: one exact read-only Node/tsx/local review tooling command is narrowly authorized in the saved existing-agent instructions. No other loader/script/flags/SQL/attestation is permitted. The private inspector opens the authoritative application Ledger read-only, matches the canonical persisted proposal/decision and validates fixed base/source/diff/evidence; it cannot grant or write approval. Its toolchain-verification-required field is explicit: run the normal pinned-npm canonical verify-evidence first, and keep all prepare/run strict dependency checks. It does not inventory tools, execute engines or replace those guards. Script SHA25631a4caa82c8b0f43b091e996797005ba8b8dcff9ae45e4bfd0ae75a11a32d81c; support SHAc58557e38709b16745ef0a1dcc09642dc0b4d344cbe066dda302ac5c0b569d2f; binding SHA327bd154dc1e57e0cb9f9656b650d2785f76f0a2768df1279b747f48d0c0cae9. Same-account mutable code/storage remains a disclosed Level1 limitation. No apps/packages/config/fixture edit was needed, so the verified fresh defective base stays valid.

Exact added inspection launch, with only the actual proposal UUID substituted:

Use the tracked CLI commands documented in the repository. This historical example used a local review setup.

Ordinary and provider-equivalent sandbox tests each returned exit0/ok:true/preflightValid:true for a deliberately wrong-scope CRITERIA_REVIEW ID, correctly returning patchReview.approved:false and recordedValid:false. The real ledger hash/decision count stayed identical. A genuine positive patch record remains untested until the human actually attests. Current persisted-policy verification is recorded separately in the final report; no new live Switch inspector execution is claimed.

## Actual technical validation and limits

- Existing canonical criteria inspection, verify-evidence and report: each exit0/ok:true. Criteria valid; evidence valid; actual assessment BLOCKED with exactly acceptance:FAIL/accessibility:FAIL/contract:FAIL/data:FAIL. DecisionState PENDING.
- Native Switch room shows genuine human `<PRIVATE_POST_ID>` and bot `<PRIVATE_POST_ID>`; all IDs/digests/findings match the ledger and recorded tool evidence. Original screenshot/accessibility preserved privately. Bot reports five CLI command exits0; Vitest and oasdiff child exit1 are expected business FAIL results, not a failed coordinator execution.
- Private helper/support tests: 18/18 PASS, including scoped proposal syntax in temporary TEST_ONLY ledgers, invalid/unknown/mismatched proposal denial, fake piped human confirmation denied, replay/wrong-scope/digest/nonce/actor/level/missing-record rejection, read-only no-mutation and rejection-not-approval. Zero test decisions were written to the real ledger.
- Existing review/security suite: 65/65 PASS, zero failed/skipped. Latest broader full suite remains the actually executed 137/137 baseline; it was not rerun because production code and frozen test inputs are unchanged.
- PowerShell helper parser: 0 errors. Real noninteractive wrapper launch: exit1 at its first guard, with no proposal/decision. Read-only preflight: exit0/ok:true, exact fresh binding valid, patch status PENDING.
- A Windows absolute path passed directly to Node --import initially failed ERR_UNSUPPORTED_ESM_URL_SCHEME. Corrected the private helper to use a file URL; the exact safe preflight then passed. No environment or toolchain changes.
- Final typecheck, format:check, integrity, docs:check, canonical live verify-evidence and whitespace checks passed, exit0. Docs checker:22tracked Markdown files/76local destinations/0failures. All protected/criteria/test/diff hashes matched, exact embedded diff matched, all24exported file hashes/sizes/original-hash references verified, and the scoped secret/local-profile-path scan found0matches. Real ledger remains30snapshots/21runs/7proposals/1decision/0patch decisions, serialized SHA256cd33d329f5655408c165177da52116b86fa0df0fa9366b0506a00dc669a7f497 unchanged. Exact receipts are in final-checks.json and WORK_LOG. No positive human approval or corrected reviewed execution was performed as a test.

## DO NOT SEND UNTIL PATCH APPROVAL

Only after genuine canonical approval, replace the placeholder with its actual returned proposal ID. The configured read-only inspector must independently verify that record before corrected execution. This is a conditional request, not evidence of a completed patch review.

Use the tracked CLI commands documented in the repository. This historical example used a local review setup.
