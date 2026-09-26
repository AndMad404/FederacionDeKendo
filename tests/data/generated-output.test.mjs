import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CALENDAR_EVENTS,
  getEventRedirects,
  getEventTranslationStatus,
  getRouteManifest,
  getRouteSeoPayload,
} from "../../dist-ssr/entry-server.js";

const PANAMA_LEGACY_SLUG = "2026-11-21-panama-torneo-por-equipos";

function getPanamaEvent() {
  const event = CALENDAR_EVENTS.find(({ aliases }) =>
    aliases?.includes(PANAMA_LEGACY_SLUG),
  );
  assert.ok(event, "Panama event must retain its original URL as an alias");
  return event;
}

async function readDist(relativePath) {
  return readFile(
    new URL(`../../dist/${relativePath}`, import.meta.url),
    "utf8",
  );
}

async function describeTranslation(eventId) {
  const event = CALENDAR_EVENTS.find(({ id }) => id === eventId);
  const translations = JSON.parse(
    await readFile(
      new URL("../../src/app/data/eventTranslations.json", import.meta.url),
      "utf8",
    ),
  );

  return JSON.stringify({
    status: event ? getEventTranslationStatus(event) : "event-missing",
    calendar: { title: event?.title, summary: event?.summary },
    translationSource: translations[eventId]?.source,
  });
}

test("generates historical event routes with canonical and indexable metadata", async () => {
  const complete = await readDist(
    "eventos/pasados/2026-08-08-examen/index.html",
  );
  const incomplete = await readDist(
    "eventos/pasados/2026-05-30-seminario/index.html",
  );

  assert.match(complete, /<h1[^>]*>Examen<\/h1>/);
  assert.match(complete, /name="robots" content="index, follow"/);
  assert.match(
    complete,
    /rel="canonical" href="https:\/\/fak-kendo\.org\/eventos\/pasados\/2026-08-08-examen\/"/,
  );
  assert.match(complete, /application\/ld\+json/);
  assert.match(incomplete, /<h1[^>]*>CLAK Seminario Instructores CHILE<\/h1>/);
  assert.match(incomplete, /name="robots" content="index, follow"/);
  assert.match(incomplete, /application\/ld\+json/);
});

test("publishes Event JSON-LD only when the required physical location is known", () => {
  const organizationId = "https://fak-kendo.org/#organization";
  const eventRoutes = getRouteManifest().filter(
    (route) => route.component === "event",
  );

  for (const route of eventRoutes) {
    const event = CALENDAR_EVENTS.find(
      (candidate) => candidate.id === route.eventId,
    );
    const graph = getRouteSeoPayload(route).structuredData?.["@graph"];
    const structuredEvent = Array.isArray(graph)
      ? graph.find((entity) => entity?.["@type"] === "Event")
      : undefined;

    assert.ok(event, `${route.path}: calendar event is missing`);

    if (!event.location?.trim()) {
      assert.equal(
        structuredEvent,
        undefined,
        `${route.path}: incomplete Event JSON-LD must be omitted`,
      );
      continue;
    }

    const external = /(?:^|\s)#EventoExterno\b/iu.test(event?.summary ?? "");

    assert.ok(structuredEvent, `${route.path}: Event JSON-LD is missing`);
    assert.equal(structuredEvent.location?.["@type"], "Place");
    assert.equal(
      structuredEvent.location?.address?.streetAddress,
      event.location.trim(),
    );
    assert.ok(structuredEvent.endDate, `${route.path}: endDate is missing`);
    assert.deepEqual(
      structuredEvent.organizer,
      external ? undefined : { "@id": organizationId },
      `${route.path}: unexpected organizer`,
    );
  }
});

