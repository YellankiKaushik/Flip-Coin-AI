import { test, expect } from "vitest";
import { reconcile } from "../../packages/checks/src/data.ts";
const orders =
  "order_id,total_cents,status\nO-1001,1000,PAID\nO-1002,1500,PAID\n";
const ledger =
  "order_id,charged_cents,settled\nO-1001,1000,true\nO-1002,1500,true\n";
const b = (v: string) => Buffer.from(v);
test("IT-DR-001/002 mismatch is FAIL, clean is PASS", () => {
  expect(reconcile(b(orders), b(ledger)).status).toBe("PASS");
  const bad = reconcile(b(orders), b(ledger.replace("1500", "1000")));
  expect(bad.status).toBe("FAIL");
  expect(bad.findings[0].message).toContain("difference 500");
});
test("UT-DR-001 stable issue ordering and identifiers", () => {
  const a = reconcile(b(orders), b(ledger.replace("1500", "1000")));
  const c = reconcile(b(orders), b(ledger.replace("1500", "1000")));
  expect(a).toEqual(c);
});
test("UT-DR-002 leading zero IDs remain distinct and case sensitive", () => {
  const r = reconcile(
    b("order_id,total_cents,status\n001,0,UNPAID\nA,1,PAID\na,2,PAID\n"),
    b("order_id,charged_cents,settled\n001,0,false\nA,1,true\na,2,true\n"),
  );
  expect(r.status).toBe("PASS");
  expect(r.counts.orders).toBe(3);
});
test("UT-DR-004 duplicate normalized key FAIL", () =>
  expect(
    reconcile(b(orders + " O-1001 ,1000,PAID\n"), b(ledger)).findings.some(
      (f) => f.code === "DUPLICATE_ID",
    ),
  ).toBe(true));
test("missing counterpart and inconsistent unpaid settlement FAIL", () => {
  expect(
    reconcile(b(orders), b(ledger.replace("O-1002", "OTHER"))).status,
  ).toBe("FAIL");
  expect(
    reconcile(b(orders.replaceAll("PAID", "UNPAID")), b(ledger)).status,
  ).toBe("FAIL");
});
test.each(["-1", "1.1", "1e3", "9007199254740992", "NaN", ""])(
  "invalid integer encoding %s rejected",
  (amount) =>
    expect(() =>
      reconcile(b(orders.replace("1500", amount)), b(ledger)),
    ).toThrow(),
);
test.each([
  "order_id,total_cents,status,extra\n1,1,PAID,x",
  "order_id,total_cents,total_cents\n1,1,PAID",
  'order_id,total_cents,status\n"bad,1,PAID',
  "order_id,total_cents,status\n",
  "order_id,total_cents,status\n1,1,paid",
])("malformed CSV input rejected", (text) =>
  expect(() => reconcile(b(text), b(ledger))).toThrow(),
);
test("BOM CRLF and quoted delimiters are accepted", () => {
  const r = reconcile(
    b('\ufefforder_id,total_cents,status\r\n"A,B",100,PAID\r\n'),
    b('order_id,charged_cents,settled\r\n"A,B",100,true\r\n'),
  );
  expect(r.status).toBe("PASS");
});
test("invalid UTF8, byte and record limits are errors", () => {
  expect(() => reconcile(new Uint8Array([255]), b(ledger))).toThrow();
  expect(() => reconcile(b(orders), b(ledger), 3)).toThrow();
  expect(() => reconcile(b(orders), b(ledger), 2097152, 1)).toThrow();
});
test("formula-like IDs are escaped in proposed spreadsheet output", () => {
  const r = reconcile(
    b("order_id,total_cents,status\n=HYPERLINK(),1,PAID\n"),
    b("order_id,charged_cents,settled\n=HYPERLINK(),1,true\n"),
  );
  expect(r.proposedCorrections).toContain("'=HYPERLINK()");
});
