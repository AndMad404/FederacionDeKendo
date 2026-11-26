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

export function actionSteps(document) {
  return document.runs?.steps ?? [];
}
