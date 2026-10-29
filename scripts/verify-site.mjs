import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import { appendFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const reportDirectory = (root = process.cwd()) =>
  path.resolve(
    root,
    process.env.VERIFY_SITE_REPORT_DIR ?? ".cache/verification",
  );

export function retainCorrections(root, directory = reportDirectory(root)) {
  const temporary = mkdtempSync(path.join(os.tmpdir(), "site-corrections-"));
  const git = (args) =>
    execFileSync("git", args, {
      cwd: root,
      env: { ...process.env, GIT_INDEX_FILE: path.join(temporary, "index") },
    });
  try {
    // Snapshot all recoverable changes without changing the working index.
    // Publication independently enforces approved paths and verification.
    git(["read-tree", "HEAD"]);
    git(["add", "--all"]);
    mkdirSync(directory, { recursive: true });
    git([
      "diff",
      "--cached",
      "--binary",
      `--output=${path.resolve(directory, "corrections.patch")}`,
      "HEAD",
    ]);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

function phases(mode = "full") {
  if (!["full", "calendar"].includes(mode))
    throw new Error(`Unsupported verification mode: ${mode}`);
  return [
    ["Calidad (ESLint, Prettier y LF)", ["pnpm", "run", "quality:check"]],
    ["Espacios sin preparar", ["git", "diff", "--check"]],
    ["Espacios preparados", ["git", "diff", "--cached", "--check"]],
    ["Tipos (TypeScript)", ["pnpm", "run", "typecheck"]],
    ["Build y prerenderizado", ["pnpm", "run", "build"]],
    ["Pruebas Node (arquitectura y datos)", ["pnpm", "run", "test:unit"]],
    [
      "Instalacion de Chromium",
      ["pnpm", "exec", "playwright", "install", "--with-deps", "chromium"],
    ],
    [
      "Pruebas de navegador",
      [
        "pnpm",
        "exec",
        "playwright",
        "test",
        "tests/data",
        "tests/behavior",
        ...(mode === "full"
          ? ["tests/design", "--grep-invert", "@visual"]
          : []),
      ],
    ],
  ];
}

function commandFor(step) {
  return step.join(" ");
}

export function formatVerificationFailure(step, error) {
  const command = commandFor(step);
  const label =
    phases().find(([, candidate]) => commandFor(candidate) === command)?.[0] ??
    "Verificacion del sitio";
  return [
    "## Verificacion del sitio: fallo",
    "",
    `**Fase que fallo:** ${label}`,
    `**Comando:** \`${command}\``,
    `**Resultado:** ${error.message}`,
    "",
    "El detalle de la prueba o archivo aparece en el log inmediatamente anterior a este resumen.",
    "",
  ].join("\n");
}

async function writeVerificationFailureSummary(error) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath || !error.verificationStep) return;
  try {
    await appendFile(
      summaryPath,
      formatVerificationFailure(error.verificationStep, error),
      "utf8",
    );
  } catch {
    // The original verification failure remains the useful result.
  }
}

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

export function verificationSteps(mode = "full") {
  return phases(mode).map(([, command]) => command);
}

function runStep(root, [tool, ...args]) {
  const command = commandFor([tool, ...args]);
  console.log(`\n> ${command}`);
  const usesWindowsPnpm = process.platform === "win32" && tool === "pnpm";
  const executable = usesWindowsPnpm
    ? (process.env.ComSpec ?? "cmd.exe")
    : tool;
  const executableArgs = usesWindowsPnpm
    ? ["/d", "/s", "/c", "pnpm.cmd", ...args]
    : args;
  const result = spawnSync(executable, executableArgs, {
    cwd: root,
    shell: false,
    stdio: "inherit",
    env: {
      ...process.env,
      PLAYWRIGHT_JSON_OUTPUT_NAME: path.join(
        reportDirectory(root),
        "playwright.json",
      ),
    },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw Object.assign(
      new Error(`${command} failed with exit code ${result.status}`),
      { exitCode: result.status },
    );
  }
}

export function runVerification({
  root,
  mode = "full",
  captureFingerprint = captureWorkspaceFingerprint,
  executeStep = runStep,
  directory = reportDirectory(),
}) {
  const initialFingerprint = captureFingerprint(root);
  const report = {
    schemaVersion: 1,
    sha: process.env.GITHUB_SHA ?? null,
    mode,
    status: "passed",
    steps: phases(mode).map(([label, command]) => ({
      label,
      command,
      status: "not-executed",
    })),
  };
  let stepError;
  let failedStep;

  try {
    for (const step of report.steps) {
      failedStep = step.command;
      step.status = "running";
      executeStep(root, step.command);
      step.status = "passed";
    }
  } catch (error) {
    stepError = error;
  }

  const finalFingerprint = captureFingerprint(root);
  report.fingerprint = finalFingerprint;
  if (finalFingerprint !== initialFingerprint) {
    stepError = new Error(
      "Verification changed the workspace. Its results are invalid; inspect the diff and rerun the complete gate.",
      { cause: stepError },
    );
    report.status = "invalid";
  }
  if (stepError) {
    report.status = report.status === "invalid" ? "invalid" : "failed";
    const failed = report.steps.find((step) => step.status === "running");
    if (failed) {
      failed.status = "failed";
      failed.message = stepError.message;
      failed.exitCode = stepError.exitCode ?? null;
    }
    report.message = stepError.message;
    stepError.verificationStep = failedStep;
  }
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    path.join(directory, "verification.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  writeFileSync(
    path.join(directory, "verification.md"),
    `## Verificacion: ${report.status}\n\n` +
      report.steps
        .map(
          (step) =>
            `- ${step.label}: **${step.status}**${step.message ? ` — ${step.message}` : ""}`,
        )
        .join("\n") +
      "\n",
  );
  if (stepError) throw stepError;
  return report;
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (isDirectExecution) {
  try {
    if (process.argv.includes("--retain-corrections")) {
      retainCorrections(process.cwd());
    } else
      runVerification({
        root: process.cwd(),
        mode: process.argv.includes("--mode")
          ? process.argv[process.argv.indexOf("--mode") + 1]
          : "full",
      });
  } catch (error) {
    await writeVerificationFailureSummary(error);
    console.error(error.message);
    process.exitCode = 1;
  }
}
