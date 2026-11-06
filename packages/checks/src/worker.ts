import fs from "node:fs";
import path from "node:path";
import { chromium, type Browser } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startCheckout } from "../../../apps/checkout-demo/src/index.ts";
import { reconcile } from "./data.ts";
import { confined } from "../../core/src/public/infrastructure.ts";
import { localBrowserContext } from "./browser-guard.ts";
import { browserExecutable } from "../../core/src/public/infrastructure.ts";
const [engine, root, digest, rawConfig] = process.argv.slice(2);
const config = JSON.parse(rawConfig);
let response: unknown;
try {
  if (engine === "data") {
    for (const name of ["orders", "ledger"])
      if (
        fs.statSync(confined(root, "fixtures/current/data/" + name + ".csv"))
          .size > config.maxCsvBytes
      )
        throw new Error("CSV_TOO_LARGE");
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
    let browser: Browser | undefined;
    try {
      browser = await chromium.launch({
        headless: true,
        executablePath: browserExecutable(),
      });
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
      try {
        await browser?.close();
      } finally {
        await target.close();
      }
    }
  } else throw new Error("Unknown worker");
  process.stdout.write(JSON.stringify(response));
} catch (e) {
  process.stderr.write(e instanceof Error ? e.message : "Worker error");
  process.exitCode = 2;
}
