import { test, expect } from "vitest";
import { applyCoupon } from "../../fixtures/scenarios/corrected/app/coupon.ts";
const base = {
  subtotalCents: 1500,
  couponCode: "SAVE100",
  couponExpiresAt: "2026-11-01T00:00:00.001Z",
  now: "2026-11-01T00:00:00.000Z",
};
test("engineering decision: zero and sub-discount totals clamp to zero without negative cents", () => {
  for (const subtotalCents of [0, 1, 99, 100])
    expect(applyCoupon({ ...base, subtotalCents })).toEqual({
      code: "APPLIED",
      totalCents: 0,
    });
});
test("engineering decision: unknown coupon preserves subtotal before expiry", () => {
  expect(applyCoupon({ ...base, couponCode: "UNRECOGNIZED" })).toEqual({
    code: "INVALID_COUPON",
    totalCents: 1500,
  });
});
