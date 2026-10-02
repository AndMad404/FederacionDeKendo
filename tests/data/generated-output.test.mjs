import assert from "node:assert/strict";
import test from "node:test";

import {
  CALENDAR_EVENTS,
  getRouteManifest,
  getRouteSeoPayload,
} from "../../dist-ssr/entry-server.js";
import { readDist } from "../helpers/generated-output-fixtures.mjs";

test("renders complete and incomplete historical event headings", async () => {
  for (const [path, title] of [
    ["eventos/pasados/2do-examen-2026/index.html", "Examen"],
    [
      "eventos/pasados/clak-seminario-instructores-chile/index.html",
      "CLAK Seminario Instructores CHILE",
    ],
  ]) {
    assert.match(await readDist(path), new RegExp(`<h1[^>]*>${title}</h1>`));
  }
});

test("generates localized, unique, indexable SEO output for every event route", async (t) => {
  const routeManifest = getRouteManifest();
  const eventRoutes = routeManifest.filter(
    (route) => route.component === "event",
  );

  await t.test(
    "event HTML contains canonical and language metadata",
    async () => {
      for (const route of eventRoutes) {
        const html = await readDist(`${route.path.slice(1)}index.html`);
        const seo = getRouteSeoPayload(route);
        const event = CALENDAR_EVENTS.find(
          (candidate) => candidate.id === route.eventId,
        );
        const spanishPath =
          route.language === "es" ? route.path : route.alternatePath;
        const englishPath =
          route.language === "en" ? route.path : route.alternatePath;

        assert.equal(seo.robots, "index, follow");
        assert.ok(seo.canonicalUrl);
        assert.ok(html.includes(`<title>${seo.title}</title>`));
        assert.ok(html.includes('name="robots" content="index, follow"'));
        assert.ok(html.includes(`rel="canonical" href="${seo.canonicalUrl}"`));
        assert.ok(
          html.includes(`property="og:url" content="${seo.canonicalUrl}"`),
        );
        assert.ok(event, `${route.path}: calendar event is missing`);
        assert.ok(event.timeZone, `${route.path}: event time zone is missing`);
        assert.ok(
          html.includes(`<dd>${event.timeZone}</dd>`),
          `${route.path}: registered time zone is not visible`,
        );
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
    },
  );

  await t.test("event titles are unique within each language", () => {
    for (const language of ["es", "en"]) {
      const titles = eventRoutes
        .filter((route) => route.language === language)
        .map((route) => getRouteSeoPayload(route).title);
      assert.equal(new Set(titles).size, titles.length);
    }
  });

  await t.test("static route titles remain approved", () => {
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
  });

  await t.test("selected event titles remain approved", () => {
    const expectedEventTitles = new Map([
      ["2do-examen-2026:es", "Examen de Kendo — 8 ago 2026 | Costa Rica"],
      [
        "gasshuku-monteverde:es",
        "Gasshuku Monteverde — 12 sept 2026 | Costa Rica",
      ],
      ["3er-torneo:es", "3er Torneo de Kendo — 22 ago 2026"],
      [
        "clak-seminario-instructores-chile:es",
        "CLAK Seminario Instructores CHILE — 29 may 2026",
      ],
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
  });

  await t.test("archive pagination titles are localized", () => {
    const archivePageTwoTitles = routeManifest
      .filter(
        (route) => route.component === "pastEvents" && route.archivePage === 2,
      )
      .map((route) => route.title);
    assert.deepEqual(archivePageTwoTitles, [
      "Eventos pasados de Kendo — página 2 | Costa Rica",
      "Past Kendo Events — page 2 | Costa Rica",
    ]);
  });
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

  for (const route of ["index.html", "eventos/index.html"]) {
    const html = await readDist(route);
    assert.match(
      html,
      /og:image" content="https:\/\/fak-kendo\.org\/images\/social\/kendo-social-card-20260921\.jpg"/,
    );
    assert.match(html, /og:image:type" content="image\/jpeg"/);
    assert.match(html, /og:image:width" content="1200"/);
    assert.match(html, /og:image:height" content="630"/);
  }
});

test("renders indexable home and calendar routes with canonical metadata", async () => {
  const home = await readDist("index.html");
  const calendar = await readDist("eventos/index.html");
  for (const html of [home, calendar]) {
    assert.match(html, /name="robots" content="index, follow"/);
    assert.match(html, /application\/ld\+json/);
  }
  assert.match(home, /rel="canonical" href="https:\/\/fak-kendo\.org\/"/);
});

test("generates the archive route", async () => {
  const archive = await readDist("eventos/pasados/index.html");
  assert.match(archive, /Eventos pasados/);
  assert.match(archive, /href="\/eventos\/pasados\/2do-examen-2026\/"/);
});

test("omits breadcrumbs from event and archive routes", async () => {
  const pastEvent = await readDist(
    "eventos/pasados/2do-examen-2026/index.html",
  );
  const englishRoute = getRouteManifest().find(
    (route) => route.eventId === "2do-examen-2026" && route.language === "en",
  );
  const englishPastEvent = englishRoute
    ? await readDist(`${englishRoute.path.slice(1)}index.html`)
    : undefined;
  const archivePageTwo = await readDist("eventos/pasados/pagina/2/index.html");

  for (const html of [pastEvent, englishPastEvent, archivePageTwo].filter(
    Boolean,
  )) {
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
