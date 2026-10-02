import assert from "node:assert/strict";
import test from "node:test";

import {
  CALENDAR_EVENTS,
  getEventRedirects,
  getRouteManifest,
} from "../../dist-ssr/entry-server.js";
import {
  readDist,
  getPanamaEvent,
  PANAMA_LEGACY_SLUG,
} from "../helpers/generated-output-fixtures.mjs";

test("redirects legacy calendar and archived event URLs to their canonical routes", async () => {
  const generated = new Set((await readDist("_redirects")).split(/\r?\n/));
  const configured = new Map(
    getEventRedirects().map(({ from, to }) => [from, to]),
  );
  const panamaId = getPanamaEvent().id;
  const panamaPath = getRouteManifest().find(
    (route) =>
      route.component === "event" &&
      route.eventId === panamaId &&
      route.language === "es",
  )?.path;
  assert.ok(panamaPath);
  const chilePath = "/eventos/pasados/clak-seminario-instructores-chile/";
  const chileSlug = "2026-05-29-clak-seminario-instructores-chile";
  const expected = [
    ["/calendario/", "/eventos/"],
    ["/eventos/pasados/page/2/", "/eventos/pasados/pagina/2/"],
    ["/en/events/past/pagina/2/", "/en/events/past/page/2/"],
    ["/eventos/2026-08-08-examen/", "/eventos/pasados/2do-examen-2026/"],
    ["/eventos/pasados/2026-05-30-seminario/", chilePath],
    [`/eventos/${PANAMA_LEGACY_SLUG}/`, panamaPath],
    [`/en/events/${PANAMA_LEGACY_SLUG}/`, panamaPath],
    [`/eventos/${chileSlug}/`, chilePath],
    [`/eventos/pasados/${chileSlug}/`, chilePath],
    [`/en/events/${chileSlug}/`, chilePath],
    [`/en/events/past/${chileSlug}/`, chilePath],
  ];
  for (const [from, to] of expected) {
    assert.equal(configured.get(from), to, `${from}: configured destination`);
    assert.ok(
      generated.has(`${from} ${to} 301`),
      `${from}: generated redirect`,
    );
  }
});

test("redirects every previous event URL to its current URL in each published language", async () => {
  const redirects = await readDist("_redirects");
  const redirectLines = new Set(redirects.split(/\r?\n/).filter(Boolean));
  const redirectSources = new Set(
    [...redirectLines].map((line) => line.split(" ")[0]),
  );
  const eventRoutes = getRouteManifest().filter(
    (route) => route.component === "event",
  );
  const configuredRedirects = getEventRedirects();
  const configuredSources = new Set(
    configuredRedirects.map(({ from }) => from),
  );
  const renamedEvents = CALENDAR_EVENTS.filter(
    ({ aliases }) => aliases?.length,
  );

  assert.ok(renamedEvents.length > 0);
  assert.equal(configuredSources.size, configuredRedirects.length);
  for (const { from, to } of configuredRedirects) {
    assert.notEqual(from, to, `${from} must not redirect to itself`);
    assert.equal(
      configuredSources.has(to),
      false,
      `${from} must redirect directly to the final canonical URL`,
    );
  }

  for (const event of renamedEvents) {
    const routes = eventRoutes.filter((route) => route.eventId === event.id);
    assert.ok(
      routes.some((route) => route.language === "es"),
      `${event.id}: missing Spanish route`,
    );

    for (const route of routes) {
      const [current, past] =
        route.language === "en"
          ? ["/en/events/", "/en/events/past/"]
          : ["/eventos/", "/eventos/pasados/"];
      const prefixes = route.path.startsWith(past)
        ? [current, past]
        : [current];

      for (const slug of [event.id, ...event.aliases]) {
        for (const prefix of prefixes) {
          const from = `${prefix}${slug}/`;
          if (from === route.path) continue;
          assert.ok(
            redirectLines.has(`${from} ${route.path} 301`),
            `${from} must redirect to ${route.path}`,
          );
        }
      }

      assert.equal(
        redirectSources.has(route.path),
        false,
        `${route.path} must not redirect elsewhere`,
      );
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
