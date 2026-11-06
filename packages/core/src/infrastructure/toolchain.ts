import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { sha256 } from "../../../evidence/src/canonical-json.ts";
import { runProcess } from "./process-runner.ts";
import { invariant, SfError, type ToolchainEntry } from "../domain/models.ts";
import { oasdiffPath, validateEnvironment } from "./configuration.ts";
import { browserExecutable } from "./browser-executable.ts";
// Synchronous revalidation for the short SQLite decision transaction. Browser/version
// launch was verified immediately before it; the executable hashes bind those versions.
export function toolchainStillMatches(
  root: string,
  expected: ToolchainEntry[],
): boolean {
  try {
    validateEnvironment(root);
    for (const row of expected) {
      if (row.name === "node") {
        if (
          row.version !== process.version ||
          row.sha256 !== sha256(fs.readFileSync(process.execPath))
        )
          return false;
        continue;
      }
      if (row.name === "chromium" || row.name === "oasdiff") {
        if (
          !row.sha256 ||
          row.sha256 !==
            sha256(
              fs.readFileSync(
                row.name === "chromium"
                  ? browserExecutable()
                  : oasdiffPath(root),
              ),
            )
        )
          return false;
        continue;
      }
      const name = row.name === "sqlite-driver" ? "better-sqlite3" : row.name;
      let file = path.join(
        root,
        "node_modules",
        ...name.split("/"),
        "package.json",
      );
      if (name === "npm" && !fs.existsSync(file)) {
        const options = [
          process.env.npm_execpath
            ? path.resolve(
                path.dirname(process.env.npm_execpath),
                "../package.json",
              )
            : "",
          process.env.APPDATA
            ? path.join(
                process.env.APPDATA,
                "npm/node_modules/npm/package.json",
              )
            : "",
          path.join(
            path.dirname(process.execPath),
            "node_modules/npm/package.json",
          ),
        ];
        file = options.find((p) => p && fs.existsSync(p)) || file;
      }
      if (JSON.parse(fs.readFileSync(file, "utf8")).version !== row.version)
        return false;
    }
    const names = [
      "node",
      "vitest",
      "playwright",
      "@axe-core/playwright",
      "axe-core",
      "sqlite-driver",
      "canonicalize",
      "csv-parse",
      "yaml",
      "zod",
      "tsx",
      "typescript",
      "npm",
      "oasdiff",
      "chromium",
    ];
    return (
      expected.length === names.length &&
      names.every((n) => expected.filter((t) => t.name === n).length === 1)
    );
  } catch {
    return false;
  }
}
async function inspectToolchain(root: string): Promise<ToolchainEntry[]> {
  validateEnvironment(root);
  const rows: ToolchainEntry[] = [
    {
      name: "node",
      version: process.version,
      sha256: sha256(fs.readFileSync(process.execPath)),
    },
  ];
  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  const frozen = JSON.parse(
    fs.readFileSync(path.join(root, "config/toolchain-expected.json"), "utf8"),
  );
  invariant(
    process.version === frozen.node,
    "DEPENDENCY_UNAVAILABLE",
    "Node patch differs from tested version",
    3,
  );
  for (const name of [
    "vitest",
    "playwright",
    "@axe-core/playwright",
    "axe-core",
    "better-sqlite3",
    "canonicalize",
    "csv-parse",
    "yaml",
    "zod",
    "tsx",
    "typescript",
    "npm",
  ]) {
    let file = path.join(
      root,
      "node_modules",
      ...name.split("/"),
      "package.json",
    );
    if (name === "npm" && !fs.existsSync(file)) {
      const options = [
        process.env.npm_execpath
          ? path.resolve(
              path.dirname(process.env.npm_execpath),
              "../package.json",
            )
          : "",
        process.env.APPDATA
          ? path.join(process.env.APPDATA, "npm/node_modules/npm/package.json")
          : "",
        path.join(
          path.dirname(process.execPath),
          "node_modules/npm/package.json",
        ),
      ];
      file = options.find((p) => p && fs.existsSync(p)) || file;
    }
    const p = JSON.parse(fs.readFileSync(file, "utf8"));
    const expected =
      name === "npm"
        ? frozen.npm
        : pkg.dependencies?.[name] || pkg.devDependencies?.[name];
    if (expected)
      invariant(
        p.version === expected,
        "DEPENDENCY_UNAVAILABLE",
        "Installed dependency version mismatch: " + name,
        3,
      );
    rows.push({
      name: name === "better-sqlite3" ? "sqlite-driver" : name,
      version: p.version,
    });
  }
  const binary = oasdiffPath(root);
  invariant(
    fs.existsSync(binary),
    "DEPENDENCY_UNAVAILABLE",
    "Install pinned oasdiff via scripts/install-oasdiff.ps1",
    3,
  );
  const raw = await runProcess(binary, ["--version"], root, [binary], 10000);
  invariant(
    raw.exitCode === 0 && !raw.timedOut,
    "DEPENDENCY_UNAVAILABLE",
    "oasdiff unavailable",
    3,
  );
  const version = raw.stdout.trim().replace("oasdiff version ", "");
  invariant(
    version === frozen.oasdiff.version &&
      sha256(fs.readFileSync(binary)) === frozen.oasdiff.binarySha256,
    "DEPENDENCY_UNAVAILABLE",
    "Unexpected oasdiff version or checksum",
    3,
  );
  rows.push({
    name: "oasdiff",
    version,
    sha256: sha256(fs.readFileSync(binary)),
  });
  const browser = await chromium.launch({
    headless: true,
    executablePath: browserExecutable(),
  });
  try {
    rows.push({
      name: "chromium",
      version: browser.version(),
      sha256: sha256(fs.readFileSync(browserExecutable())),
    });
  } finally {
    await browser.close();
  }
  return rows.sort((a, b) =>
    Buffer.compare(Buffer.from(a.name), Buffer.from(b.name)),
  );
}
export async function inventory(root: string): Promise<ToolchainEntry[]> {
  try {
    return await inspectToolchain(root);
  } catch (error) {
    if (error instanceof SfError) throw error;
    throw new SfError(
      "DEPENDENCY_UNAVAILABLE",
      error instanceof Error ? error.message : "Toolchain unavailable",
      3,
    );
  }
}
