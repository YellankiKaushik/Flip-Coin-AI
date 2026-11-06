import { spawn } from "node:child_process";
import path from "node:path";
import { invariant } from "../domain/models.ts";
export interface RunnerResult {
  exitCode: number | null;
  signal: string | null;
  timedOut: boolean;
  outputTruncated: boolean;
  stdout: string;
  stderr: string;
  durationMs: number;
  spawnErrorCode?: string;
}
export async function runProcess(
  executable: string,
  argv: string[],
  cwd: string,
  allowlist: string[],
  timeoutMs = 60000,
  maxOutputBytes = 1048576,
  abortSignal?: AbortSignal,
): Promise<RunnerResult> {
  invariant(
    allowlist.map((p) => path.resolve(p)).includes(path.resolve(executable)),
    "UNAUTHORIZED_ACTION",
    "Executable is not allowlisted",
    4,
  );
  return new Promise((resolve) => {
    const started = Date.now();
    let stdout = "",
      stderr = "",
      total = 0,
      timedOut = false,
      outputTruncated = false,
      settled = false,
      force: NodeJS.Timeout | undefined;
    const env: NodeJS.ProcessEnv = {};
    for (const key of [
      "PATH",
      "Path",
      "SystemRoot",
      "WINDIR",
      "TEMP",
      "TMP",
      "USERPROFILE",
      "LOCALAPPDATA",
    ])
      if (process.env[key]) env[key] = process.env[key];
    env.CI = "1";
    env.NO_COLOR = "1";
    env.VITEST_MAX_THREADS = "1";
    const child = spawn(executable, argv, {
      cwd,
      env,
      shell: false,
      windowsHide: true,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const kill = () => {
      if (process.platform === "win32" && child.pid) {
        const killer = spawn(
          path.join(
            process.env.SystemRoot || "C:\\Windows",
            "System32",
            "taskkill.exe",
          ),
          ["/PID", String(child.pid), "/T", "/F"],
          { windowsHide: true, stdio: "ignore", shell: false },
        );
        killer.on("error", () => child.kill());
      } else if (child.pid) {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          child.kill("SIGKILL");
        }
      }
    };
    const stop = () => {
      if (process.platform === "win32") kill();
      else {
        child.kill("SIGTERM");
        force = setTimeout(kill, 250);
        force.unref();
      }
    };
    const onAbort = () => stop();
    abortSignal?.addEventListener("abort", onAbort, { once: true });
    if (abortSignal?.aborted) stop();
    const timer = setTimeout(() => {
      timedOut = true;
      stop();
    }, timeoutMs);
    const consume = (b: Buffer, channel: "stdout" | "stderr") => {
      const remaining = maxOutputBytes - total;
      total += b.length;
      const text = b.subarray(0, Math.max(0, remaining)).toString("utf8");
      if (channel === "stdout") stdout += text;
      else stderr += text;
      if (total > maxOutputBytes && !outputTruncated) {
        outputTruncated = true;
        stop();
      }
    };
    child.stdout.on("data", (b: Buffer) => consume(b, "stdout"));
    child.stderr.on("data", (b: Buffer) => consume(b, "stderr"));
    const done = (
      exitCode: number | null,
      signal: string | null,
      error?: string,
    ) => {
      if (settled) return;
      settled = true;
      abortSignal?.removeEventListener("abort", onAbort);
      clearTimeout(timer);
      if (force) clearTimeout(force);
      resolve({
        exitCode,
        signal,
        timedOut,
        outputTruncated,
        stdout,
        stderr,
        durationMs: Date.now() - started,
        ...(error ? { spawnErrorCode: error } : {}),
      });
    };
    child.on("error", (e: NodeJS.ErrnoException) =>
      done(null, null, e.code || "SPAWN_ERROR"),
    );
    child.on("close", (code, signal) => done(code, signal));
  });
}
