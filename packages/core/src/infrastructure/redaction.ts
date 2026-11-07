/** Redact credential-shaped strings before persistence. Never changes a verdict. */
export function redactSecrets(text: string): string {
  return text
    .replace(
      /\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{20,})\b/g,
      "<redacted-secret>",
    )
    .replace(/Bearer\s+[A-Za-z0-9._-]{12,}/gi, "Bearer <redacted-secret>");
}
export function sanitizedJson<T>(value: T): T {
  return JSON.parse(redactSecrets(JSON.stringify(value))) as T;
}
