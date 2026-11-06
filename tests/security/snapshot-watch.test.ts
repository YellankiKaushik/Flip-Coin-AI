import { test, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { watchSnapshot } from "../../packages/core/src/infrastructure/snapshot-watch.ts";
test("an included file changed then restored still invalidates an active snapshot", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sf-watch-test-"));
  fs.mkdirSync(path.join(root, "app"));
  const file = path.join(root, "app/code.ts");
  fs.writeFileSync(file, "original");
  const watch = watchSnapshot(root, ["app/**/*.ts"], []);
  try {
    fs.writeFileSync(file, "changed");
    await new Promise((r) => setTimeout(r, 40));
    fs.writeFileSync(file, "original");
    await new Promise((r) => setTimeout(r, 40));
    expect(fs.readFileSync(file, "utf8")).toBe("original");
    expect(watch.changed()).toBe(true);
  } finally {
    watch.close();
  }
});
test("excluded runtime output does not invalidate candidate source", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sf-watch-test-"));
  fs.mkdirSync(path.join(root, "runtime"));
  const watch = watchSnapshot(root, ["**/*.ts"], ["runtime/**"]);
  try {
    fs.writeFileSync(path.join(root, "runtime/cache.ts"), "generated");
    await new Promise((r) => setTimeout(r, 40));
    expect(watch.changed()).toBe(false);
  } finally {
    watch.close();
  }
});