test("generates localized, unique, indexable SEO output for every event route", async () => {
  const routeManifest = getRouteManifest();
  const eventRoutes = routeManifest.filter(
    (route) => route.component === "event",
  );

  assert.equal(
    new Set(eventRoutes.map((route) => route.path)).size,
    eventRoutes.length,
    "canonical event paths, including vanity paths, must be unique",
  );

  for (const route of eventRoutes) {
    const html = await readDist(`${route.path.slice(1)}index.html`);
    const seo = getRouteSeoPayload(route);
    const spanishPath =
      route.language === "es" ? route.path : route.alternatePath;
    const englishPath =
      route.language === "en" ? route.path : route.alternatePath;

    assert.equal(seo.robots, "index, follow");
    assert.ok(seo.canonicalUrl);
    assert.ok(html.includes(`<title>${seo.title}</title>`));
    assert.ok(html.includes(`name="description" content="${seo.description}"`));
    assert.ok(seo.description.length <= 155);
    assert.doesNotMatch(seo.description, /\s{2,}|\*\s*$/);
    assert.ok(html.includes('name="robots" content="index, follow"'));
    assert.ok(html.includes(`rel="canonical" href="${seo.canonicalUrl}"`));
    assert.ok(html.includes(`property="og:url" content="${seo.canonicalUrl}"`));
    assert.ok(
      html.includes(
        `hreflang="es-CR" href="https://fak-kendo.org${spanishPath}"`,
      ),
    );
    if (englishPath) {
      assert.ok(
        html.includes(
          `hreflang="en" href="https://fak-kendo.org${englishPath}"`,
        ),
      );
    } else {
      assert.doesNotMatch(html, /hreflang="en"/);
    }
    assert.match(html, /application\/ld\+json/);
  }

  for (const language of ["es", "en"]) {
    const titles = eventRoutes
      .filter((route) => route.language === language)
      .map((route) => getRouteSeoPayload(route).title);
    assert.equal(new Set(titles).size, titles.length);
  }

  const expectedStaticTitles = new Map([
    ["/", "Federación de Asociaciones de Kendo | Costa Rica"],
    ["/eventos/", "Eventos de Kendo en Costa Rica"],
    ["/galeria/", "Galería de Kendo | Costa Rica"],
    ["/afiliados/", "Dojos de Kendo en Costa Rica"],
    ["/eventos/pasados/", "Eventos pasados de Kendo | Costa Rica"],
    ["/en/", "Federation of Kendo Associations | Costa Rica"],
    ["/en/events/", "Kendo Events in Costa Rica"],
    ["/en/gallery/", "Kendo Gallery | Costa Rica"],
    ["/en/affiliates/", "Kendo Dojos in Costa Rica"],
    ["/en/events/past/", "Past Kendo Events | Costa Rica"],
  ]);

  for (const [path, expectedTitle] of expectedStaticTitles) {
    const route = routeManifest.find((candidate) => candidate.path === path);
    assert.equal(route?.title, expectedTitle, path);
  }

  const expectedEventTitles = new Map([
    ["2026-08-08-examen:es", "Examen de Kendo — 8 ago 2026 | Costa Rica"],
    [
      "2026-09-12-gasshuku-monteverde:es",
      "Gasshuku Monteverde — 12 sept 2026 | Costa Rica",
    ],
    ["2026-08-22-3er-torneo:es", "3er Torneo de Kendo — 22 ago 2026"],
    [
      "2026-05-29-clak-seminario-instructores-chile:es",
      "CLAK Seminario Instructores CHILE — 29 may 2026",
    ],
    [
      "2026-05-29-clak-seminario-instructores-chile:en",
      "CLAK Seminario Instructores CHILE — May 29, 2026",
    ],
    ["2026-08-08-examen:en", "Kendo Examination — Aug 8, 2026 | Costa Rica"],
  ]);

  for (const [key, expectedTitle] of expectedEventTitles) {
    const [eventId, language] = key.split(":");
    const route = eventRoutes.find(
      (candidate) =>
        candidate.eventId === eventId && candidate.language === language,
    );
    assert.equal(route?.title, expectedTitle, key);
    assert.match(
      route?.path ?? "",
      /\/(?:eventos\/pasados|en\/events\/past)\//,
      key,
    );
  }

  const panamaEventId = getPanamaEvent().id;
  const expectedPanamaRoutes = new Map([
    [
      "es",
      {
        path: `/eventos/${panamaEventId}/`,
        title: "PANAMA 5ta Copa Shogun — 21 nov 2026",
      },
    ],
    [
      "en",
      {
        path: `/en/events/${panamaEventId}/`,
        title: "PANAMA 5ta Copa Shogun — Nov 21, 2026",
      },
    ],
  ]);
  for (const [language, expected] of expectedPanamaRoutes) {
    const route = eventRoutes.find(
      (candidate) =>
        candidate.eventId === panamaEventId && candidate.language === language,
    );
    assert.equal(
      route?.path,
      expected.path,
      `${language}: ${await describeTranslation(panamaEventId)}`,
    );
    assert.equal(route?.title, expected.title, language);
  }

  const archivePageTwoTitles = routeManifest
    .filter(
      (route) => route.component === "pastEvents" && route.archivePage === 2,
    )
    .map((route) => route.title);
  assert.deepEqual(archivePageTwoTitles, [
    "Eventos pasados de Kendo — página 2 | Costa Rica",
    "Past Kendo Events — page 2 | Costa Rica",
  ]);

  for (const route of routeManifest) {
    assert.ok(route.title.length <= 60, `${route.path}: ${route.title}`);
  }
});

