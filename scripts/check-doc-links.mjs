import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

// Check tracked local Markdown destinations. External links and generated/private
// evidence are intentionally not asserted reachable by this offline CI check.
const root = process.cwd();
const files = execFileSync("git", ["ls-files", "-z", "--", "*.md"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);
const failures = [];
let checked = 0;
for (const file of files) {
  const text = fs.readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const match of text.matchAll(
    /!?\[[^\]\n]*\]\((<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\)/g,
  )) {
    let href = match[1].replace(/^<|>$/g, "");
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#")) continue;
    href = href.split("#")[0].split("?")[0];
    try {
      href = decodeURIComponent(href);
    } catch {
      failures.push({ file, href, reason: "Malformed URL encoding" });
      continue;
    }
    if (!href) continue;
    const destination = path.resolve(
      path.dirname(path.resolve(root, file)),
      href,
    );
    const relative = path.relative(root, destination);
    checked++;
    if (
      relative.startsWith("..") ||
      path.isAbsolute(relative) ||
      !fs.existsSync(destination)
    )
      failures.push({ file, href, reason: "Missing or outside repository" });
  }
}
console.log(
  JSON.stringify({
    scope:
      "tracked local Markdown destinations, excluding fenced examples; external URLs/anchors not checked",
    files: files.length,
    checked,
    failures,
  }),
);
if (failures.length) process.exitCode = 1;
