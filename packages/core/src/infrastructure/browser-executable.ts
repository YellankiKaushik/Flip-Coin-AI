import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { invariant } from "../domain/models.ts";
// Resolve the matching installed Windows headless-shell from pinned Playwright metadata.
// This is the actual executable used, not the full-browser launcher returned by executablePath().
export function browserExecutable() {
  invariant(
    process.platform === "win32",
    "DEPENDENCY_UNAVAILABLE",
    "Only Windows x64 browser distribution has been verified",
    3,
  );
  const require = createRequire(import.meta.url);
  const metadata = JSON.parse(
    fs.readFileSync(
      path.join(
        path.dirname(require.resolve("playwright-core/package.json")),
        "browsers.json",
      ),
      "utf8",
    ),
  );
  const entry = metadata.browsers.find(
    (b: { name: string }) => b.name === "chromium-headless-shell",
  );
  invariant(
    entry && /^\d+$/.test(entry.revision),
    "DEPENDENCY_UNAVAILABLE",
    "Unknown browser revision",
    3,
  );
  const cache = path.dirname(
    path.dirname(path.dirname(chromium.executablePath())),
  );
  const file = path.join(
    cache,
    "chromium_headless_shell-" + entry.revision,
    "chrome-headless-shell-win64/chrome-headless-shell.exe",
  );
  invariant(
    fs.existsSync(file),
    "DEPENDENCY_UNAVAILABLE",
    "Pinned Chromium headless shell missing; run playwright install chromium",
    3,
  );
  return file;
}
