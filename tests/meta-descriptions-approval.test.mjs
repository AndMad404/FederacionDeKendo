import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as ssr from "../dist-ssr/entry-server.js";

const TERMINAL_PUNCTUATION = /[.!?…]$/u;
const IRREGULAR_WHITESPACE = /\s{2,}|^\s|\s$/u;
const STATIC_ROUTES = [
  "/",
  "/eventos/",
  "/galeria/",
  "/afiliados/",
  "/eventos/pasados/",
  "/en/",
  "/en/events/",
  "/en/gallery/",
  "/en/affiliates/",
  "/en/events/past/",
];
const FORBIDDEN_FRAGMENTS = /este y|doscientos metros|includes:/iu;

async function readDist(path) {
  return readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");
}

async function readSeoConfig() {
  return JSON.parse(
    await readFile(
      new URL("../src/app/config/seo-data.json", import.meta.url),
      "utf8",
    ),
  );
}

function outputPath(routePath) {
  return routePath === "/" ? "index.html" : `${routePath.slice(1)}index.html`;
}

function assertDescriptionQuality(description, context) {
  assert.equal(typeof description, "string", `${context}: missing description`);
  assert.ok(description.length > 0, `${context}: empty description`);
  assert.doesNotMatch(
    description,
    IRREGULAR_WHITESPACE,
    `${context}: description has irregular whitespace`,
  );
  assert.match(
    description,
    TERMINAL_PUNCTUATION,
    `${context}: description must end with punctuation`,
  );
}

function getDescriptionBuilder() {
  assert.equal(
    typeof ssr.buildEventMetaDescription,
    "function",
    "SSR capability missing: export buildEventMetaDescription from entry-server",
  );
  return ssr.buildEventMetaDescription;
}

const hasDescriptionBuilder =
  typeof ssr.buildEventMetaDescription === "function";

function buildDescription({
  language,
  event = {},
  localizedEvent = {},
  now = "2026-08-20T12:00:00.000Z",
  override,
}) {
  return getDescriptionBuilder()({
    event: {
      id: "meta-description-fixture",
      title: "Seminario de kendo",
      date: "2026-09-12",
      ...event,
    },
    localizedEvent: {
      id: "meta-description-fixture",
      title: language === "en" ? "Kendo seminar" : "Seminario de kendo",
      date: "2026-09-12",
      ...localizedEvent,
    },
    language,
    now,
    override,
  });
}

test("keeps the ten static ES/EN descriptions consistent across config, SEO payload, and HTML", async () => {
  const config = await readSeoConfig();
  const manifest = ssr.getRouteManifest();
  const descriptions = [];

  for (const path of STATIC_ROUTES) {
    const configured = config.routes[path];
    assert.ok(
      configured,
      `${path}: static SEO description must live in config`,
    );

    const route = manifest.find((candidate) => candidate.path === path);
    assert.ok(route, `${path}: route missing from manifest`);
    const payload = ssr.getRouteSeoPayload(route);
    const html = await readDist(outputPath(path));
    const descriptionTag = html.match(
      /<meta\s+[^>]*name="description"[^>]*>/u,
    )?.[0];
    const htmlDescription = descriptionTag?.match(/content="([^"]*)"/u)?.[1];

    assert.equal(
      payload.description,
      configured.description,
      `${path}: payload`,
    );
    assert.equal(htmlDescription, configured.description, `${path}: HTML`);
    assertDescriptionQuality(configured.description, path);
    descriptions.push(configured.description);
  }

  assert.equal(
    new Set(descriptions).size,
    STATIC_ROUTES.length,
    "static routes must have unique descriptions",
  );
});

test("exposes the event meta-description builder through the SSR namespace", () => {
  getDescriptionBuilder();
});

