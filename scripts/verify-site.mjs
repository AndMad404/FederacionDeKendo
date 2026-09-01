import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ALLOWED_UNIT_SCRIPTS = new Set([
  "test:unit",
  "test:unit:without-history-correction",
  "test:unit:without-sync",
]);

export function captureWorkspaceFingerprint(root) {
  const result = spawnSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8", shell: false },
  );
  if (result.status !== 0 || result.error) {
    throw result.error ?? new Error(result.stderr.trim());
  }

  const hash = createHash("sha256");
  for (const file of result.stdout.split("\0").filter(Boolean).sort()) {
    const absolutePath = path.join(root, file);
    hash.update(file);
    hash.update("\0");
    if (existsSync(absolutePath)) hash.update(readFileSync(absolutePath));
    else hash.update("<deleted>");
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function verificationSteps(unitScript = "test:unit") {
  if (!ALLOWED_UNIT_SCRIPTS.has(unitScript)) {
    throw new Error(`Unsupported unit script: ${unitScript}`);
  }
  return [
    ["run", "lint"],
    ["run", "format:check"],
    ["run", "typecheck"],
    ["run", "build"],
    ["run", unitScript],
    ["run", "test:generated"],
    ["exec", "playwright", "install", "--with-deps", "chromium"],
    ["exec", "playwright", "test", "tests/data"],
    ["run", "test:behavior"],
    ["run", "test:design"],
    ["run", "format:check"],
  ];
}

function parseUnitScript(args) {
  const index = args.indexOf("--unit-script");
  if (index === -1) return "test:unit";
  if (!args[index + 1]) throw new Error("--unit-script requires a value");
  return args[index + 1];
}

function runStep(root, args) {
  const command = `pnpm ${args.join(" ")}`;
  console.log(`\n> ${command}`);
  const executable =
    process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "pnpm";
  const executableArgs =
    process.platform === "win32"
      ? ["/d", "/s", "/c", "pnpm.cmd", ...args]
      : args;
  const result = spawnSync(executable, executableArgs, {
    cwd: root,
    shell: false,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status}`);
  }
}

export function runVerification({
  root,
  unitScript,
  captureFingerprint = captureWorkspaceFingerprint,
  executeStep = runStep,
}) {
  const initialFingerprint = captureFingerprint(root);
  let stepError;

  try {
    for (const args of verificationSteps(unitScript)) executeStep(root, args);
  } catch (error) {
    stepError = error;
  }

  const finalFingerprint = captureFingerprint(root);
  if (finalFingerprint !== initialFingerprint) {
    throw new Error(
      "Verification changed the workspace. Its results are invalid; inspect the diff and rerun the complete gate.",
      { cause: stepError },
    );
  }
  if (stepError) throw stepError;
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (isDirectExecution) {
  try {
    runVerification({
      root: process.cwd(),
      unitScript: parseUnitScript(process.argv.slice(2)),
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
