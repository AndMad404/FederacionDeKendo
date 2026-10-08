import assert from "node:assert/strict";
import test from "node:test";

import {
  CALENDAR_EVENTS,
  getRouteManifest,
  getRouteSeoPayload,
} from "../../dist-ssr/entry-server.js";
import { readDist } from "../helpers/generated-output-fixtures.mjs";

test("keeps the sitemap synchronized with indexable generated routes only", async () => {
  const sitemap = await readDist("sitemap.xml");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, url]) => url,
  );
  const routeUrls = getRouteManifest()
    .map((route) => getRouteSeoPayload(route))
    .filter((seo) => seo.robots === "index, follow")
    .map((seo) => seo.canonicalUrl);

  assert.deepEqual(sitemapUrls, routeUrls);
});

test("publishes only defensible event lastmod values in the sitemap", async () => {
  const sitemap = await readDist("sitemap.xml");
  const home = await readDist("index.html");
  const prerenderedAt = home.match(
    /<meta name="app-prerendered-at" content="([^"]+)" \/>/,
  )?.[1];

  assert.ok(prerenderedAt);

  const urlBlocks = new Map(
    [...sitemap.matchAll(/<url>\s*([\s\S]*?)\s*<\/url>/g)].map(([, block]) => {
      const location = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
      return [location, block];
    }),
  );

  const homeBlock = urlBlocks.get("https://fak-kendo.org/");
  assert.ok(homeBlock);
  assert.doesNotMatch(homeBlock, /<lastmod>/);
  assert.doesNotMatch(
    sitemap,
    new RegExp(`<lastmod>${prerenderedAt}<\\/lastmod>`),
  );

  const bilingualLastmods = new Map();

  for (const route of getRouteManifest().filter(
    (candidate) => candidate.component === "event",
  )) {
    const event = CALENDAR_EVENTS.find(
      (candidate) => candidate.id === route.eventId,
    );
    assert.ok(event, route.path);

    const isPast =
      route.path.includes("/eventos/pasados/") ||
      route.path.includes("/en/events/past/");
    const candidates = (
      isPast
        ? [event.sourceUpdatedAt, event.archiveEligibleAt]
        : [event.sourceUpdatedAt]
    )
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .filter((value) => Number.isFinite(value));
    const expected = candidates.length
      ? new Date(Math.max(...candidates)).toISOString()
      : undefined;

    const seo = getRouteSeoPayload(route);
    const block = urlBlocks.get(seo.canonicalUrl);
    assert.ok(block, route.path);

    const actual = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    assert.equal(actual, expected, route.path);

    const values = bilingualLastmods.get(event.id) ?? [];
    values.push(actual);
    bilingualLastmods.set(event.id, values);
  }

  for (const values of bilingualLastmods.values()) {
    if (values.length > 1) {
      assert.equal(new Set(values).size, 1);
    }
  }
});

test("indexes every published route", () => {
  for (const route of getRouteManifest()) {
    assert.equal(getRouteSeoPayload(route).robots, "index, follow", route.path);
  }
});

test("publishes sitemap images for approved routes", async () => {
  const sitemap = await readDist("sitemap.xml");
  const sitemapImageUrls = [
    ...sitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/g),
  ].map(([, url]) => url);

  assert.ok(sitemapImageUrls.length > 0);
  assert.ok(
    sitemapImageUrls.includes(
      "https://fak-kendo.org/images/hero/kendo-hero-formacion-960.webp?v=20260704-0120",
    ),
  );
});

test("indexes the Spanish archive", async () => {
  const pastEvents = await readDist("eventos/pasados/index.html");
  assert.match(pastEvents, /name="robots" content="index, follow"/);
  assert.match(pastEvents, /application\/ld\+json/);
});
