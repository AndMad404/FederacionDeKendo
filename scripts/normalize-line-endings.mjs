import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function normalizeLineEndings(root = process.cwd(), fix = false) {
  const eolReport = execFileSync("git", ["ls-files", "--eol", "-z"], {
    cwd: root,
    encoding: "utf8",
  });

  const crlfFiles = eolReport
    .split("\0")
    .filter(Boolean)
    .filter((entry) => /\bw\/crlf\b/.test(entry))
    .map((entry) => entry.slice(entry.indexOf("\t") + 1));

  if (fix)
    for (const file of crlfFiles) {
      const target = path.join(root, file);
      const contents = readFileSync(target);
      const normalized = Buffer.from(
        contents.toString("utf8").replaceAll("\r\n", "\n"),
        "utf8",
      );
      writeFileSync(target, normalized);
    }
  return crlfFiles;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const fix = !process.argv.includes("--check");
  const files = normalizeLineEndings(process.cwd(), fix);
  if (!fix && files.length) {
    console.error(`Tracked files with CRLF:\n${files.join("\n")}`);
    process.exitCode = 1;
  } else
    console.log(
      fix ? `Normalized ${files.length} file(s).` : "All tracked files use LF.",
    );
}
