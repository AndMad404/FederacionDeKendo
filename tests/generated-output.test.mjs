import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readDist(relativePath) {
  return readFile(new URL(`../dist/${relativePath}`, import.meta.url), "utf8");
}

test("generates event HTML with canonical, noindex and valid conditional Event JSON-LD", async () => {
  const complete = await readDist("eventos/2026-08-08-examen/index.html");
  const incomplete = await readDist(
    "eventos/2026-10-10-clak-1er-panamericano-brasil/index.html",
  );

  assert.match(complete, /<h1[^>]*>Examen<\/h1>/);
  assert.match(complete, /name="robots" content="noindex, nofollow"/);
  assert.match(
    complete,
    /rel="canonical" href="https:\/\/fak-kendo\.pages\.dev\/eventos\/2026-08-08-examen\/"/,
  );
  assert.match(complete, /"@type":"Event"/);
  assert.doesNotMatch(incomplete, /"@type":"Event"/);
});

test("keeps every generated route noindex and sitemap-free while indexing is disabled", async () => {
  const sitemap = await readDist("sitemap.xml");
  const home = await readDist("index.html");
  const calendar = await readDist("calendario/index.html");
  assert.doesNotMatch(sitemap, /\/eventos\//);
  assert.doesNotMatch(sitemap, /<loc>/);
  assert.match(home, /name="robots" content="noindex, nofollow"/);
  assert.match(calendar, /name="robots" content="noindex, nofollow"/);
  assert.match(home, /rel="canonical" href="https:\/\/fak-kendo\.pages\.dev\/"/);
  assert.match(home, /application\/ld\+json/);
});

test("generates the archive route", async () => {
  const archive = await readDist("eventos/pasados/index.html");
  assert.match(archive, /Eventos pasados/);
  assert.match(archive, /Página (?:<!-- -->)?1(?:<!-- -->)? de (?:<!-- -->)?1/);
});

test("generates localized English routes with reciprocal language metadata", async () => {
  const home = await readDist("en/index.html");
  const event = await readDist("en/events/2026-08-08-examen/index.html");
  const sitemap = await readDist("sitemap.xml");

  assert.match(home, /<html lang="en">/);
  assert.match(home, />Home<\/a>/);
  assert.match(home, /href="\/en\/calendar\/"/);
  assert.match(
    home,
    /rel="alternate" hreflang="es-CR" href="https:\/\/fak-kendo\.pages\.dev\/"/,
  );
  assert.match(
    home,
    /rel="alternate" hreflang="en" href="https:\/\/fak-kendo\.pages\.dev\/en\/"/,
  );
  assert.match(event, /<h1[^>]*>Examination<\/h1>/);
  assert.match(event, /Examinations from 8th to 2nd kyu/);
  assert.doesNotMatch(sitemap, /<loc>/);
});
