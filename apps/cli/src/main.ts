import { randomUUID } from "node:crypto";
import os from "node:os";
try {
  await import("./program.ts");
} catch (error) {
  const e = error as NodeJS.ErrnoException;
  const dependency =
    ["ERR_MODULE_NOT_FOUND", "MODULE_NOT_FOUND", "ERR_DLOPEN_FAILED"].includes(
      e.code || "",
    ) || /Could not locate the bindings/.test(e.message || "");
  let message =
    error instanceof Error ? error.message : "CLI initialization failed";
  message = message
    .replaceAll(os.homedir(), "<home>")
    .replaceAll(os.homedir().replaceAll("\\", "/"), "<home>");
  process.stdout.write(
    JSON.stringify({
      schemaVersion: 1,
      ok: false,
      correlationId: randomUUID(),
      error: {
        code: dependency ? "DEPENDENCY_UNAVAILABLE" : "INTERNAL_ERROR",
        message,
        retryable: false,
        details: [],
      },
    }) + "\n",
  );
  process.exitCode = dependency ? 3 : 9;
}
