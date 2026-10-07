import assert from "node:assert/strict";
import test from "node:test";
import {
  CALENDAR_EVENTS,
  hasDistinctEventTranslation,
  getRouteManifest,
} from "../../dist-ssr/entry-server.js";
import { readDist } from "../helpers/generated-output-fixtures.mjs";

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
  const eventRoutes = getRouteManifest().filter(
    (route) => route.component === "event",
  );
  for (const language of ["es", "en"]) {
    const published = eventRoutes.filter(
      (route) => route.language === language,
    );
    const expected =
      language === "es"
        ? CALENDAR_EVENTS
        : CALENDAR_EVENTS.filter(hasDistinctEventTranslation);
    assert.deepEqual(
      published.map((route) => route.eventId).sort(),
      expected.map((event) => event.id).sort(),
      language,
    );
    if (language === "en") {
      for (const route of published) {
        assert.match(
          await readDist(`${route.path.slice(1)}index.html`),
          /<html lang="en"/,
          route.path,
        );
      }
    }
  }
});
