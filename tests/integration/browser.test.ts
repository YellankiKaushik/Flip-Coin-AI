import { test, expect } from "vitest";
import http from "node:http";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startCheckout } from "../../apps/checkout-demo/src/server.ts";
import { localBrowserContext } from "../../packages/checks/src/browser-guard.ts";
test("real browser label bad/good", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const scenario of ["defective", "corrected"]) {
      // A controlled loopback page isolates the actual axe rule without asserting release identity.
      const server = http.createServer((_req, res) => {
        res.setHeader("Content-Type", "text/html");
        res.end(
          '<form id="checkout-form">' +
            (scenario === "corrected"
              ? '<label for="email">Email</label>'
              : "") +
            '<input id="email" type="email"></form>',
        );
      });
      await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
      const address = server.address() as { port: number };
      const url = "http://127.0.0.1:" + address.port;
      const { context } = await localBrowserContext(browser, url);
      try {
        const page = await context.newPage();
        await page.goto(url);
        const raw = await new AxeBuilder({ page })
          .include("#checkout-form")
          .withRules(["label"])
          .analyze();
        expect(raw.incomplete).toEqual([]);
        expect(raw.violations.length > 0).toBe(scenario === "defective");
      } finally {
        await context.close();
        await new Promise<void>((r) => server.close(() => r()));
      }
    }
  } finally {
    await browser.close();
  }
});
test("browser denies requests to every other origin before transmission", async () => {
  let remoteHits = 0;
  const remote = http.createServer((_q, r) => {
    remoteHits++;
    r.end("owned test target");
  });
  await new Promise<void>((r) => remote.listen(0, "127.0.0.1", r));
  const address = remote.address() as { port: number };
  const browser = await chromium.launch({ headless: true });
  try {
    const guarded = await localBrowserContext(browser, "http://127.0.0.1:4173");
    const page = await guarded.context.newPage();
    await expect(
      page.goto("http://127.0.0.1:" + address.port),
    ).rejects.toThrow();
    expect(guarded.blockedCount()).toBe(1);
    expect(remoteHits).toBe(0);
    await expect(
      localBrowserContext(browser, "https://example.invalid"),
    ).rejects.toThrow();
    await guarded.context.close();
  } finally {
    await browser.close();
    await new Promise<void>((r) => remote.close(() => r()));
  }
});
test("sample server source endpoint and readiness markup are real local responses", async () => {
  const target = await startCheckout(
    process.cwd(),
    "unit-test-source-identity",
  );
  try {
    expect(await (await fetch(target.url + "/__source")).json()).toEqual({
      candidateDigest: "unit-test-source-identity",
    });
    expect(await (await fetch(target.url + "/checkout")).text()).toContain(
      'data-testid="checkout-ready"',
    );
    expect((await fetch(target.url + "/not-found")).status).toBe(404);
  } finally {
    await target.close();
  }
});
