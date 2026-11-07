import { test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { randomUUID } from "node:crypto";
import { prepare } from "../../packages/core/src/public/infrastructure.ts";
import { Ledger, ArtifactStore } from "../../packages/evidence/src/index.ts";
import { registeredChecks } from "../../packages/checks/src/index.ts";
import { testRun } from "../helpers/ledger-fixture.ts";

// Real tool/adapter fault injection in an isolated test ledger. These deliberately
// damaged inputs never pass coordinator manifest validation or grant human review.
for (const fault of [
  "missing-readiness",
  "missing-form",
  "port-conflict",
  "invalid-openapi",
  "oversize-csv",
] as const) {
  test(
    "production adapter records ERROR and evidence for " + fault,
    async () => {
      const root = process.cwd(),
        id = randomUUID();
      const saved = {
        db: process.env.SF_DB_PATH,
        artifacts: process.env.SF_ARTIFACT_ROOT,
      };
      process.env.SF_DB_PATH = ".local/tests/" + id + "/ledger.sqlite";
      process.env.SF_ARTIFACT_ROOT = "artifacts/tests/" + id;
      let ledger: Ledger | undefined;
      const server = http.createServer((_q, r) =>
        r.end("Owned port-conflict test, no real checkout"),
      );
      try {
        await new Promise<void>((resolve) =>
          server.listen(0, "127.0.0.1", resolve),
        );
        const port = (server.address() as { port: number }).port;
        if (fault !== "port-conflict")
          await new Promise<void>((resolve) => server.close(() => resolve()));
        ledger = new Ledger(root);
        const snapshot = await prepare(
          root,
          ledger,
          "corrected",
          "test-only-adapter-fault-" + id,
          {
            browserTimeoutMs: 2500,
            sampleUrl: "http://127.0.0.1:" + port + "/",
          },
        );
        const run = testRun(snapshot);
        ledger.insertRun(run);
        const store = new ArtifactStore(root, ledger);
        if (fault === "missing-readiness" || fault === "missing-form")
          fs.writeFileSync(
            path.join(snapshot.root, "fixtures/current/app/index.html"),
            fault === "missing-readiness"
              ? '<!doctype html><form id="checkout-form"><input type="email" aria-label="Email"></form>'
              : '<!doctype html><p data-testid="checkout-ready">Ready without a form</p>',
          );
        if (fault === "invalid-openapi")
          fs.writeFileSync(
            path.join(snapshot.root, "fixtures/current/api/candidate.yaml"),
            "openapi: not-an-openapi-version\n",
          );
        if (fault === "oversize-csv")
          fs.writeFileSync(
            path.join(snapshot.root, "fixtures/current/data/orders.csv"),
            Buffer.alloc(2 * 1024 * 1024 + 1, 65),
          );
        const checkId =
          fault === "invalid-openapi"
            ? "contract"
            : fault === "oversize-csv"
              ? "data"
              : "accessibility";
        const result = await registeredChecks[checkId].run({
          root,
          snapshot,
          runId: run.runId,
          store,
          criteriaReviewed: false,
          deadlineEpochMs: Date.now() + 15000,
        });
        expect(result.status).toBe("ERROR");
        expect(result.errors.length).toBeGreaterThan(0);
        expect(
          result.evidence.some((r) => r.relativePath.endsWith("error.json")),
        ).toBe(true);
        expect(result.evidence.every((r) => store.verify(run.runId, r))).toBe(
          true,
        );
        expect(
          store.verify(
            run.runId,
            JSON.parse(
              ledger
                .artifactRows(run.runId)
                .find((r) => r.path.endsWith("result.json"))!.data,
            ),
          ),
        ).toBe(true);
        if (fault === "missing-readiness" || fault === "missing-form") {
          expect(result.errors[0].code).toBe("SCANNER_TIMEOUT");
          // The timed-out process tree must release its listening socket.
          await new Promise<void>((resolve, reject) => {
            server.once("error", reject);
            server.listen(port, "127.0.0.1", resolve);
          });
        }
      } finally {
        if (server.listening)
          await new Promise<void>((resolve) => server.close(() => resolve()));
        ledger?.close();
        for (const [name, value] of [
          ["SF_DB_PATH", saved.db],
          ["SF_ARTIFACT_ROOT", saved.artifacts],
        ] as const)
          if (value === undefined) delete process.env[name];
          else process.env[name] = value;
      }
    },
    30000,
  );
}
