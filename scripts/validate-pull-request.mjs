import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TITLE_PATTERN =
  /^(fix|feat|refactor|docs|test|build|ci|chore)\([a-z0-9][a-z0-9-]*\): [a-z0-9].{9,71}$/;

export const REQUIRED_SECTIONS = [
  "Problema",
  "Resultado esperado",
  "Alcance",
  "Verificación",
  "Riesgos",
];

function sectionContent(body, heading) {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex(
    (line) =>
      line.trim().toLocaleLowerCase("es") ===
      `## ${heading}`.toLocaleLowerCase("es"),
  );
  if (start === -1) return null;
  const nextHeading = lines.findIndex(
    (line, index) => index > start && /^##\s+/.test(line),
  );
  const end = nextHeading === -1 ? lines.length : nextHeading;
  return lines
    .slice(start + 1, end)
    .join("\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^\s*- \[[ xX]\].*$/gm, "")
    .trim();
}

export function validatePullRequest({ title = "", body = "" }) {
  const errors = [];
  if (!TITLE_PATTERN.test(title)) {
    errors.push(
      "El título debe seguir `type(scope): resultado observable`, usar un tipo permitido y tener entre 10 y 72 caracteres después del prefijo.",
    );
  }

  for (const heading of REQUIRED_SECTIONS) {
    const content = sectionContent(body, heading);
    if (content === null) errors.push(`Falta la sección \`## ${heading}\`.`);
    else if (!content)
      errors.push(`La sección \`## ${heading}\` conserva solo el marcador.`);
  }
  return errors;
}

export function validatePullRequestEvent(event) {
  if (!event?.pull_request) {
    return ["El evento no contiene datos de un pull request."];
  }
  return validatePullRequest({
    title: event.pull_request.title,
    body: event.pull_request.body ?? "",
  });
}

function run() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    throw new Error("GITHUB_EVENT_PATH no está definido.");
  }
  const event = JSON.parse(readFileSync(eventPath, "utf8"));
  const errors = validatePullRequestEvent(event);
  if (errors.length) {
    console.error("Metadatos del pull request inválidos:\n");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log("Metadatos del pull request válidos.");
  }
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (isDirectExecution) run();
