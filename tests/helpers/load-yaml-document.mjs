import { readFile } from "node:fs/promises";
import { parse } from "yaml";

export async function loadYamlDocument(path) {
  const source = await readFile(path, "utf8");
  const document = parse(source);
  if (!document || typeof document !== "object") {
    throw new Error(`${path}: expected a YAML object`);
  }
  return document;
}

export function workflowSteps(document) {
  return Object.values(document.jobs ?? {}).flatMap((job) => job.steps ?? []);
}

export function actionSteps(document) {
  return document.runs?.steps ?? [];
}
