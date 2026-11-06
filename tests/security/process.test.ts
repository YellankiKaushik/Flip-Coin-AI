import { test, expect } from "vitest";
import { runProcess } from "../../packages/core/src/infrastructure/process-runner.ts";
test("unregistered executable denied before spawn", async () => {
  await expect(
    runProcess("untrusted.exe", [], process.cwd(), [process.execPath]),
  ).rejects.toThrow("not allowlisted");
});
test("timeout records ERROR-compatible receipt and kills child tree", async () => {
  const r = await runProcess(
    process.execPath,
    ["-e", "setInterval(()=>{},1000)"],
    process.cwd(),
    [process.execPath],
    300,
    1024,
  );
  expect(r.timedOut).toBe(true);
  expect(r.exitCode).not.toBe(0);
});
test("output flood remains bounded and never valid PASS", async () => {
  const r = await runProcess(
    process.execPath,
    ["-e", 'setInterval(()=>process.stdout.write("x".repeat(1024)),1)'],
    process.cwd(),
    [process.execPath],
    2000,
    2048,
  );
  expect(r.outputTruncated).toBe(true);
  expect(
    Buffer.byteLength(r.stdout) + Buffer.byteLength(r.stderr),
  ).toBeLessThanOrEqual(2048);
});
test("metacharacters are argv data and never shell commands", async () => {
  const attack = "; echo FORBIDDEN $(echo injected)";
  const r = await runProcess(
    process.execPath,
    ["-e", "process.stdout.write(process.argv[1])", attack],
    process.cwd(),
    [process.execPath],
  );
  expect(r.stdout).toBe(attack);
  expect(r.exitCode).toBe(0);
});
test("abort signal terminates an active verification subprocess", async () => {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 300);
  const r = await runProcess(
    process.execPath,
    ["-e", "setInterval(()=>{},1000)"],
    process.cwd(),
    [process.execPath],
    5000,
    1024,
    abort.signal,
  );
  clearTimeout(timer);
  expect(r.timedOut).toBe(false);
  expect(r.exitCode).not.toBe(0);
});
test("deadline terminates a real descendant process, not just its parent", async () => {
  const code =
    'const {spawn}=require("node:child_process");const c=spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{stdio:"ignore",windowsHide:true});process.stdout.write(String(c.pid));setInterval(()=>{},1000)';
  const r = await runProcess(
    process.execPath,
    ["-e", code],
    process.cwd(),
    [process.execPath],
    1000,
    1024,
  );
  expect(r.timedOut).toBe(true);
  const pid = Number(r.stdout);
  expect(Number.isSafeInteger(pid) && pid > 0).toBe(true);
  let dead = false;
  for (let i = 0; i < 20; i++) {
    try {
      process.kill(pid, 0);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ESRCH") {
        dead = true;
        break;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  expect(dead).toBe(true);
});
