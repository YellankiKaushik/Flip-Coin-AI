import fs from "node:fs";
import path from "node:path";
/** Cooperative metadata monitoring supplements raw-byte hashes; not an OS security boundary. */
export function watchSnapshot(
  root: string,
  include: string[],
  exclude: string[],
) {
  let dirty = false;
  const files = new Set(
    include
      .flatMap((pattern) => fs.globSync(pattern, { cwd: root, exclude }))
      .map((name) => path.resolve(root, name))
      .filter((name) => fs.statSync(name).isFile()),
  );
  const manifest = path.join(root, "candidate-manifest.json");
  if (fs.existsSync(manifest)) files.add(manifest);
  const baseline = new Map(
    [...files].map((file) => [file, fs.statSync(file, { bigint: true })]),
  );
  const same = (a: fs.BigIntStats, b: fs.BigIntStats) =>
    a.mtimeNs === b.mtimeNs &&
    a.ctimeNs === b.ctimeNs &&
    a.ino === b.ino &&
    a.size === b.size;
  for (const file of files)
    fs.watchFile(
      file,
      { interval: 20, persistent: false, bigint: true },
      (current) => {
        if (!same(current, baseline.get(file)!)) dirty = true;
      },
    );
  return {
    changed: () => {
      for (const [file, prior] of baseline) {
        try {
          if (!same(fs.statSync(file, { bigint: true }), prior)) dirty = true;
        } catch {
          dirty = true;
        }
      }
      return dirty;
    },
    close: () => {
      for (const file of files) fs.unwatchFile(file);
    },
  };
}
