import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const SITE_ORIGIN = "https://fak-kendo.pages.dev";
const LEGACY_PATHS = new Set(["/calendario/"]);
const LINK_PATTERN = /^- \[([^\]]+)\]\((https:\/\/[^)]+)\)(?:: (.+))?$/;

export function validateLlmsTxt(content, configuredPaths) {
  const alarms = [];
  const lines = content.replaceAll("\r\n", "\n").trim().split("\n");
  const h1Lines = lines.filter((line) => line.startsWith("# "));
  const firstContentLine = lines.find((line) => line.trim());
  const firstSummaryLine = lines.find(
    (line, index) => index > 0 && line.trim(),
  );

  if (h1Lines.length !== 1 || firstContentLine !== h1Lines[0]) {
    alarms.push("Debe existir un solo H1 y debe ser el primer contenido.");
  }

  if (!firstSummaryLine?.startsWith("> ")) {
    alarms.push(
      "El resumen debe ser un bloque Markdown que comience con '> '.",
    );
  }

  let currentSection = null;
  let linkCount = 0;

  for (const [index, line] of lines.entries()) {
    if (line.startsWith("## ")) {
      currentSection = line.slice(3).trim();
      continue;
    }

    if (!line.startsWith("- ")) continue;

    if (!currentSection) {
      alarms.push(
        `La lista de la línea ${index + 1} no pertenece a una sección H2.`,
      );
      continue;
    }

    const match = line.match(LINK_PATTERN);
    if (!match) {
      alarms.push(
        `La línea ${index + 1} no usa el formato de enlace requerido.`,
      );
      continue;
    }

    linkCount += 1;
    const [, label, rawUrl, description] = match;
    const url = new URL(rawUrl);

    if (!label.trim()) {
      alarms.push(`El enlace de la línea ${index + 1} no tiene nombre.`);
    }
    if (!description?.trim()) {
      alarms.push(`El enlace de la línea ${index + 1} no tiene descripción.`);
    }
    if (url.origin !== SITE_ORIGIN) {
      alarms.push(
        `El enlace de la línea ${index + 1} pertenece a otro dominio.`,
      );
    }
    if (LEGACY_PATHS.has(url.pathname)) {
      alarms.push(
        `El enlace de la línea ${index + 1} usa la ruta heredada ${url.pathname}.`,
      );
    }
    if (!configuredPaths.has(url.pathname)) {
      alarms.push(
        `El enlace de la línea ${index + 1} no es una ruta SEO configurada: ${url.pathname}.`,
      );
    }
  }

  if (linkCount === 0) {
    alarms.push("Debe existir al menos un enlace dentro de una sección H2.");
  }

  return { compliant: alarms.length === 0, alarms };
}

async function run() {
  const rootUrl = new URL("../", import.meta.url);
  const [content, seoData] = await Promise.all([
    readFile(new URL("public/llms.txt", rootUrl), "utf8"),
    readFile(new URL("src/app/config/seo-data.json", rootUrl), "utf8").then(
      JSON.parse,
    ),
  ]);
  const configuredPaths = new Set(Object.keys(seoData.routes));
  const result = validateLlmsTxt(content, configuredPaths);

  console.log(`LLMS_TXT_COMPLIANT=${result.compliant}`);
  for (const alarm of result.alarms) {
    console.error(`ALARM llms.txt: ${alarm}`);
  }

  if (!result.compliant) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await run();
}
