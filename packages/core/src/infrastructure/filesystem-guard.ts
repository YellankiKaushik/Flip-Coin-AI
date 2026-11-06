import fs from "node:fs";
import path from "node:path";
import { invariant } from "../domain/models.ts";
export function safeId(value: string): string {
  invariant(
    /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(value) && !value.includes(".."),
    "INVALID_INPUT",
    "Invalid identifier",
  );
  return value;
}
export function confined(
  root: string,
  relative: string,
  mustExist = true,
): string {
  invariant(
    relative.length > 0 &&
      !path.isAbsolute(relative) &&
      !relative.includes("\\") &&
      !relative.includes(":") &&
      !relative.split("/").some((p) => p === ".." || p === "." || p === ""),
    "INVALID_INPUT",
    "Path must be normalized and relative",
  );
  const base = fs.realpathSync(root);
  const resolved = path.resolve(base, relative);
  invariant(
    resolved.startsWith(base + path.sep),
    "INVALID_INPUT",
    "Path escape",
  );
  let cursor = base;
  for (const part of relative.split("/")) {
    cursor = path.join(cursor, part);
    let s: fs.Stats;
    try {
      s = fs.lstatSync(cursor);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw e;
    }
    invariant(!s.isSymbolicLink(), "INVALID_INPUT", "Symlinks are forbidden");
    invariant(
      s.isDirectory() || s.isFile(),
      "INVALID_INPUT",
      "Special file forbidden",
    );
  }
  if (mustExist)
    invariant(
      fs.existsSync(resolved),
      "INVALID_INPUT",
      "Required input is missing",
    );
  return resolved;
}
export function utf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
export function readJson(file: string): unknown {
  return JSON.parse(utf8(fs.readFileSync(file)));
}
export function atomicWrite(file: string, bytes: string | Uint8Array): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + "." + crypto.randomUUID() + ".tmp";
  const fd = fs.openSync(tmp, "wx", 0o600);
  try {
    fs.writeFileSync(fd, bytes);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, file);
}
