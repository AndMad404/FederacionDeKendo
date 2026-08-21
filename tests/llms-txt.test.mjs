import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateLlmsTxt } from "../scripts/check-llms-txt.mjs";

const configuredPaths = new Set([
  "/",
  "/eventos/",
  "/galeria/",
  "/afiliados/",
  "/en/",
  "/en/events/",
  "/en/gallery/",
  "/en/affiliates/",
  "/eventos/pasados/",
  "/en/events/past/",
]);

test("the published llms.txt complies with the project contract", async () => {
  const content = await readFile(
    new URL("../public/llms.txt", import.meta.url),
    "utf8",
  );

  assert.deepEqual(validateLlmsTxt(content, configuredPaths), {
    compliant: true,
    alarms: [],
  });
});

test("the observer returns false and alarms for an invalid file", () => {
  const invalid = `# Sitio\n\nResumen sin bloque.\n\n## Páginas\n\n- [Calendario](https://fak-kendo.pages.dev/calendario/)`;
  const result = validateLlmsTxt(invalid, configuredPaths);

  assert.equal(result.compliant, false);
  assert.ok(result.alarms.length >= 3);
  assert.ok(result.alarms.some((alarm) => alarm.includes("bloque Markdown")));
  assert.ok(result.alarms.some((alarm) => alarm.includes("ruta heredada")));
  assert.ok(result.alarms.some((alarm) => alarm.includes("descripción")));
});
