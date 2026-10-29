import assert from "node:assert/strict";
import { readFile, stat, readdir } from "node:fs/promises";
import test from "node:test";

test("publishes only WebP content images", async () => {
  const files = await readdir("public/images", {
    recursive: true,
    withFileTypes: true,
  });
  for (const file of files)
    if (
      file.isFile() &&
      !file.parentPath.replaceAll("\\", "/").endsWith("/logo")
    )
      assert.ok(file.name.endsWith(".webp"), file.name);
  const hero = await readFile("src/app/components/HeroSection.tsx", "utf8");
  assert.doesNotMatch(hero, /avif/);
  assert.match(hero, /type="image\/webp"/);
  for (const width of [480, 960, 1500]) {
    assert.ok(
      (await stat(`public/images/hero/kendo-hero-formacion-${width}.webp`))
        .size > 0,
    );
  }
});

test("preloads the WebP hero consistently in route metadata and headers", async () => {
  const seo = JSON.parse(
    await readFile("src/app/config/seo-data.json", "utf8"),
  );
  const headers = await readFile("public/_headers", "utf8");
  for (const route of ["/", "/en/"]) {
    assert.equal(seo.routes[route].preloadImage.type, "image/webp");
    assert.equal(
      seo.routes[route].preloadImage.href,
      "/images/hero/kendo-hero-formacion-960.webp?v=20260704-0120",
    );
  }
  assert.doesNotMatch(headers, /avif/);
  assert.match(headers, /type=image\/webp/);
  for (const width of [480, 960, 1500])
    assert.ok(headers.includes(`${width}.webp?v=20260704-0120`));
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
