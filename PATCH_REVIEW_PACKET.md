# Patch review packet — PENDING

Updated 2026-11-06T18:14:44.933930+00:00. These are precommitted synthetic scenario corrections, not a newly authored or applied production fix. No patch approval exists and no fresh patch proposal has been created before its prerequisite fresh reviewed defective run.

## Defects, proposed correction and evidence

| Existing defect                                            | Precommitted corrected behavior                |
| ---------------------------------------------------------- | ---------------------------------------------- |
| Coupon accepts exactly at expiry (uses >)                  | Rejects now>=expiry (uses >=)                  |
| Email input lacks an associated label                      | Adds label for=email                           |
| Order response loses application/json totalAmount contract | Restores required integer totalAmount response |
| O-1002 ledger1000 versus order1500 cents                   | Corrected scenario ledger charge1500 cents     |

Historical engineering base snapshot `<DEMO_RECORD_ID>`, candidate digest `589a37dc749a3084b07377ea634ce80040b486727d475fe9d8b43b4236c9a502`, defective run<DEMO_RECORD_ID>. These identify existing evidence only; the reviewed demonstration must use a NEW defective snapshot after real criteria/test attestation. Its actual new identity is UNSPECIFIED until then. Current acceptance ERROR is missing review, not proof of an approved failing test; other three actual checks FAIL on this diagnostic base.

Actual the local review procedure:3344 bytes, SHA256 `2344c847a48c1751ae7018acfa2da43cbee8f579a25f54f92cfe2f9fd54488ee`. Before/after diff remains unchanged:

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

## Supported separate human procedure

After genuine criteria review and the fresh defective run, inspect this exact diff against that fresh base. Use ACTION_REQUIRED_FROM_HUMAN.md §5 to create a fresh PATCH_REVIEW request with the ACTUAL returned snapshot ID; inspect the returned base digest, patch digest, proposal ID and expiry, then personally run the unredirected interactive patch attest command and enter the exact real confirmation or reject. Do not reuse expired <DEMO_RECORD_ID> (expired2026-11-06T14:55:05.059Z). No proposal ID for the future fresh base is invented here.

Selecting the corrected fixture is disclosed as selecting precommitted demo content. It creates a new snapshot and does not overwrite the frozen defective candidate. A scenario-directory diff is not a working-app production patch. A successful corrected run is expected only after actual execution of all four tools; failure/error or stale evidence must stay BLOCKED. Patch review, provider action authorization and final release review are separate. Human reference is Level1 demo attestation, not cryptographically verified identity or real deployment permission.
