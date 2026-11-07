import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
export async function startCheckout(root: string, digest: string, port = 0) {
  const server = http.createServer((req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; form-action 'none'; frame-ancestors 'none'",
    );
    if (req.url === "/__source") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ candidateDigest: digest }));
      return;
    }
    if (req.url === "/checkout") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(
        fs.readFileSync(
          path.join(root, "fixtures", "current", "app", "index.html"),
        ),
      );
      return;
    }
    res.statusCode = 404;
    res.end("Not found");
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No local port");
  return {
    server,
    url: "http://127.0.0.1:" + address.port,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      ),
  };
}
if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  const index = process.argv.indexOf("--snapshot");
  const id = process.argv[index + 1];
  if (index < 0 || !id || !/^[a-f0-9-]{36}$/.test(id)) {
    process.stderr.write(
      "Usage: npm run demo:start -- --snapshot <prepared-UUID>\n",
    );
    process.exitCode = 2;
  } else {
    const root = path.join(process.cwd(), ".local/snapshots", id);
    const manifestBytes = fs.readFileSync(
      path.join(root, "candidate-manifest.json"),
    );
    const digest = createHash("sha256").update(manifestBytes).digest("hex");
    const target = await startCheckout(root, digest);
    process.stdout.write(
      JSON.stringify({
        url: target.url + "/checkout",
        snapshotId: id,
        candidateDigest: digest,
      }) + "\n",
    );
    process.on("SIGINT", () => {
      void target.close().then(() => process.exit(0));
    });
  }
}
