import { test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { validateLocalSpec } from "../../packages/checks/src/openapi.ts";
import { runProcess } from "../../packages/core/src/infrastructure/process-runner.ts";
const root = process.cwd(),
  binary = path.join(root, ".local/tools/oasdiff.exe");
test("real oasdiff detects verified break and compatible candidate", async () => {
  for (const [scenario, expected] of [
    ["defective", 1],
    ["corrected", 0],
  ] as const) {
    const r = await runProcess(
      binary,
      [
        "breaking",
        "--format",
        "json",
        "--fail-on",
        "ERR",
        "--allow-external-refs=false",
        `fixtures/scenarios/${scenario}/api/base.yaml`,
        `fixtures/scenarios/${scenario}/api/candidate.yaml`,
      ],
      root,
      [binary],
    );
    expect(r.exitCode).toBe(expected);
    expect(Array.isArray(JSON.parse(r.stdout))).toBe(true);
    expect(JSON.parse(r.stdout).length > 0).toBe(expected === 1);
  }
});
test("oasdiff validates real inputs", async () => {
  const r = await runProcess(
    binary,
    [
      "validate",
      "--format",
      "json",
      "--allow-external-refs=false",
      "fixtures/scenarios/corrected/api/base.yaml",
    ],
    root,
    [binary],
  );
  expect(r.exitCode).toBe(0);
  expect(JSON.parse(r.stdout)).toEqual([]);
});
test("YAML external references, duplicate keys and invalid versions denied before diff", () => {
  expect(() =>
    validateLocalSpec(
      Buffer.from(
        'openapi: 3.0.3\ninfo: {title: test, version: "1"}\npaths: {}',
      ),
    ),
  ).not.toThrow();
  for (const text of [
    "openapi: 3.0.3\n$ref: https://example.invalid/a",
    "openapi: 3.0.3\n$ref: local-other.yaml",
    "openapi: 3.0.3\nopenapi: 3.1.0",
    "openapi: 2.0",
    "bad: [unclosed",
  ])
    expect(() => validateLocalSpec(Buffer.from(text))).toThrow();
});
test("missing binary produces spawn failure receipt, not PASS", async () => {
  const absent = path.join(root, ".local/tools/never-installed.exe");
  const r = await runProcess(absent, [], root, [absent]);
  expect(r.spawnErrorCode).toBeTruthy();
  expect(r.exitCode).toBeNull();
});
