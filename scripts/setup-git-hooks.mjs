import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const repositoryRoot = process.cwd();

if (!existsSync(path.join(repositoryRoot, ".git"))) {
  process.exit(0);
}

execFileSync("git", ["config", "core.hooksPath", ".githooks"], {
  cwd: repositoryRoot,
  stdio: "inherit",
});
