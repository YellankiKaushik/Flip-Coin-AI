import fs from "node:fs";
import path from "node:path";
const root = process.cwd(),
  modules = path.join(root, "node_modules");
const found = new Map();
function scan(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.isSymbolicLink()) continue;
    const p = path.join(dir, entry.name);
    if (entry.name.startsWith("@")) {
      scan(p);
      continue;
    }
    const file = path.join(p, "package.json");
    if (!fs.existsSync(file)) continue;
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!pkg.name || pkg.name.startsWith("@switchforge/")) continue;
    const key = pkg.name + "@" + pkg.version;
    if (!found.has(key)) {
      const notices = [];
      for (const name of fs.readdirSync(p)) {
        if (
          /^(?:licen[sc]e|copying|notice)(?:\.|$)/i.test(name) &&
          fs.statSync(path.join(p, name)).isFile()
        ) {
          const out = path.join(
            root,
            "docs/licenses",
            pkg.name.replaceAll("/", "__"),
            name,
          );
          fs.mkdirSync(path.dirname(out), { recursive: true });
          fs.copyFileSync(path.join(p, name), out);
          notices.push(path.relative(root, out).replaceAll("\\", "/"));
        }
      }
      found.set(key, {
        name: pkg.name,
        version: pkg.version,
        license:
          typeof pkg.license === "string"
            ? pkg.license
            : JSON.stringify(pkg.license || "UNSPECIFIED"),
        notices,
      });
    }
    scan(path.join(p, "node_modules"));
  }
}
scan(modules);
const rows = [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync(
  path.join(root, "THIRD_PARTY_NOTICES.md"),
  [
    "# Third-party dependency notices",
    "",
    "Generated from actual installed package manifests. No third-party ownership or license is replaced by the project Apache-2.0 license. Exact distribution is package-lock.json. Copied upstream license/notice files are under docs/licenses; package manifests remain the source for listed SPDX values. This inventory is not a legal certification.",
    "",
    "External tools: oasdiff 1.35.0 is downloaded separately from its official release; its release license is retained beside the local executable. Playwright downloads Chrome/Chromium separately; browser binaries are not committed or redistributed here. Node and Switch/Codex/Mattermost are separately installed external runtimes.",
    "",
    "| Package | Version | Declared license | License/notice files |",
    "|---|---|---|---|",
    ...rows.map(
      (p) =>
        "| " +
        p.name +
        " | " +
        p.version +
        " | " +
        p.license +
        " | " +
        p.notices
          .map((n) => "[" + path.basename(n) + "](" + n + ")")
          .join(", ") +
        " |",
    ),
    "",
  ].join("\n"),
);
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(
  path.join(root, "docs/dependencies.lock.json"),
  JSON.stringify(
    { generatedAt: new Date().toISOString(), packages: rows },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    packages: rows.length,
    unknown: rows.filter((p) => p.license === "UNSPECIFIED").map((p) => p.name),
  }),
);
