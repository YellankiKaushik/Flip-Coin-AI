import { test, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  resolveChecks,
  validateEnvironment,
  databasePath,
  artifactRoot,
} from "../../packages/core/src/infrastructure/configuration.ts";
const saved = { ...process.env };
afterEach(() => {
  for (const key of Object.keys(process.env).filter((k) => k.startsWith("SF_")))
    delete process.env[key];
  for (const [key, value] of Object.entries(saved))
    if (key.startsWith("SF_")) process.env[key] = value;
});
function base() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sf-config-"));
  fs.mkdirSync(path.join(root, "config"));
  fs.mkdirSync(path.join(root, ".local"));
  fs.copyFileSync(
    path.join(process.cwd(), "config/checks.json"),
    path.join(root, "config/checks.json"),
  );
  return root;
}
test("committed config then local then environment then explicit override precedence", () => {
  const root = base();
  expect(resolveChecks(root).timeoutMs).toBe(60000);
  fs.writeFileSync(
    path.join(root, ".local/config.json"),
    '{"timeoutMs":20000}',
  );
  expect(resolveChecks(root).timeoutMs).toBe(20000);
  process.env.SF_CHECK_TIMEOUT_MS = "10000";
  expect(resolveChecks(root).timeoutMs).toBe(10000);
  expect(resolveChecks(root, { timeoutMs: 5000 }).timeoutMs).toBe(5000);
});
test("unknown critical variables, malformed config and external URLs rejected", () => {
  const root = base();
  process.env.SF_UNKNOWN = "yes";
  expect(() => validateEnvironment(root)).toThrow();
  delete process.env.SF_UNKNOWN;
  process.env.SF_SAMPLE_URL = "https://example.invalid";
  expect(() => resolveChecks(root)).toThrow();
  delete process.env.SF_SAMPLE_URL;
  fs.writeFileSync(path.join(root, ".local/config.json"), '{"unknown":true}');
  expect(() => resolveChecks(root)).toThrow();
});
test("storage overrides stay in owned roots", () => {
  const root = base();
  process.env.SF_DB_PATH = ".local/test/ledger.sqlite";
  expect(databasePath(root)).toBe(path.join(root, ".local/test/ledger.sqlite"));
  process.env.SF_DB_PATH = "../outside";
  expect(() => databasePath(root)).toThrow();
  process.env.SF_ARTIFACT_ROOT = "../outside";
  expect(() => artifactRoot(root)).toThrow();
});
