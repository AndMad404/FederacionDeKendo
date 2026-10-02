import assert from "node:assert/strict";
import test from "node:test";

import {
  CALENDAR_EVENTS,
  getEventRedirects,
  hasDistinctEventTranslation,
  getRouteManifest,
  getEventTranslationStatus,
  getLocalizedEvent,
} from "../../dist-ssr/entry-server.js";
import {
  readDist,
  getPanamaEvent,
} from "../helpers/generated-output-fixtures.mjs";

function formatEventSeoDate(date, language) {
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function getExpectedEventSeoTitle(event, language) {
  const localizedEvent = getLocalizedEvent(event, language);
  assert.ok(localizedEvent, `${event.id}: ${language} localization is missing`);
  return `${localizedEvent.title} — ${formatEventSeoDate(event.date, language)}`;
}

test("keeps the untranslated Panama event on its Spanish vanity route", async () => {
  const eventRoutes = getRouteManifest().filter(
    (route) => route.component === "event",
  );
  const panamaEvent = getPanamaEvent();
  const panamaEventId = panamaEvent.id;
  const expectedPanamaRoutes = new Map([
    [
      "es",
      {
        path: `/eventos/${panamaEventId}/`,
        title: getExpectedEventSeoTitle(panamaEvent, "es"),
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
      `${language}: ${getEventTranslationStatus(panamaEvent)}`,
    );
    assert.equal(route?.title, expected.title, language);
  }
  assert.equal(
    eventRoutes.find(
      (candidate) =>
        candidate.eventId === panamaEventId && candidate.language === "en",
    ),
    undefined,
  );
});

test("generates the localized English home with reciprocal language metadata", async () => {
  const home = await readDist("en/index.html");

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
});

test("publishes English event routes only for distinct editorial translations", async () => {
  const spanishEventRoutes = getRouteManifest()
    .filter((route) => route.component === "event" && route.language === "es")
    .map((route) => route.eventId)
    .sort();
  const englishEventRoutes = getRouteManifest()
    .filter((route) => route.component === "event" && route.language === "en")
    .map((route) => route.eventId)
    .sort();
  const eventIds = CALENDAR_EVENTS.map((event) => event.id).sort();
  const translatedEventIds = CALENDAR_EVENTS.filter((event) =>
    hasDistinctEventTranslation(event),
  )
    .map((event) => event.id)
    .sort();
  const duplicateEvents = CALENDAR_EVENTS.filter(
    (event) => !hasDistinctEventTranslation(event),
  );
  const routeManifest = getRouteManifest();
  const redirects = getEventRedirects();
  const sitemap = await readDist("sitemap.xml");

  assert.deepEqual(spanishEventRoutes, eventIds);
  assert.deepEqual(englishEventRoutes, translatedEventIds);
  for (const eventId of translatedEventIds) {
    const route = routeManifest.find(
      (route) => route.eventId === eventId && route.language === "en",
    );
    const html = await readDist(`${route.path.slice(1)}index.html`);
    assert.match(html, /<html lang="en"/, eventId);
    assert.match(html, /hreflang="es-CR"/, eventId);
  }
  assert.ok(duplicateEvents.length > 0);

  for (const event of duplicateEvents) {
    const spanishRoute = routeManifest.find(
      (route) =>
        route.component === "event" &&
        route.eventId === event.id &&
        route.language === "es",
    );
    const englishRoute = routeManifest.find(
      (route) =>
        route.component === "event" &&
        route.eventId === event.id &&
        route.language === "en",
    );

    assert.ok(spanishRoute, event.id);
    assert.equal(englishRoute, undefined, event.id);

    const englishRedirects = redirects.filter(
      ({ from, to }) =>
        from.startsWith("/en/events/") && to === spanishRoute.path,
    );
    assert.ok(englishRedirects.length > 0, event.id);
    for (const { from } of englishRedirects) {
      assert.equal(
        sitemap.includes(`<loc>https://fak-kendo.org${from}</loc>`),
        false,
        from,
      );
    }

    const spanishHtml = await readDist(
      `${spanishRoute.path.slice(1)}index.html`,
    );
    assert.doesNotMatch(spanishHtml, /hreflang="en"/, event.id);
  }
});
