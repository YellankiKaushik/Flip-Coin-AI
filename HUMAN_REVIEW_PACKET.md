# HUMAN REVIEW PACKET — PENDING

No human approval has been recorded. The user explicitly withheld approval and requested this packet. Ordinary development tests grant no approval.

## 1. Exact acceptance criteria

fixtures/scenarios/corrected/criteria/approved.json. The filename follows the specification; its actual status is PENDING.

~~~json
{
  "schemaVersion": 1,
  "criteriaId": "checkout-coupon-v1",
  "revision": 1,
  "status": "PENDING",
  "cases": [
    {
      "id": "AC-001",
      "description": "At expiry reject and preserve total"
    },
    {
      "id": "AC-002",
      "description": "One millisecond before expiry apply SAVE100 discount of 100 cents"
    },
    {
      "id": "AC-003",
      "description": "After expiry reject and preserve total"
    },
    {
      "id": "AC-004",
      "description": "Invalid or missing UTC timestamps are rejected"
    },
    {
      "id": "AC-005",
      "description": "Negative, fractional and unsafe integer cents are rejected"
    }
  ]
}
~~~

## 2. Actual test cases

apps/checkout-demo/tests/checkout.spec.ts:

~~~typescript
import { test, expect } from "vitest";
import { applyCoupon } from "../../../fixtures/current/app/coupon.ts";
const base = {
  subtotalCents: 1500,
  couponCode: "SAVE100",
  couponExpiresAt: "2026-11-01T00:00:00.000Z",
  now: "2026-11-01T00:00:00.000Z",
};
test("AC-001 at expiry rejects and preserves total", () =>
  expect(applyCoupon(base)).toEqual({
    code: "EXPIRED_COUPON",
    totalCents: 1500,
  }));
test("AC-002 one millisecond before expiry applies discount", () =>
  expect(
    applyCoupon({ ...base, couponExpiresAt: "2026-11-01T00:00:00.001Z" }),
  ).toEqual({ code: "APPLIED", totalCents: 1400 }));
test("AC-003 after expiry rejects and preserves total", () =>
  expect(applyCoupon({ ...base, now: "2026-11-01T00:00:00.001Z" })).toEqual({
    code: "EXPIRED_COUPON",
    totalCents: 1500,
  }));
test("AC-004 malformed and missing times reject", () => {
  for (const time of ["", "no-time", "2026-02-30T00:00:00.000Z", "2026-11-01"])
    expect(() => applyCoupon({ ...base, couponExpiresAt: time })).toThrow(
      "INVALID_TIME",
    );
});
test("AC-004 missing expiration and malformed or missing now reject", () => {
  expect(() =>
    applyCoupon({ ...base, couponExpiresAt: undefined as unknown as string }),
  ).toThrow("INVALID_TIME");
  for (const time of ["", "bad-time", undefined])
    expect(() => applyCoupon({ ...base, now: time as string })).toThrow(
      "INVALID_TIME",
    );
});
test("AC-005 invalid and unsafe integer cents reject", () => {
  for (const value of [-1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
    expect(() => applyCoupon({ ...base, subtotalCents: value })).toThrow(
      "INVALID_AMOUNT",
    );
});
~~~

## 3. Expected behavior

- At or after the strict UTC expiry timestamp: EXPIRED_COUPON and unchanged subtotal.
- One millisecond before expiry: SAVE100 subtracts 100 integer cents, with minimum zero.
- Invalid/missing/ill-formed UTC timestamps reject with INVALID_TIME; negative, fractional, nonfinite or unsafe integer subtotals reject with INVALID_AMOUNT.
- No payment provider or real customer data is involved. Unknown coupon handling exists but is outside the five approved-criteria proposals.

## 4. Differences and explicit decisions

- Expiry boundary, before/at/after checks, strict cents, malformed inputs and actual Vitest align with protected architecture sections 8.5 and 55.2.
- SAVE100, fixed 100-cent discount and zero clamping fill UNSPECIFIED business details; they are implementation decisions awaiting review, not invented source requirements.
- Requiring millisecond-Z UTC strings is a deterministic parser decision. A broader ISO-8601 format was not silently assumed.
- Test AC-004 now also exercises undefined expiration and missing/invalid now. This strengthens the stated missing-time check; no assertion was weakened.
- Illustrative APPROVED fixture text has been replaced by PENDING, and production AcceptanceRelay requires a real matching criteria/test review record.

## 5. Actual execution results

~~~json
{
  "executedAt": "2026-11-06T08:14:39.726Z",
  "durationMs": 595,
  "command": [
    "node",
    "node_modules/vitest/vitest.mjs",
    "run",
    "--config",
    "vitest.candidate.ts",
    "--reporter=json",
    "--outputFile",
    "<PRIVATE_RECEIPT_LOCATION>"
  ],
  "exitStatus": 0,
  "criteriaSha256": "f69fc54fcc167163ba6a715c10fabd4e9a63d2aaef27b5dd31efb259266a1e7c",
  "testSha256": "e62a5a42d226dbb351c8e532a3834a577c0cbaffca195695988944b4a6e99c2f",
  "total": 6,
  "passed": 6,
  "failed": 0,
  "reportPath": "<PRIVATE_RECEIPT_LOCATION>"
}
~~~

- AC-001 at expiry rejects and preserves total: **passed**.
- AC-002 one millisecond before expiry applies discount: **passed**.
- AC-003 after expiry rejects and preserves total: **passed**.
- AC-004 malformed and missing times reject: **passed**.
- AC-004 missing expiration and malformed or missing now reject: **passed**.
- AC-005 invalid and unsafe integer cents reject: **passed**.

These are standalone corrected-fixture development tests, not an approved release. Earlier five-test engineering runs <DEMO_RECORD_ID> and <DEMO_RECORD_ID> observed four FAIL and four PASS respectively, but both assessments stayed BLOCKED. Those historical snapshots do not establish current verifier validity.

## 6. Unresolved risks and inconsistencies

- Criteria approval remains PENDING. No human attestation, patch approval or final release decision exists.
- Zero subtotal, zero-clamping and unknown coupon behavior have no dedicated assertion in this proposed acceptance test file. No broader coverage is claimed.
- The strict timestamp format and chosen discount require human agreement; they are not commercial checkout requirements.
- Level 1 same-account attestation cannot authenticate the reviewer cryptographically. Level 2 isolation is not implemented.
- Dedicated SwitchForge command execution, real human correction and final readiness decision remain unverified. The desktop helper returned Escape-stopped after the resume attempt.
- Positive readiness cannot be demonstrated as a real approved release until this review is genuinely resolved. Independent engineering unit tests may use explicitly labelled synthetic state fixtures; they never create human decisions.

The protected original architecture, rules PDF and PROJECT_ANALYSIS.md remain unchanged. No approval is inferred from this packet.
