import canonicalize from "canonicalize";
import { createHash } from "node:crypto";
export function canonical(value: unknown): string {
  const s = canonicalize(value);
  if (s === undefined) throw new Error("Value is not canonical JSON");
  return s;
}
export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}
export function hashObject(value: unknown): string {
  return sha256(canonical(value));
}