test(
  "builds complete future and past ES/EN event templates",
  { skip: !hasDescriptionBuilder },
  () => {
    const cases = [
      {
        language: "es",
        expected:
          "La Federación invita a la comunidad de kendo y al público interesado a participar.",
      },
      {
        language: "en",
        expected:
          "The Federation invites the kendo community and everyone interested to participate.",
      },
      {
        language: "es",
        event: { date: "2026-08-08" },
        localizedEvent: { date: "2026-08-08" },
        expected:
          "Actividad realizada como parte del calendario oficial de la Federación y la comunidad de kendo.",
      },
      {
        language: "en",
        event: { date: "2026-08-08" },
        localizedEvent: { date: "2026-08-08" },
        expected:
          "An activity held as part of the Federation’s official calendar and the kendo community.",
      },
    ];

    for (const fixture of cases) {
      const description = buildDescription(fixture);
      assert.match(
        description,
        new RegExp(
          fixture.expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "u",
        ),
      );
      assertDescriptionQuality(description, `${fixture.language} template`);
    }
  },
);

test("requires event name and date", { skip: !hasDescriptionBuilder }, () => {
  for (const [field, value] of [
    ["name", { localizedEvent: { title: "" } }],
    ["date", { event: { date: "" }, localizedEvent: { date: "" } }],
  ]) {
    assert.throws(
      () => buildDescription({ language: "es", ...value }),
      new RegExp(
        `meta-description-fixture.*es.*${field}|${field}.*meta-description-fixture.*es`,
        "iu",
      ),
    );
  }
});

test(
  "omits optional time and venue without cutting a sentence",
  { skip: !hasDescriptionBuilder },
  () => {
    const withoutOptionals = buildDescription({ language: "es" });
    assert.doesNotMatch(withoutOptionals, /13:00|Tamashii/u);

    const longAddress = buildDescription({
      language: "es",
      event: {
        startTime: "13:00",
        location:
          "Tamashii Martial Arts Pinares, San José, Curridabat, Granadilla, doscientos metros este y doscientos metros norte, Costa Rica",
      },
    });
    assert.doesNotMatch(
      longAddress,
      /Curridabat|doscientos metros|Costa Rica/u,
    );
    assertDescriptionQuality(longAddress, "long address");
  },
);

test(
  "keeps the time while omitting the full postal address",
  { skip: !hasDescriptionBuilder },
  () => {
    const description = buildDescription({
      language: "en",
      event: {
        startTime: "13:00",
        location:
          "Tamashii Martial Arts Pinares, San José, Curridabat, Granadilla, Postal District, Costa Rica",
      },
    });

    assert.match(description, /13:00/u);
    assert.doesNotMatch(description, /Curridabat|Postal District|Costa Rica/u);
    assertDescriptionQuality(description, "time without postal address");
  },
);

test(
  "applies independent valid ES and EN editorial overrides",
  { skip: !hasDescriptionBuilder },
  () => {
    const overrides = {
      es: "Descripción editorial completa para el evento.",
      en: "Complete editorial description for the event.",
    };

    assert.equal(
      buildDescription({ language: "es", override: overrides.es }),
      overrides.es,
    );
    assert.equal(
      buildDescription({ language: "en", override: overrides.en }),
      overrides.en,
    );
    assert.notEqual(buildDescription({ language: "es" }), overrides.es);
    assert.notEqual(buildDescription({ language: "en" }), overrides.en);
  },
);

test(
  "rejects invalid editorial overrides with event and language context",
  { skip: !hasDescriptionBuilder },
  () => {
    const invalid = [
      ["empty", ""],
      [
        "without closing punctuation",
        "A complete-looking description without a close",
      ],
      ["irregular whitespace", "A description  with irregular spacing."],
    ];

    for (const language of ["es", "en"]) {
      for (const [label, override] of invalid) {
        assert.throws(
          () => buildDescription({ language, override }),
          (error) => {
            assert.match(String(error), /meta-description-fixture/u, label);
            assert.match(String(error), new RegExp(language, "u"), label);
            return true;
          },
        );
      }
    }
  },
);

test("audits the complete 44-route description inventory for broken fragments", () => {
  const routes = ssr.getRouteManifest();
  assert.equal(
    routes.length,
    44,
    "route inventory changed; review this contract",
  );

  for (const route of routes) {
    const description = ssr.getRouteSeoPayload(route).description;
    assertDescriptionQuality(description, route.path);
    assert.doesNotMatch(description, FORBIDDEN_FRAGMENTS, route.path);
  }
});
