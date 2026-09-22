import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import {
  closeSourceModuleLoader,
  loadSourceModule,
} from "../helpers/load-source-module.mjs";

test.after(async () => closeSourceModuleLoader());

const read = (file) => readFile(file, "utf8");

test("the configured default social card exists", async () => {
  const seo = JSON.parse(await read("src/app/config/seo-data.json"));
  await access(`public${seo.defaultImage}`);
});

test("every configured static route has complete public metadata", async () => {
  const seo = JSON.parse(await read("src/app/config/seo-data.json"));
  assert.equal(seo.siteUrl, "https://fak-kendo.org");
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

  for (const path of [
    "/",
    "/eventos/",
    "/galeria/",
    "/afiliados/",
    "/en/",
    "/en/events/",
    "/en/gallery/",
    "/en/affiliates/",
  ]) {
    assert.equal(seo.routes[path].indexable, true, path);
  }
});

test("Spanish and English localized copy inventories expose the same sections", async () => {
  const { COPY } = await loadSourceModule("/src/app/config/i18n.ts");
  assert.ok(Object.keys(COPY.es).length > 0);
  assert.deepEqual(Object.keys(COPY.en), Object.keys(COPY.es));
  assert.equal(
    COPY.es.common.toBeConfirmed,
    "Ubicación pendiente de confirmar",
  );
  assert.equal(COPY.en.common.toBeConfirmed, "Location to be confirmed");
});

test("every approved dojo record retains required contact and schedule fields", async () => {
  const { getDojos } = await loadSourceModule("/src/app/data/dojos.ts");
  for (const language of ["es", "en"]) {
    const dojos = getDojos(language);
    assert.ok(dojos.length > 0, language);
    for (const dojo of dojos) {
      assert.ok(dojo.title, `${language}: dojo title`);
      assert.ok(dojo.info.length > 0, `${language}: ${dojo.title} contacts`);
      assert.ok(
        dojo.schedule.length > 0,
        `${language}: ${dojo.title} schedule`,
      );
      for (const item of dojo.info) {
        for (const field of ["icon", "label", "value", "href"]) {
          assert.ok(item[field], `${language}: ${dojo.title} ${field}`);
        }
      }
      for (const slot of dojo.schedule) {
        for (const field of ["location", "days", "hours"]) {
          assert.ok(slot[field], `${language}: ${dojo.title} ${field}`);
        }
      }
    }
  }
});

test("every editorial gallery record has valid required fields in both languages", async () => {
  const { GALLERY_IMAGES, getGalleryImages } = await loadSourceModule(
    "/src/app/data/gallery.ts",
  );
  const ids = GALLERY_IMAGES.map(({ id }) => id);
  assert.ok(ids.length > 0);
  assert.equal(new Set(ids).size, ids.length);
  const requiredImageFields = [
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
  ];
  for (const language of ["es", "en"]) {
    const images = getGalleryImages(language);
    assert.deepEqual(
      images.map(({ id }) => id),
      ids,
      `${language}: gallery identity`,
    );
    for (const image of images) {
      for (const field of requiredImageFields) {
        assert.ok(image[field], `${language}: image ${image.id} ${field}`);
      }
    }
  }
});
