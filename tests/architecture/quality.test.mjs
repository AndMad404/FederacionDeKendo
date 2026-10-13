import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { runQuality } from "../../scripts/quality.mjs";
import { temporaryDirectory } from "../helpers/temporary-directory.mjs";

async function fixture(t, source) {
  const root = await temporaryDirectory(t, "site-quality-");
  await writeFile(
    path.join(root, "eslint.config.mjs"),
    'export default [{ files: ["**/*.js"], rules: { semi: ["error", "always"], "no-debugger": "error" } }];\n',
  );
  await writeFile(path.join(root, ".prettierrc.json"), '{"endOfLine":"lf"}\n');
  await writeFile(path.join(root, ".prettierignore"), "eslint.config.mjs\n");
  await writeFile(path.join(root, ".gitignore"), ".cache/\n");
  await writeFile(path.join(root, "example.js"), source);
  await writeFile(path.join(root, "notes.txt"), "Note\r\n");
  execFileSync("git", ["init", "--quiet"], { cwd: root });
  execFileSync("git", ["add", "--all"], { cwd: root });
  return root;
}

test("quality autofix is idempotent, retains reports and normalizes files outside Prettier", async (t) => {
  const root = await fixture(t, "const answer=42\r\n");
  await writeFile(path.join(root, ".gitignore"), ".cache/\ntmp/\n");
  await mkdir(path.join(root, "tmp"));
  await writeFile(path.join(root, "tmp/generated.js"), "debugger;const =;\n");
  const first = await runQuality({ root, fix: true });
  assert.equal(first.status, "corrected");
  assert.ok(first.fixedFiles.includes("example.js"));
  assert.ok(first.fixedFiles.includes("notes.txt"));
  assert.equal(
    await readFile(path.join(root, "example.js"), "utf8"),
    "const answer = 42;\n",
  );
  assert.equal(await readFile(path.join(root, "notes.txt"), "utf8"), "Note\n");
  const second = await runQuality({ root, fix: true });
  assert.equal(second.status, "clean");
  assert.deepEqual(second.fixedFiles, []);
  assert.equal(
    await readFile(path.join(root, "tmp/generated.js"), "utf8"),
    "debugger;const =;\n",
  );
  const check = await runQuality({ root });
  assert.equal(check.status, "clean");
  const json = JSON.parse(
    await readFile(
      path.join(root, ".cache/verification/quality-check.json"),
      "utf8",
    ),
  );
  assert.equal(json.schemaVersion, 1);
  assert.equal(json.status, check.status);
});

test("quality check reports lint and formatting together without changing the source", async (t) => {
  const root = await fixture(t, "debugger;const answer=42\n");
  const before = await readFile(path.join(root, "example.js"));
  const result = await runQuality({ root });
  assert.equal(result.status, "failed");
  assert.ok(
    result.tools
      .find((tool) => tool.name === "ESLint")
      .diagnostics.some(
        (d) =>
          d.ruleId === "no-debugger" && d.line === 1 && d.file === "example.js",
      ),
  );
  assert.ok(
    result.tools
      .find((tool) => tool.name === "Prettier")
      .diagnostics.some((d) => d.file === "example.js"),
  );
  assert.deepEqual(await readFile(path.join(root, "example.js")), before);
  const fixed = await runQuality({ root, fix: true });
  assert.equal(fixed.status, "failed");
  assert.match(
    await readFile(
      path.join(root, ".cache/verification/quality-fix.md"),
      "utf8",
    ),
    /no-debugger/,
  );
});

test("invalid syntax and a broken lint configuration remain explicit while Prettier still runs", async (t) => {
  const root = await fixture(t, "const =;\n");
  const syntax = await runQuality({ root, fix: true });
  assert.equal(syntax.status, "failed");
  assert.ok(
    syntax.tools
      .find((tool) => tool.name === "ESLint")
      .diagnostics.some((d) => d.fatal),
  );
  assert.ok(
    syntax.tools.find((tool) => tool.name === "Prettier").diagnostics.length,
  );
  await writeFile(
    path.join(root, "eslint.config.mjs"),
    'throw new Error("Broken fixture configuration");\n',
  );
  await writeFile(path.join(root, "example.js"), "const answer=42\n");
  const broken = await runQuality({ root, fix: true });
  assert.equal(broken.status, "failed");
  assert.equal(
    broken.tools.find((tool) => tool.name === "ESLint").status,
    "tool-error",
  );
  assert.equal(
    broken.tools.find((tool) => tool.name === "Prettier").status,
    "corrected",
  );
});
