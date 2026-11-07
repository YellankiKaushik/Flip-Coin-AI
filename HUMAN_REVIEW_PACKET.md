# HUMAN REVIEW PACKET — CRITERIA REVIEW VERIFIED

> Historical checkpoint. For current results, see the [documentation index](docs/README.md).

The synthetic demonstration completed through a real human, Switch, Mattermost and Codex. The reviewed defective run produced four FAIL results with valid evidence and a BLOCKED assessment. After a separate human patch review, the corrected run produced four PASS results with valid evidence, READY_FOR_HUMAN_APPROVAL and zero blockers. A third human review then recorded a Level 1 HUMAN_ATTESTED_FOR_DEMO decision. The decision was effective at completion. A later read reported EXPIRED while retaining the recorded decision. Level 1 records manual demo attestation and provides no production deployment authority. The criteria and test content below remains the reviewed material.

Updated November 7, 2026 IST. Human criteria/test proposal `<DEMO_RECORD_ID>` was consumed at `2026-11-06T19:28:04.476Z` with HUMAN_ATTESTED_FOR_DEMO, Level 1. Independent canonical inspection in ordinary PowerShell and the existing Codex workspace sandbox returned exit 0, `data.valid:true`, and all twelve checks true. Current criteria digest `51c39baba13fee5d5cd52078f3adab301566588b29dc1b405b5eff7706818eb7` and test SHA256 `e62a5a42d226dbb351c8e532a3834a577c0cbaffca195695988944b4a6e99c2f` match. No assistant attestation was performed. Raw file metadata stays PENDING by design; eligibility is the independent ledger record. Patch and final release approvals remain PENDING. Exact criteria/tests below are unchanged. Full main suite now 137/137, including 20 new inspection safety cases; no fresh reviewed Switch run has occurred in this repair.

# Historical review procedure — already completed for these digests

Do not repeat attestation solely because the proposal's decision-entry TTL has elapsed: recorded consumption was timely and remains valid for identical criteria/tests. The next human action is the fresh Switch room request in the current repair report. The original procedure remains below for future content changes.

1. Review the exact five criteria and six tests in this packet, including the disclosed SAVE100/100-cent, millisecond-Z UTC and zero-clamping choices.
2. V2 §55.2 requires real criteria/test review before AcceptanceRelay may execute those tests as approved evidence; chat or doctor success grants no approval.
3. Follow the tracked CLI steps in the [human review procedure](docs/human-review/PROCEDURE.md). Personally enter your reviewer reference and confirmation in an interactive terminal.
4. Success is CLI exit0/ok:true with a genuine matching Level1 HUMAN_ATTESTED_FOR_DEMO ledger record. Identity is not cryptographically verified; patch and release decisions remain separate and PENDING.

## Exact proposed criteria

Source: fixtures/scenarios/corrected/criteria/approved.json. Filename approved.json is not approval; actual status remains PENDING. Raw SHA256 `f69fc54fcc167163ba6a715c10fabd4e9a63d2aaef27b5dd31efb259266a1e7c`.

```json
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
```

## Exact six acceptance tests — unchanged

Source: apps/checkout-demo/tests/checkout.spec.ts. Raw SHA256 `e62a5a42d226dbb351c8e532a3834a577c0cbaffca195695988944b4a6e99c2f`.

```typescript
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
```

## Behavior and explicit choices to understand

| Behavior                                                        | Requirement / choice / coverage                                                                                                                                      |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| At or after expiry reject and preserve subtotal                 | Required by V2 §55.2; AC-001 and AC-003                                                                                                                              |
| Before expiry, eligible coupon applies a deterministic discount | Required by V2 §55.2; AC-002                                                                                                                                         |
| SAVE100 and100 integer cents                                    | Existing implementation choice where the original architecture leaves coupon identity/discount amount UNSPECIFIED; AC-002 binds the displayed example                |
| Minimum total zero                                              | Existing implementation choice, not a newly invented criterion; six displayed cases do not directly exercise the clamp, although separate engineering tests cover it |
| Exact yyyy-MM-ddTHH:mm:ss.fffZ input                            | Existing parser choice; V2 requires UTC/unparsable-time rejection, but this exact accepted format is UNSPECIFIED there                                               |
| Invalid or missing time values reject                           | Required behavior; the two AC-004 tests cover malformed/missing now and missing expiration                                                                           |
| Negative/fractional/nonfinite/unsafe integer cents reject       | Required strict cents behavior; AC-005 includes -1,0.1,NaN,Infinity,MAX_SAFE_INTEGER+1                                                                               |

The applyCoupon input object has four fields; its strict equality expiry behavior aligns with V2 §§55.2/56.1. Unknown-coupon behavior exists but is outside the five proposed criteria. No new acceptance criterion or assertion was added to make this packet. Review binds the exact displayed criteria and test hashes; prose does not silently add tests or authorize future revisions. No payment provider or real customer data is involved.

## Actual test execution evidence

The unchanged six cases previously ran against frozen candidate source in the isolated checkout: defective5 PASS/1 FAIL (AC-001), exit1; corrected6 PASS/0 FAIL, exit0. Evidence: `<PRIVATE_RECEIPT_LOCATION>`. These are engineering executions, not human-reviewed release runs. The actual full evaluator suite previously reported117/117 in both main and isolated checkout, with zero failures/skips; it was not rerun merely to relabel this review.

Historical production diagnostics remain BLOCKED as originally recorded: acceptance ERROR/zero coverage because review was absent at execution; the other three engines demonstrate FAIL→PASS. The earlier checkpoint found decisions0/criteria attestations0. The current independent canonical inspection now verifies the human's consumed criteria/test decision. These historical runs are not upgraded retrospectively. A fresh reviewed Switch run is still required; live doctor exit0 alone does not prove positive AcceptanceRelay execution. Current main suite is 137/137 across 19 files, including 20 new read-only inspection/safety cases; the isolated 117/117 baseline remains historical.

## Review procedure and unresolved limits

The local human helper displays the exact source files, checks their hashes, and waits before creating a fresh15-minute criteria proposal. It then invokes the existing supported CLI without piping or redirecting attestation. The CLI itself asks the human for their reference and exact `HUMAN REVIEWED <actual proposalId>`; the helper does not supply either answer. Its noninteractive guard was tested and denied before creating any proposal or approval. It is a private convenience wrapper, not an agent-authorized command, new approval mechanism or cryptographic identity boundary. Manual equivalent and rejection procedure remain in ACTION_REQUIRED_FROM_HUMAN.md.

Old <DEMO_RECORD_ID> expired at2026-11-06T14:55:04.275Z. Do not reuse it or any old confirmation. If the newly created request expires or content changes, regenerate and review again. This packet does not grant patch approval, final release approval or deployment authority. Level1 is HUMAN_ATTESTED_FOR_DEMO; a hostile same-account actor is not cryptographically excluded. All protected original documents remain unchanged.
