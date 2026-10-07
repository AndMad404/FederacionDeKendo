import assert from "node:assert/strict";
import test from "node:test";
import { getGeneratedEventPath } from "../helpers/generated-pages.ts";
import {
  CALENDAR_EVENTS,
  getEventRedirects,
  getRouteManifest,
} from "../../dist-ssr/entry-server.js";
import { readDist } from "../helpers/generated-output-fixtures.mjs";

test("redirects and browser selection use current canonical routes in both languages", async () => {
  const redirects = getEventRedirects();
  const destinations = new Map(redirects.map(({ from, to }) => [from, to]));
  const generated = new Set(
    (await readDist("_redirects")).split(/\r?\n/).filter(Boolean),
  );
  const routes = getRouteManifest().filter(
    (route) => route.component === "event",
  );

  assert.equal(
    destinations.size,
    redirects.length,
    "redirect sources must be unique",
  );
  assert.deepEqual(
    generated,
    new Set(redirects.map(({ from, to }) => `${from} ${to} 301`)),
  );
  for (const { from, to } of redirects) {
    assert.notEqual(from, to, `${from} must not redirect to itself`);
    assert.equal(
      destinations.has(to),
      false,
      `${from} must reach the final canonical URL`,
    );
  }

  for (const event of CALENDAR_EVENTS) {
    const spanish = routes.find(
      (route) => route.eventId === event.id && route.language === "es",
    );
    assert.ok(spanish, `${event.id}: missing Spanish route`);
    for (const language of ["es", "en"]) {
      const route =
        routes.find(
          (candidate) =>
            candidate.eventId === event.id && candidate.language === language,
        ) ?? spanish;
      const [current, past] =
        language === "en"
          ? ["/en/events/", "/en/events/past/"]
          : ["/eventos/", "/eventos/pasados/"];
      const archived = /\/(pasados|past)\//.test(route.path);
      assert.equal(
        destinations.has(route.path),
        false,
        `${route.path} must not redirect elsewhere`,
      );
      for (const slug of [event.id, ...(event.aliases ?? [])]) {
        assert.equal(
          getGeneratedEventPath(slug, language),
          route.path,
          `${language}/${slug}: browser canonical page`,
        );
        for (const prefix of archived ? [current, past] : [current]) {
          const from = `${prefix}${slug}/`;
          if (from !== route.path) {
            assert.equal(
              destinations.get(from),
              route.path,
              `${from}: canonical destination`,
            );
          }
        }
      }
    }
  }
});

test("uses only current event URLs in sitemap, internal links, canonical, and hreflang", async () => {
  const routeManifest = getRouteManifest();
  const eventRoutes = routeManifest.filter(
    (route) => route.component === "event",
  );
  const redirectSources = new Set(getEventRedirects().map(({ from }) => from));
  const sitemap = await readDist("sitemap.xml");
  const listingPaths = [
    "eventos/index.html",
    "en/events/index.html",
    ...routeManifest
      .filter((route) => route.component === "pastEvents")
      .map((route) => `${route.path.slice(1)}index.html`),
  ];
  const listingHtml = (
    await Promise.all(listingPaths.map((listingPath) => readDist(listingPath)))
  ).join("\n");
  const eventHtml = (
    await Promise.all(
      eventRoutes.map((route) => readDist(`${route.path.slice(1)}index.html`)),
    )
  ).join("\n");

  const canonicalEventPaths = new Set(eventRoutes.map((route) => route.path));
  const internalEventLinks = [
    ...listingHtml.matchAll(
      /href="(\/(?:eventos|en\/events)\/(?:pasados\/|past\/)?[^"/]+\/)"/g,
    ),
  ]
    .map(([, href]) => href)
    .filter(
      (href) => href !== "/eventos/pasados/" && href !== "/en/events/past/",
    );
  assert.ok(internalEventLinks.length > 0);
  for (const href of internalEventLinks) {
    assert.equal(
      canonicalEventPaths.has(href),
      true,
      `${href} must be a current canonical event link`,
    );
  }

  for (const source of redirectSources) {
    assert.equal(
      sitemap.includes(`<loc>https://fak-kendo.org${source}</loc>`),
      false,
      `${source} must not be in the sitemap`,
    );
    assert.equal(
      listingHtml.includes(`href="${source}"`),
      false,
      `${source} must not be an internal event link`,
    );
    assert.equal(
      eventHtml.includes(
        `rel="canonical" href="https://fak-kendo.org${source}"`,
      ),
      false,
      `${source} must not be canonical`,
    );
    assert.equal(
      eventHtml.includes(
        `hreflang="es-CR" href="https://fak-kendo.org${source}"`,
      ) ||
        eventHtml.includes(
          `hreflang="en" href="https://fak-kendo.org${source}"`,
        ),
      false,
      `${source} must not be published through hreflang`,
    );
  }
});
