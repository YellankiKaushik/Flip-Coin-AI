import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startCheckout } from "../../../apps/checkout-demo/src/server.ts";
import { reconcile } from "./data.ts";
import { confined } from "../../core/src/infrastructure/filesystem-guard.ts";
import { localBrowserContext } from "./browser-guard.ts";
import { browserExecutable } from "../../core/src/infrastructure/browser-executable.ts";
const [engine, root, digest, rawConfig] = process.argv.slice(2);
const config = JSON.parse(rawConfig);
let response: unknown;
try {
  if (engine === "data") {
    response = reconcile(
      fs.readFileSync(confined(root, "fixtures/current/data/orders.csv")),
      fs.readFileSync(confined(root, "fixtures/current/data/ledger.csv")),
      config.maxCsvBytes,
      config.maxCsvRows,
    );
  } else if (engine === "accessibility") {
    const target = await startCheckout(
      root,
      digest,
      Number(new URL(config.sampleUrl).port),
    );
    const browser = await chromium.launch({
      headless: true,
      executablePath: browserExecutable(),
    });
    try {
      const guarded = await localBrowserContext(browser, target.url);
      const context = guarded.context;
      const page = await context.newPage();
      page.setDefaultTimeout(Math.min(config.browserTimeoutMs, 30000));
      const source = await context.request.get(target.url + "/__source");
      if ((await source.json()).candidateDigest !== digest)
        throw new Error("SOURCE_IDENTITY_MISMATCH");
      const nav = await page.goto(target.url + "/checkout");
      if (!nav?.ok() || page.url() !== target.url + "/checkout")
        throw new Error("INVALID_PAGE");
      await page.locator('[data-testid="checkout-ready"]').waitFor();
      await page.locator("#checkout-form input").waitFor();
      const raw = await new AxeBuilder({ page })
        .include("#checkout-form")
        .withRules(config.axeRules)
        .analyze();
      if (
        raw.passes.length + raw.violations.length === 0 ||
        raw.incomplete.length
      )
        throw new Error("INCOMPLETE_SCAN");
      const screenshot = await page.screenshot();
      response = {
        schemaVersion: 1,
        status: raw.violations.length ? "FAIL" : "PASS",
        coverage: raw.passes.length + raw.violations.length,
        findings: raw.violations.map((v) => ({
          code: v.id,
          severity: "ERROR",
          location: v.nodes.map((n) => n.target.join(" ")).join(";"),
          message: v.description,
        })),
        raw,
        screenshot: Buffer.from(screenshot).toString("base64"),
        browserVersion: browser.version(),
        url: target.url + "/checkout",
        candidateDigest: digest,
        blockedExternalRequests: guarded.blockedCount(),
      };
    } finally {
      await browser.close();
      await target.close();
    }
  } else throw new Error("Unknown worker");
  process.stdout.write(JSON.stringify(response));
} catch (e) {
  process.stderr.write(e instanceof Error ? e.message : "Worker error");
  process.exitCode = 2;
}
