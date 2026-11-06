import { test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

test("production packages expose public entry points without dependency cycles", () => {
  const root = process.cwd();
  const graph = new Map<string, Set<string>>();
  for (const file of fs.globSync("{packages,apps}/*/src/**/*.ts", {
    cwd: root,
  })) {
    const normalized = file.replaceAll("\\", "/");
    const owner = normalized.split("/").slice(0, 2).join("/");
    if (!graph.has(owner)) graph.set(owner, new Set());
    const text = fs.readFileSync(path.join(root, file), "utf8");
    for (const match of text.matchAll(
      /(?:from\s*|import\(\s*)["']([^"']+)["']/g,
    )) {
      if (!match[1].startsWith(".")) continue;
      const target = path
        .relative(
          root,
          path.resolve(path.dirname(path.join(root, file)), match[1]),
        )
        .replaceAll("\\", "/");
      if (!/^(packages|apps)\//.test(target)) continue;
      const dependency = target.split("/").slice(0, 2).join("/");
      if (dependency === owner) continue;
      expect(target, "Cross-package private import in " + normalized).toMatch(
        /\/src\/(?:index\.ts|public\/(?:domain|infrastructure|coordinator)\.ts)$/,
      );
      graph.get(owner)!.add(dependency);
    }
  }
  expect(graph.size).toBeGreaterThanOrEqual(6);
  expect([...graph.get("packages/core")!]).toEqual([]);
  expect([...graph.get("packages/checks")!]).not.toContain("packages/release");
  const walk = (node: string, chain: string[]) => {
    expect(
      chain,
      "Package dependency cycle: " + [...chain, node].join(" -> "),
    ).not.toContain(node);
    for (const next of graph.get(node) || []) walk(next, [...chain, node]);
  };
  for (const node of graph.keys()) walk(node, []);
});
