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
