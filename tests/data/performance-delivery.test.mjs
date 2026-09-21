import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const AVIF_VARIANTS = [
  [480, "44c635faf6d3"],
  [960, "72e40d00f3ff"],
  [1500, "6d56fed2e5fb"],
];

test("serves a materially smaller AVIF hero with a WebP fallback", async () => {
  const hero = await readFile("src/app/components/HeroSection.tsx", "utf8");

  assert.match(hero, /type="image\/avif"/);
  assert.match(hero, /type="image\/webp"/);

  for (const [width, version] of AVIF_VARIANTS) {
    const avifPath = `public/images/hero/kendo-hero-formacion-${width}.avif`;
    const webpPath = `public/images/hero/kendo-hero-formacion-${width}.webp`;
    const [avif, webp] = await Promise.all([stat(avifPath), stat(webpPath)]);

    assert.ok(
      avif.size < webp.size * 0.75,
      `${avifPath} should save at least 25% over its WebP fallback`,
    );
    assert.match(hero, new RegExp(`${width}\\.avif\\?v=${version}`));
  }
});

test("preloads the AVIF hero consistently in route metadata and headers", async () => {
  const [seoSource, headers] = await Promise.all([
    readFile("src/app/config/seo-data.json", "utf8"),
    readFile("public/_headers", "utf8"),
  ]);
  const seo = JSON.parse(seoSource);

  for (const route of ["/", "/en/"]) {
    assert.equal(seo.routes[route].preloadImage.type, "image/avif");
    assert.equal(
      seo.routes[route].preloadImage.href,
      "/images/hero/kendo-hero-formacion-960.avif?v=72e40d00f3ff",
    );
  }

  assert.match(headers, /type=image\/avif/);
  for (const [width, version] of AVIF_VARIANTS) {
    assert.match(headers, new RegExp(`${width}\\.avif\\?v=${version}`));
  }
});

test("publishes long-lived cache policies for static delivery", async () => {
  const headers = await readFile("public/_headers", "utf8");

  assert.match(
    headers,
    /\/assets\/\*\s+Cache-Control: public, max-age=31536000, immutable/,
  );
  assert.match(
    headers,
    /\/fonts\/\*\s+Cache-Control: public, max-age=31536000, immutable/,
  );
  assert.match(
    headers,
    /\/images\/\*\s+Cache-Control: public, max-age=2592000, stale-while-revalidate=86400/,
  );
});