test("indexes all public routes, events, and archives in the sitemap", async () => {
  const sitemap = await readDist("sitemap.xml");
  const home = await readDist("index.html");
  const calendar = await readDist("eventos/index.html");
  assert.match(sitemap, /<loc>https:\/\/fak-kendo\.org\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/fak-kendo\.org\/eventos\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/fak-kendo\.org\/en\/<\/loc>/);
  assert.match(
    sitemap,
    /<loc>https:\/\/fak-kendo\.org\/eventos\/pasados\/<\/loc>/,
  );
  assert.match(
    sitemap,
    /<loc>https:\/\/fak-kendo\.org\/eventos\/pasados\/2026-08-08-examen\/<\/loc>/,
  );
  assert.match(home, /name="robots" content="index, follow"/);
  assert.match(calendar, /name="robots" content="index, follow"/);
  assert.match(home, /rel="canonical" href="https:\/\/fak-kendo\.org\/"/);
  assert.match(home, /application\/ld\+json/);
  assert.match(calendar, /application\/ld\+json/);
});

test("uses the JPEG social card in generated Open Graph metadata", async () => {
  const gallery = await readDist("galeria/index.html");

  assert.match(gallery, /<html lang="es" prefix="og: https:\/\/ogp\.me\/ns#">/);
  assert.match(
    gallery,
    /property="og:image" content="https:\/\/fak-kendo\.org\/images\/social\/kendo-social-card-20260921\.jpg"/,
  );
  assert.match(gallery, /property="og:image:type" content="image\/jpeg"/);
  assert.match(gallery, /name="twitter:card" content="summary_large_image"/);
});

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

