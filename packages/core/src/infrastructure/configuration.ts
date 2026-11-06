import fs from "node:fs";
import path from "node:path";
import { checksSchema, invariant } from "../domain/models.ts";
import { confined, readJson } from "./filesystem-guard.ts";
const allowed = new Set([
  "SF_WORKSPACE_ROOT",
  "SF_ARTIFACT_ROOT",
  "SF_DB_PATH",
  "SF_SAMPLE_URL",
  "SF_OASDIFF_BIN",
  "SF_CHECK_TIMEOUT_MS",
  "SF_BROWSER_TIMEOUT_MS",
  "SF_MAX_OUTPUT_BYTES",
  "SF_POLICY_VERSION",
  "SF_REA_ENABLED",
]);
export function validateEnvironment(root: string) {
  for (const key of Object.keys(process.env).filter((k) => k.startsWith("SF_")))
    invariant(
      allowed.has(key),
      "INVALID_INPUT",
      "Unknown security-critical configuration key: " + key,
    );
  if (process.env.SF_WORKSPACE_ROOT)
    invariant(
      path.resolve(root, process.env.SF_WORKSPACE_ROOT) ===
        path.join(root, "apps/checkout-demo"),
      "INVALID_INPUT",
      "MVP workspace must be the owned checkout demo",
    );
  if (process.env.SF_POLICY_VERSION) {
    const policy = readJson(confined(root, "config/release-policy.json")) as {
      version: string;
    };
    invariant(
      policy.version === process.env.SF_POLICY_VERSION,
      "INVALID_INPUT",
      "Policy override must match the actual immutable policy file",
    );
  }
  if (process.env.SF_REA_ENABLED)
    invariant(
      ["true", "false"].includes(process.env.SF_REA_ENABLED),
      "INVALID_INPUT",
      "Invalid research-only REA flag",
    );
}
function boundedRelative(root: string, value: string, family: string) {
  const relative = path
    .relative(root, path.resolve(root, value))
    .split(path.sep)
    .join("/");
  invariant(
    relative.startsWith(family + "/") && !relative.includes(".."),
    "INVALID_INPUT",
    "Configured path must remain inside " + family,
  );
  return confined(root, relative, false);
}
export function databasePath(root: string) {
  return boundedRelative(
    root,
    process.env.SF_DB_PATH || ".local/switchforge.sqlite",
    ".local",
  );
}
export function artifactRoot(root: string) {
  return boundedRelative(
    root,
    process.env.SF_ARTIFACT_ROOT || "artifacts/runs",
    "artifacts",
  );
}
export function oasdiffPath(root: string) {
  return boundedRelative(
    root,
    process.env.SF_OASDIFF_BIN || ".local/tools/oasdiff.exe",
    ".local",
  );
}
export function resolveChecks(
  root: string,
  overrides: Record<string, unknown> = {},
) {
  validateEnvironment(root);
  const base = checksSchema.parse(
    readJson(confined(root, "config/checks.json")),
  );
  const local = path.join(root, ".local/config.json");
  let values: Record<string, unknown> = { ...base };
  if (fs.existsSync(local)) {
    confined(root, ".local/config.json");
    values = { ...values, ...checksSchema.partial().parse(readJson(local)) };
  }
  const env: Record<string, unknown> = {};
  for (const [key, field] of [
    ["SF_CHECK_TIMEOUT_MS", "timeoutMs"],
    ["SF_BROWSER_TIMEOUT_MS", "browserTimeoutMs"],
    ["SF_MAX_OUTPUT_BYTES", "maxOutputBytes"],
  ] as const)
    if (process.env[key] !== undefined) {
      invariant(
        /^\d+$/.test(process.env[key]!),
        "INVALID_INPUT",
        "Configuration must be an integer: " + key,
      );
      env[field] = Number(process.env[key]);
    }
  if (process.env.SF_SAMPLE_URL) env.sampleUrl = process.env.SF_SAMPLE_URL;
  return checksSchema.parse({ ...values, ...env, ...overrides });
}
