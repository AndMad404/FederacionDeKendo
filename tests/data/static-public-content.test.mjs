import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) => readFile(file, "utf8");

test("every configured static route has complete public metadata", async () => {
  const seo = JSON.parse(await read("src/app/config/seo-data.json"));
  assert.ok(seo.siteUrl && seo.siteName && seo.defaultDescription);
  assert.ok(seo.logo && seo.defaultImage && seo.defaultImageAlt);
  assert.ok(Object.keys(seo.routes).length > 0);
  for (const [path, route] of Object.entries(seo.routes)) {
    assert.equal(route.path, path, path);
    for (const field of [
      "language",
      "locale",
      "alternatePath",
      "component",
      "title",
      "description",
      "image",
      "imageAlt",
      "imageType",
      "schemaType",
    ]) {
      assert.ok(route[field], `${path} is missing ${field}`);
    }
    assert.ok(Number.isInteger(route.imageWidth) && route.imageWidth > 0, path);
    assert.ok(
      Number.isInteger(route.imageHeight) && route.imageHeight > 0,
      path,
    );
  }
});

test("Spanish and English localized copy inventories expose the same keys", async () => {
  const source = await read("src/app/config/i18n.ts");
  const spanish = source.slice(
    source.indexOf("  es: {"),
    source.indexOf("  en: {"),
  );
  const english = source.slice(
    source.indexOf("  en: {"),
    source.indexOf("} as const;"),
  );
  const keys = (block) =>
    [...block.matchAll(/^ {4}([A-Za-z][A-Za-z0-9]*):/gm)].map(([, key]) => key);
  assert.ok(keys(spanish).length > 0);
  assert.deepEqual(keys(english), keys(spanish));
});

test("every approved dojo record retains required contact and schedule fields", async () => {
  const source = await read("src/app/data/dojos.ts");
  const inventory = source.slice(
    source.indexOf("const DOJOS"),
    source.indexOf("export function"),
  );
  const dojoCount = [...inventory.matchAll(/^ {4}title: /gm)].length;
  assert.ok(dojoCount > 0);
  assert.equal([...inventory.matchAll(/^ {4}info: \[/gm)].length, dojoCount);
  assert.equal(
    [...inventory.matchAll(/^ {4}schedule: \[/gm)].length,
    dojoCount,
  );
  for (const field of ["icon", "label", "value", "href"]) {
    assert.ok(new RegExp(`^        ${field}: `, "m").test(inventory), field);
  }
  for (const field of ["location", "days", "hours"]) {
    assert.ok(new RegExp(`^        ${field}: `, "m").test(inventory), field);
  }
});

test("every editorial gallery record has valid required fields in both languages", async () => {
  const source = await read("src/app/data/gallery.ts");
  const spanish = source.slice(
    source.indexOf("export const GALLERY_IMAGES"),
    source.indexOf("const ENGLISH_GALLERY_COPY"),
  );
  const english = source.slice(
    source.indexOf("const ENGLISH_GALLERY_COPY"),
    source.indexOf("export function"),
  );
  const ids = [...spanish.matchAll(/^ {4}id: (\d+),$/gm)].map(([, id]) => id);
  assert.ok(ids.length > 0);
  assert.equal(new Set(ids).size, ids.length);
  for (const field of [
    "src",
    "srcSet",
    "sizes",
    "width",
    "height",
    "thumbnailSrc",
    "thumbnailSrcSet",
    "thumbnailWidth",
    "thumbnailHeight",
    "title",
    "alt",
    "tag",
    "description",
  ]) {
    assert.equal(
      [...spanish.matchAll(new RegExp(`^    ${field}:`, "gm"))].length,
      ids.length,
      field,
    );
  }
  for (const id of ids) {
    assert.match(
      english,
      new RegExp(`^  ${id}: \\{`, "m"),
      `English gallery item ${id}`,
    );
  }
  for (const field of ["title", "alt", "tag", "description"]) {
    assert.equal(
      [...english.matchAll(new RegExp(`^    ${field}:`, "gm"))].length,
      ids.length,
      field,
    );
  }
});
