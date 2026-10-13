import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeLineEndings } from "./normalize-line-endings.mjs";
import { reportDirectory } from "./verify-site.mjs";

export async function runQuality({
  root = process.cwd(),
  fix = false,
  directory = reportDirectory(root),
  workflow = path.resolve(root) === process.cwd(),
} = {}) {
  const report = {
    schemaVersion: 1,
    mode: fix ? "fix" : "check",
    sha: process.env.GITHUB_SHA ?? null,
    tools: [],
    fixedFiles: [],
  };
  const files = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean);
  const before = new Map(
    files
      .filter((file) => existsSync(path.join(root, file)))
      .map((file) => [file, readFileSync(path.join(root, file))]),
  );
  async function tool(name, execute) {
    try {
      const result = await execute();
      if (result.status === "clean" && result.correctedFiles?.length)
        result.status = "corrected";
      result.exitCode = result.status === "pending" ? 1 : 0;
      report.tools.push({ name, ...result });
    } catch (error) {
      report.tools.push({
        name,
        status: "tool-error",
        exitCode: 2,
        diagnostics: [{ message: error.message }],
      });
    }
  }
  await tool("ESLint", async () => {
    const { ESLint } = await import("eslint");
    const eslint = new ESLint({ cwd: root, fix });
    const targets = [];
    for (const file of before.keys())
      if (
        /\.(?:[cm]?js|tsx?)$/.test(file) &&
        !(await eslint.isPathIgnored(path.join(root, file)))
      )
        targets.push(file);
    const results = targets.length ? await eslint.lintFiles(targets) : [];
    if (fix) await ESLint.outputFixes(results);
    return {
      version: ESLint.version,
      status: results.some((result) => result.errorCount || result.warningCount)
        ? "pending"
        : "clean",
      diagnostics: results.flatMap((result) =>
        result.messages.map((message) => ({
          ...message,
          file: path.relative(root, result.filePath).replaceAll("\\", "/"),
        })),
      ),
      correctedFiles: results
        .filter((result) => result.output !== undefined)
        .map((result) =>
          path.relative(root, result.filePath).replaceAll("\\", "/"),
        ),
    };
  });
  await tool("Line endings", async () => {
    const crlf = normalizeLineEndings(root, fix);
    return {
      status: fix || !crlf.length ? "clean" : "pending",
      diagnostics: fix
        ? []
        : crlf.map((file) => ({
            file,
            message: "Usar LF; ejecutar pnpm run quality:fix.",
          })),
      correctedFiles: fix ? crlf : [],
    };
  });
  await tool("Prettier", async () => {
    const prettier = await import("prettier");
    const diagnostics = [],
      correctedFiles = [];
    for (const file of before.keys()) {
      const target = path.join(root, file);
      const info = await prettier.getFileInfo(target, {
        ignorePath: path.join(root, ".prettierignore"),
      });
      if (info.ignored || !info.inferredParser) continue;
      try {
        const source = readFileSync(target, "utf8");
        const formatted = await prettier.format(source, {
          ...(await prettier.resolveConfig(target)),
          filepath: target,
        });
        if (formatted !== source) {
          if (fix) {
            writeFileSync(target, formatted);
            correctedFiles.push(file);
          } else
            diagnostics.push({
              file,
              message: "Formato incorrecto; ejecutar pnpm run quality:fix.",
            });
        }
      } catch (error) {
        diagnostics.push({
          file,
          message: error.message,
          line: error.loc?.start?.line,
          column: error.loc?.start?.column,
        });
      }
    }
    return {
      version: prettier.version,
      status: diagnostics.length ? "pending" : "clean",
      diagnostics,
      correctedFiles,
    };
  });
  report.fixedFiles = [...before]
    .filter(
      ([file, bytes]) => !bytes.equals(readFileSync(path.join(root, file))),
    )
    .map(([file]) => file.replaceAll("\\", "/"));
  report.status = report.tools.some(
    (tool) => !["clean", "corrected"].includes(tool.status),
  )
    ? "failed"
    : report.fixedFiles.length
      ? "corrected"
      : "clean";
  const summary = [
    "## Calidad del codigo",
    "",
    `Resultado: **${report.status}**. Modo: ${report.mode}.`,
    "",
    ...report.tools.flatMap((tool) => [
      `### ${tool.name}: ${tool.status}`,
      ...(tool.correctedFiles ?? []).map((file) => `- Corregido: \`${file}\`.`),
      ...tool.diagnostics.map(
        (diagnostic) =>
          `- ${diagnostic.file ? `\`${diagnostic.file}${diagnostic.line ? `:${diagnostic.line}` : ""}\`: ` : ""}${diagnostic.ruleId ? `[${diagnostic.ruleId}] ` : ""}${diagnostic.message}`,
      ),
      "",
    ]),
  ].join("\n");
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    path.join(directory, `quality-${report.mode}.json`),
    JSON.stringify(report, null, 2) + "\n",
  );
  writeFileSync(path.join(directory, `quality-${report.mode}.md`), summary);
  if (workflow && process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + "\n");
  console.log(summary);
  if (workflow && process.env.GITHUB_ACTIONS) {
    const escape = (value) =>
      String(value)
        .replaceAll("%", "%25")
        .replaceAll("\r", "%0D")
        .replaceAll("\n", "%0A")
        .replaceAll(",", "%2C")
        .replaceAll(":", "%3A");
    for (const tool of report.tools)
      for (const diagnostic of tool.diagnostics)
        console.log(
          `::error ${diagnostic.file ? `file=${escape(diagnostic.file)},` : ""}${diagnostic.line ? `line=${diagnostic.line},` : ""}title=${escape(tool.name)}::${escape(diagnostic.message)}`,
        );
  }
  return report;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const report = await runQuality({ fix: process.argv.includes("--fix") });
    process.exitCode = report.status === "failed" ? 1 : 0;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
