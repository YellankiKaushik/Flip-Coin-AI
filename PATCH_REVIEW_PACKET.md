# Patch review packet — PENDING

Actual precommitted defective-to-corrected scenario diff; no human authorization or newly applied repair is claimed.

Base snapshot <DEMO_RECORD_ID>; base candidate ce4484c1ac79cd73d0181eccebbf97ea1462805d96c20d8a2b11a2ab129c4e55.

Diff .local/review/corrected-scenario.patch: 3344 bytes; SHA-256 2344c847a48c1751ae7018acfa2da43cbee8f579a25f54f92cfe2f9fd54488ee. The earlier REQUESTED proposal <DEMO_RECORD_ID> has expired. Create a fresh request only after actual review using ACTION_REQUIRED_FROM_HUMAN.md.

Changes: strict coupon equality rejection; associated Email label; restored application/json totalAmount response contract; O-1002 ledger charge 1000 to 1500 cents. Selecting corrected fixtures must be disclosed and creates a new snapshot. Do not blindly apply this scenario-directory diff to a working app or frozen snapshot.

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

Real production evidence: three FAIL-to-PASS transitions; acceptance ERROR while review pending. Separate frozen engineering Vitest gives 5/6 defective, 6/6 corrected and grants no approval. Criteria, patch and release review remain separate and PENDING.
