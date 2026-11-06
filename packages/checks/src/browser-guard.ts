import type { Browser } from "playwright";
import { invariant } from "../../core/src/domain/models.ts";
export async function localBrowserContext(
  browser: Browser,
  allowedOrigin: string,
) {
  const origin = new URL(allowedOrigin);
  invariant(
    origin.protocol === "http:" &&
      origin.hostname === "127.0.0.1" &&
      origin.port.length > 0 &&
      origin.origin === allowedOrigin,
    "INVALID_INPUT",
    "Only one exact assigned loopback origin is allowed",
  );
  const context = await browser.newContext({ serviceWorkers: "block" });
  let blockedRequests = 0;
  await context.route("**/*", async (route) => {
    if (new URL(route.request().url()).origin !== allowedOrigin) {
      blockedRequests++;
      await route.abort("blockedbyclient");
    } else await route.continue();
  });
  return { context, blockedCount: () => blockedRequests };
}
