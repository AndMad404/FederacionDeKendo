import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateLlmsTxt } from "../../scripts/check-llms-txt.mjs";

const fixturePaths = new Set([
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

function extractSitemapUrls(content) {
  return [...content.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map(
    ([, url]) => url,
  );
}

function extractLlmsUrls(content) {
  return [...content.matchAll(/^- \[[^\]]+\]\((https:\/\/[^)]+)\):/gm)].map(
    ([, url]) => url,
  );
}

test("the generated llms.txt mirrors every indexable sitemap route", async () => {
  const [content, sitemap] = await Promise.all([
    readFile(new URL("../../dist/llms.txt", import.meta.url), "utf8"),
    readFile(new URL("../../dist/sitemap.xml", import.meta.url), "utf8"),
  ]);
  const sitemapUrls = extractSitemapUrls(sitemap);
  const configuredPaths = new Set(
    sitemapUrls.map((url) => new URL(url).pathname),
  );

  assert.deepEqual(validateLlmsTxt(content, configuredPaths), {
    compliant: true,
    alarms: [],
  });
  assert.deepEqual(
    [...new Set(extractLlmsUrls(content))].sort(),
    [...new Set(sitemapUrls)].sort(),
  );
});

test("the generated robots.txt includes every published event route", async () => {
  const [robots, sitemap] = await Promise.all([
    readFile(new URL("../../dist/robots.txt", import.meta.url), "utf8"),
    readFile(new URL("../../dist/sitemap.xml", import.meta.url), "utf8"),
  ]);
  const eventPaths = extractSitemapUrls(sitemap)
    .map((url) => new URL(url).pathname)
    .filter(
      (path) =>
        ![
          "/eventos/",
          "/eventos/pasados/",
          "/en/events/",
          "/en/events/past/",
        ].includes(path) &&
        (/^\/eventos\/(?:pasados\/)?[^/]+\/$/.test(path) ||
          /^\/en\/events\/(?:past\/)?[^/]+\/$/.test(path)),
    );

  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Sitemap: https:\/\/fak-kendo\.org\/sitemap\.xml$/m);
  for (const path of eventPaths) {
    assert.match(
      robots,
      new RegExp(`^Allow: ${path.replaceAll("/", "\\/")}$`, "m"),
    );
  }
});

test("the observer returns false and alarms for an invalid file", () => {
  const invalid = `# Sitio\n\nResumen sin bloque.\n\n## Páginas\n\n- [Calendario](https://example.org/calendario/)`;
  const result = validateLlmsTxt(invalid, fixturePaths);

  assert.equal(result.compliant, false);
  assert.ok(result.alarms.length >= 3);
  assert.ok(result.alarms.some((alarm) => alarm.includes("bloque Markdown")));
  assert.ok(result.alarms.some((alarm) => alarm.includes("ruta heredada")));
  assert.ok(result.alarms.some((alarm) => alarm.includes("descripción")));
});
