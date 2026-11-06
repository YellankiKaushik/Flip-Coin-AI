import fs from "node:fs";
import { createHash } from "node:crypto";
const expected = {
  "DEEP_TECHNICAL_ARCHITECTURE_V2.md": {
    size: 260575,
    hash: "816EE4CB4A7DE5762377FFB447395E0AE59B3D2B3B7CF4FF4AE45C11CA07C8EB",
  },
  "hack details.pdf": {
    size: 340707,
    hash: "37AC819BF7B0AF5CB3382B9ACB28BF7B63DB98F8DDA278E539CD66B8777A5E15",
  },
  "PROJECT_ANALYSIS.md": {
    size: 72716,
    hash: "C44B9A27CB588CACCE84F89AB0279D88BE37B9CAEAF54F8A0FD5B5794B2B9A5D",
  },
};
let valid = true;
for (const [file, e] of Object.entries(expected)) {
  if (!fs.existsSync(file)) {
    console.log(JSON.stringify({ file, status: "REFERENCE_NOT_DISTRIBUTED" }));
    continue;
  }
  const b = fs.readFileSync(file),
    hash = createHash("sha256").update(b).digest("hex").toUpperCase();
  const unchanged = b.length === e.size && hash === e.hash;
  valid &&= unchanged;
  console.log(JSON.stringify({ file, size: b.length, hash, unchanged }));
}
if (!valid) process.exitCode = 1;
