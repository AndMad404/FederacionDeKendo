import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import test from "node:test";

async function collectCssFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(directory, entry.name);
      if (entry.isDirectory()) return collectCssFiles(entryPath);
      return extname(entry.name).toLowerCase() === ".css" ? [entryPath] : [];
    }),
  );
  return files.flat();
}

test("source CSS does not use important declarations", async () => {
  const sourceDirectory = resolve(process.cwd(), "src");
  const cssFiles = await collectCssFiles(sourceDirectory);
  const violations = [];

  for (const filePath of cssFiles) {
    const source = await readFile(filePath, "utf8");
    if (/!\s*important\b/i.test(source)) violations.push(filePath);
  }

  assert.deepEqual(violations, []);
});
