import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export async function temporaryDirectory(t, prefix) {
  const directory = await mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

export function temporaryPaths(directory, filenames) {
  return Object.fromEntries(
    Object.entries(filenames).map(([name, filename]) => [
      name,
      path.join(directory, filename),
    ]),
  );
}

export async function snapshotFiles(paths) {
  return Promise.all(
    paths.map(async (filePath) => [filePath, await readFile(filePath)]),
  );
}

export async function expectFilesUnchanged(snapshot) {
  for (const [filePath, contents] of snapshot) {
    assert.deepEqual(
      await readFile(filePath),
      contents,
      `${filePath} must remain unchanged`,
    );
  }
}
