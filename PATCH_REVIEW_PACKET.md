# Synthetic correction review packet

The verified demo selected the tracked corrected scenario after a separate human patch review. Inspect the exact changes before selecting that scenario in a new run. The reconciliation change uses the synthetic orders file as the authority for the ledger amount.

The four changes reject coupons at or after expiration, associate the checkout email label with its input, restore the `application/json` contract for the order response, and correct the synthetic O-1002 ledger amount to 1500 cents.

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

## Reproduce the review

From the repository root, write the scenario comparison to an ignored file. Git returns exit 1 when the scenarios differ. Inspect the generated patch before proposing it.

```powershell
New-Item -ItemType Directory -Force .local | Out-Null
git diff --no-index --output=.local/reviewed-scenario.patch -- fixtures/scenarios/defective fixtures/scenarios/corrected
```

Run `npm --silent run sf -- patch propose --snapshot <DEFECTIVE_SNAPSHOT_ID> --file .local/reviewed-scenario.patch --json`. Check the returned proposal against the intended snapshot and patch digest. In an interactive human-controlled terminal, run `npm --silent run sf -- patch attest --proposal <PATCH_PROPOSAL_ID> --json` and personally respond to the review prompt. Use `--reject` to record a rejection. Continue with the corrected scenario after a genuine matching approval.

See the [full human review procedure](ACTION_REQUIRED_FROM_HUMAN.md) and [CLI reference](docs/CLI.md).
