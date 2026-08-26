import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const eolReport = execFileSync("git", ["ls-files", "--eol", "-z"], {
  encoding: "utf8",
});

const crlfFiles = eolReport
  .split("\0")
  .filter(Boolean)
  .filter((entry) => /\bw\/crlf\b/.test(entry))
  .map((entry) => entry.slice(entry.indexOf("\t") + 1));

if (process.argv.includes("--check")) {
  if (crlfFiles.length === 0) {
    console.log("All tracked files use LF.");
    process.exit(0);
  }
  console.error(
    `Tracked files with CRLF:\n${crlfFiles.map((file) => `- ${file}`).join("\n")}\nRun pnpm run format:line-endings to normalize them.`,
  );
  process.exit(1);
}

for (const file of crlfFiles) {
  const contents = readFileSync(file);
  const normalized = Buffer.from(
    contents.toString("utf8").replaceAll("\r\n", "\n"),
    "utf8",
  );
  writeFileSync(file, normalized);
}

console.log(`Normalized ${crlfFiles.length} tracked file(s) to LF.`);