test("keeps every generated public route indexable", () => {
  const nonIndexableRoutes = getRouteManifest()
    .filter((route) => getRouteSeoPayload(route).robots !== "index, follow")
    .map((route) => route.path);

  assert.deepEqual(nonIndexableRoutes, []);
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

  const home = await readDist("index.html");
  const calendar = await readDist("eventos/index.html");
  for (const html of [home, calendar]) {
    assert.match(
      html,
      /og:image" content="https:\/\/fak-kendo\.org\/images\/social\/kendo-social-card-20260921\.jpg"/,
    );
    assert.match(html, /og:image:type" content="image\/jpeg"/);
    assert.match(html, /og:image:width" content="1200"/);
    assert.match(html, /og:image:height" content="630"/);
  }
});

test("keeps both calendar archive views indexable with structured data", async () => {
  const pastEvents = await readDist("eventos/pasados/index.html");
  const englishPastEvents = await readDist("en/events/past/index.html");

  for (const html of [pastEvents, englishPastEvents]) {
    assert.match(html, /name="robots" content="index, follow"/);
    assert.match(html, /application\/ld\+json/);
  }
});

test("generates the archive route", async () => {
  const archive = await readDist("eventos/pasados/index.html");
  assert.match(archive, /Eventos pasados/);
  assert.match(archive, /href="\/eventos\/pasados\/2026-08-08-examen\/"/);
});

test("redirects legacy calendar and archived event URLs to their canonical routes", async () => {
  const redirects = await readDist("_redirects");
  const configuredRedirects = getEventRedirects();
  const panamaEventId = getPanamaEvent().id;
  const panamaRoutes = new Map(
    getRouteManifest()
      .filter(
        (route) =>
          route.component === "event" && route.eventId === panamaEventId,
      )
      .map((route) => [route.language, route.path]),
  );

  assert.ok(
    configuredRedirects.some(
      ({ from, to }) => from === "/calendario/" && to === "/eventos/",
    ),
  );
  assert.match(redirects, /^\/calendario\/ \/eventos\/ 301$/m);
  assert.match(
    redirects,
    /^\/eventos\/2026-08-08-examen\/ \/eventos\/pasados\/2026-08-08-examen\/ 301$/m,
  );
  assert.ok(
    redirects
      .split("\n")
      .includes(
        `/eventos/${PANAMA_LEGACY_SLUG}/ ${panamaRoutes.get("es")} 301`,
      ),
  );
  assert.ok(
    redirects
      .split("\n")
      .includes(
        `/en/events/${PANAMA_LEGACY_SLUG}/ ${panamaRoutes.get("en")} 301`,
      ),
  );
  assert.match(
    redirects,
    /^\/eventos\/2026-05-29-clak-seminario-instructores-chile\/ \/eventos\/pasados\/2026-05-30-seminario\/ 301$/m,
  );
  assert.match(
    redirects,
    /^\/eventos\/pasados\/2026-05-29-clak-seminario-instructores-chile\/ \/eventos\/pasados\/2026-05-30-seminario\/ 301$/m,
  );
  assert.match(
    redirects,
    /^\/en\/events\/2026-05-29-clak-seminario-instructores-chile\/ \/en\/events\/past\/2026-05-30-seminario\/ 301$/m,
  );
  assert.match(
    redirects,
    /^\/en\/events\/past\/2026-05-29-clak-seminario-instructores-chile\/ \/en\/events\/past\/2026-05-30-seminario\/ 301$/m,
  );
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

test("omits breadcrumbs from event and archive routes", async () => {
  const pastEvent = await readDist(
    "eventos/pasados/2026-08-08-examen/index.html",
  );
  const englishPastEvent = await readDist(
    "en/events/past/2026-08-08-examen/index.html",
  );
  const archivePageTwo = await readDist("eventos/pasados/pagina/2/index.html");

  for (const html of [pastEvent, englishPastEvent, archivePageTwo]) {
    assert.doesNotMatch(html, /aria-label="Migas de navegación"/);
    assert.doesNotMatch(html, /aria-label="Breadcrumb"/);
    assert.doesNotMatch(html, /"@type":"BreadcrumbList"/);
    assert.doesNotMatch(html, /#breadcrumb/);
  }
});
test("shares one deterministic prerender timestamp across generated routes", async () => {
  const home = await readDist("index.html");
  const archive = await readDist("eventos/pasados/index.html");
  const timestampPattern =
    /<meta name="app-prerendered-at" content="([^"]+)" \/>/;
  const homeTimestamp = home.match(timestampPattern)?.[1];
  const archiveTimestamp = archive.match(timestampPattern)?.[1];

  assert.ok(homeTimestamp);
  assert.equal(archiveTimestamp, homeTimestamp);
  assert.equal(new Date(homeTimestamp).toISOString(), homeTimestamp);
});

test("generates localized English routes with reciprocal language metadata", async () => {
  const home = await readDist("en/index.html");
  const event = await readDist("en/events/past/2026-08-08-examen/index.html");
  const sitemap = await readDist("sitemap.xml");

  assert.match(home, /<html lang="en" prefix="og: https:\/\/ogp\.me\/ns#">/);
  assert.match(home, />Home<\/a>/);
  assert.match(home, /href="\/en\/events\/"/);
  assert.match(
    home,
    /rel="alternate" hreflang="es-CR" href="https:\/\/fak-kendo\.org\/"/,
  );
  assert.match(
    home,
    /rel="alternate" hreflang="en" href="https:\/\/fak-kendo\.org\/en\/"/,
  );
  assert.match(event, /<h1[^>]*>Examination<\/h1>/);
  assert.match(event, /Examinations from 8th to 2nd kyu/);
  assert.match(sitemap, /<loc>https:\/\/fak-kendo\.org\/en\/<\/loc>/);
});

test("publishes every event route in both Spanish and English", async () => {
  const { CALENDAR_EVENTS } = await import("../../dist-ssr/entry-server.js");
  const spanishEventRoutes = getRouteManifest()
    .filter((route) => route.component === "event" && route.language === "es")
    .map((route) => route.eventId)
    .sort();
  const englishEventRoutes = getRouteManifest()
    .filter((route) => route.component === "event" && route.language === "en")
    .map((route) => route.eventId)
    .sort();
  const eventIds = CALENDAR_EVENTS.map((event) => event.id).sort();

  assert.deepEqual(spanishEventRoutes, eventIds);
  assert.deepEqual(englishEventRoutes, eventIds);
});
