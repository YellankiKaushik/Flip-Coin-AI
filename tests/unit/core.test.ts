import { test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import {
  canonical,
  hashObject,
  sha256,
} from "../../packages/evidence/src/canonical-json.ts";
import {
  safeId,
  confined,
} from "../../packages/core/src/infrastructure/filesystem-guard.ts";
import {
  fileInventory,
  validateManifest,
} from "../../packages/core/src/infrastructure/hash-manifest.ts";
import {
  resultSchema,
  type CandidateManifest,
} from "../../packages/core/src/domain/models.ts";
test("UT-CORE-001 rejects malformed or fabricated results", () => {
  expect(resultSchema.safeParse({ status: "PASS" }).success).toBe(false);
});
test("canonical JSON stable key order and golden SHA-256 vector", () => {
  expect(canonical({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
  expect(sha256("abc")).toBe(
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  expect(hashObject({ a: 1, b: 2 })).toBe(hashObject({ b: 2, a: 1 }));
});
test.each([
  "../escape",
  "/absolute",
  "a\\b",
  "a;echo",
  "$(echo bad)",
  "a..b",
  "",
])("reject untrusted identifier %s", (id) =>
  expect(() => safeId(id)).toThrow(),
);
test("confines paths and rejects junction escape", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sf-path-"));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "sf-owned-outside-"));
  fs.writeFileSync(path.join(outside, "owned.txt"), "owned");
  fs.symlinkSync(
    outside,
    path.join(dir, "escape"),
    process.platform === "win32" ? "junction" : "dir",
  );
  expect(() => confined(dir, "../escape")).toThrow();
  expect(() => confined(dir, "escape/owned.txt")).toThrow();
  expect(() => confined(dir, "C:/x")).toThrow();
});
test("snapshot byte inventory changes with content, not mtime", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sf-hash-"));
  const file = path.join(dir, "input.txt");
  fs.writeFileSync(file, "same\r\n");
  const files = fileInventory(dir, ["*.txt"]);
  fs.utimesSync(file, new Date(), new Date(Date.now() + 60000));
  expect(fileInventory(dir, ["*.txt"])).toEqual(files);
  const m: CandidateManifest = {
    schemaVersion: 1,
    projectId: "checkout-demo",
    candidateId: "c",
    files,
    criteriaRevision: "1",
    criteriaDigest: sha256("criteria"),
    testDigest: sha256("tests"),
    policyDigest: sha256("policy"),
    checksConfigDigest: sha256("config"),
    toolchain: [{ name: "node", version: "test" }],
  };
  const digest = hashObject(m);
  expect(validateManifest(m, digest, dir)).toBe(true);
  expect(
    hashObject({ ...m, toolchain: [{ name: "node", version: "changed" }] }),
  ).not.toBe(digest);
  fs.writeFileSync(file, "changed");
  expect(validateManifest(m, digest, dir)).toBe(false);
  expect(() => fileInventory(dir, ["missing.*"])).toThrow();
});
test("manifest rejects unsorted and duplicate entries", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sf-sort-"));
  fs.writeFileSync(path.join(dir, "a"), "a");
  fs.writeFileSync(path.join(dir, "b"), "b");
  const files = fileInventory(dir, ["*"]);
  const m = {
    schemaVersion: 1,
    files: [...files].reverse(),
  } as CandidateManifest;
  expect(validateManifest(m, hashObject(m), dir)).toBe(false);
  const duplicate = { ...m, files: [files[0], files[0]] };
  expect(validateManifest(duplicate, hashObject(duplicate), dir)).toBe(false);
});
