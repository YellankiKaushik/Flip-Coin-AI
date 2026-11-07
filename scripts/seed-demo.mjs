import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const write = (p, s) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  if (!fs.existsSync(p)) fs.writeFileSync(p, s);
};
for (const name of ["core", "checks", "evidence", "release"])
  write(
    path.join(root, "packages", name, "package.json"),
    JSON.stringify(
      {
        name: "@switchforge/" + name,
        version: "0.1.0",
        private: true,
        type: "module",
      },
      null,
      2,
    ),
  );
for (const name of ["cli", "checkout-demo"])
  write(
    path.join(root, "apps", name, "package.json"),
    JSON.stringify(
      {
        name: "@switchforge/" + name,
        version: "0.1.0",
        private: true,
        type: "module",
      },
      null,
      2,
    ),
  );
const coupon = `export function applyCoupon({subtotalCents,couponCode,couponExpiresAt,now}:{subtotalCents:number;couponCode:string;couponExpiresAt:string;now:string}) {
 if(!Number.isSafeInteger(subtotalCents)||subtotalCents<0)throw new Error('INVALID_AMOUNT');
 const utc=/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$/;
 if(!utc.test(couponExpiresAt)||!utc.test(now)||!Number.isFinite(Date.parse(couponExpiresAt))||!Number.isFinite(Date.parse(now))||new Date(couponExpiresAt).toISOString()!==couponExpiresAt||new Date(now).toISOString()!==now)throw new Error('INVALID_TIME');
 if(Date.parse(now) OP Date.parse(couponExpiresAt))return {code:'EXPIRED_COUPON',totalCents:subtotalCents};
 if(couponCode!=='SAVE100')return {code:'INVALID_COUPON',totalCents:subtotalCents};
 return {code:'APPLIED',totalCents:Math.max(0,subtotalCents-100)};
}
`;
const base = {
  openapi: "3.0.3",
  info: { title: "Synthetic checkout", version: "1.0.0" },
  paths: {},
};
base.paths["/orders/{id}"] = {
  get: {
    operationId: "getOrder",
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" } },
    ],
    responses: {
      200: {
        description: "Order",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["totalAmount"],
              properties: { totalAmount: { type: "integer", minimum: 0 } },
            },
          },
        },
      },
    },
  },
};
for (const scenario of ["defective", "corrected"]) {
  const dir = path.join(root, "fixtures", "scenarios", scenario);
  write(
    path.join(dir, "app", "coupon.ts"),
    coupon.replace(" OP ", scenario === "defective" ? " > " : " >= "),
  );
  write(
    path.join(dir, "app", "index.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>SwitchForge synthetic checkout</title></head><body><main><h1>Checkout verification fixture</h1><form id="checkout-form" data-testid="checkout-ready">${scenario === "corrected" ? '<label for="email">Email</label>' : ""}<input id="email" type="email" autocomplete="email"><button type="button">Review synthetic order</button></form></main></body></html>`,
  );
  write(path.join(dir, "api", "base.yaml"), JSON.stringify(base, null, 2));
  const candidate = structuredClone(base);
  if (scenario === "defective") {
    candidate.paths["/orders/{id}"].get.responses["200"].content = {
      "text/plain": { schema: { type: "string" } },
    };
  }
  write(
    path.join(dir, "api", "candidate.yaml"),
    JSON.stringify(candidate, null, 2),
  );
  write(
    path.join(dir, "data", "orders.csv"),
    "order_id,total_cents,status\r\nO-1001,1000,PAID\r\nO-1002,1500,PAID\r\n",
  );
  write(
    path.join(dir, "data", "ledger.csv"),
    `order_id,charged_cents,settled\r\nO-1001,1000,true\r\nO-1002,${scenario === "defective" ? "1000" : "1500"},true\r\n`,
  );
  write(
    path.join(dir, "criteria", "approved.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        criteriaId: "checkout-coupon-v1",
        revision: 1,
        status: "PENDING",
        cases: [
          { id: "AC-001", description: "At expiry reject and preserve total" },
          {
            id: "AC-002",
            description:
              "One millisecond before expiry apply SAVE100 discount of 100 cents",
          },
          {
            id: "AC-003",
            description: "After expiry reject and preserve total",
          },
          {
            id: "AC-004",
            description: "Invalid or missing UTC timestamps are rejected",
          },
          {
            id: "AC-005",
            description:
              "Negative, fractional and unsafe integer cents are rejected",
          },
        ],
      },
      null,
      2,
    ),
  );
}
console.log(
  "Seeded versioned inputs only. Criteria status is PENDING; no human review or tool output was generated.",
);
fs.cpSync(
  path.join(root, "fixtures/scenarios/corrected"),
  path.join(root, "fixtures/current"),
  { recursive: true, force: false, errorOnExist: false },
);
