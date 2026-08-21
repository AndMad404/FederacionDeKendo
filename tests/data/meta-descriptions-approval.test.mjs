import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as ssr from "../../dist-ssr/entry-server.js";

const TERMINAL_PUNCTUATION = /[.!?…]$/u;
const IRREGULAR_WHITESPACE = /\s{2,}|^\s|\s$/u;
const APPROVED_STATIC_DESCRIPTIONS = {
  "/": "Sitio oficial de la Federación de Asociaciones de Kendo. Conoce el kendo en Costa Rica, sus eventos, comunidad y dojos afiliados.",
  "/eventos/":
    "Consulta el calendario oficial de kendo en Costa Rica: torneos, exámenes, seminarios y actividades de la Federación.",
  "/galeria/":
    "Explora la galería de la Federación de Asociaciones de Kendo: entrenamientos, actividades y comunidad de kendo en Costa Rica.",
  "/afiliados/":
    "Encuentra dojos afiliados a la Federación de Asociaciones de Kendo en Costa Rica, con horarios, ubicación y datos de contacto.",
  "/eventos/pasados/":
    "Consulta el archivo de eventos de kendo en Costa Rica: torneos, exámenes, seminarios y actividades anteriores de la Federación.",
  "/en/":
    "Official site of the Federation of Kendo Associations. Discover kendo in Costa Rica, upcoming events, the community, and affiliated dojos.",
  "/en/events/":
    "View Costa Rica’s official kendo calendar: tournaments, examinations, seminars, and federation activities.",
  "/en/gallery/":
    "Explore the Federation of Kendo Associations gallery: training, activities, and Costa Rica’s kendo community.",
  "/en/affiliates/":
    "Find kendo dojos affiliated with the Federation of Kendo Associations in Costa Rica, including schedules, locations, and contact details.",
  "/en/events/past/":
    "Browse past kendo events in Costa Rica, including federation tournaments, examinations, seminars, and activities.",
};
const FORBIDDEN_FRAGMENTS =
  /este y|this and|doscientos metros|two hundred meters|includes:/iu;

async function readDist(path) {
  return readFile(new URL(`../../dist/${path}`, import.meta.url), "utf8");
}

async function readSeoConfig() {
  return JSON.parse(
    await readFile(
      new URL("../../src/app/config/seo-data.json", import.meta.url),
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
  overrides,
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
    overrides,
  });
}

test("keeps the ten approved static ES/EN descriptions consistent across config, SEO payload, and HTML", async (t) => {
  const config = await readSeoConfig();
  const manifest = ssr.getRouteManifest();

  for (const [path, approvedDescription] of Object.entries(
    APPROVED_STATIC_DESCRIPTIONS,
  )) {
    await t.test(path, async () => {
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
        configured.description,
        approvedDescription,
        `${path}: config`,
      );
      assert.equal(
        payload.description,
        approvedDescription,
        `${path}: payload`,
      );
      assert.equal(htmlDescription, approvedDescription, `${path}: HTML`);
      assertDescriptionQuality(approvedDescription, path);
    });
  }

  assert.equal(
    new Set(Object.values(APPROVED_STATIC_DESCRIPTIONS)).size,
    Object.keys(APPROVED_STATIC_DESCRIPTIONS).length,
    "static routes must have unique descriptions",
  );
});

test("does not impose the dynamic event limit on curated static descriptions", () => {
  const staticRoute = ssr
    .getRouteManifest()
    .find((route) => route.path === "/");
  assert.ok(staticRoute, "home route missing from manifest");

  const curatedDescription =
    "Esta descripción estática deliberadamente supera ciento cincuenta y cinco caracteres para comprobar que la calidad editorial conserva prioridad y que el límite técnico permanece aislado en las páginas dinámicas de eventos.";
  assert.ok(curatedDescription.length > 155);
  assert.equal(
    ssr.getRouteSeoPayload({
      ...staticRoute,
      description: curatedDescription,
    }).description,
    curatedDescription,
  );
});

test("exposes the event meta-description builder through the SSR namespace", () => {
  getDescriptionBuilder();
});

test(
  "uses the approved ES/EN fallback when no summary is available",
  { skip: !hasDescriptionBuilder },
  () => {
    const cases = [
      {
        language: "es",
        expected: "Consulta los detalles oficiales del evento.",
      },
      {
        language: "en",
        expected: "View the official event details.",
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
  "includes optional time and short venue only when the complete template fits",
  { skip: !hasDescriptionBuilder },
  () => {
    for (const language of ["es", "en"]) {
      const withoutOptionals = buildDescription({ language });
      assert.doesNotMatch(withoutOptionals, /13:00|Tamashii/u);
      assertDescriptionQuality(
        withoutOptionals,
        `${language} future event without optional data`,
      );

      const withOptionals = buildDescription({
        language,
        event: {
          startTime: "13:00",
          location: "Tamashii Martial Arts Pinares",
        },
      });
      assert.match(withOptionals, /13:00/u);
      assert.match(withOptionals, /Tamashii Martial Arts Pinares/u);
      assertDescriptionQuality(
        withOptionals,
        `${language} complete future event`,
      );
    }

    const longAddress = buildDescription({
      language: "es",
      event: {
        location:
          "Tamashii Martial Arts Pinares, San José, Curridabat, Granadilla, doscientos metros este y doscientos metros norte, Costa Rica",
      },
    });
    assert.match(longAddress, /Tamashii Martial Arts Pinares/u);
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
    assert.match(description, /Tamashii Martial Arts Pinares/u);
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

    assert.equal(buildDescription({ language: "es", overrides }), overrides.es);
    assert.equal(buildDescription({ language: "en", overrides }), overrides.en);
    assert.equal(
      buildDescription({ language: "es", overrides: { en: overrides.en } }),
      buildDescription({ language: "es" }),
    );
    assert.equal(
      buildDescription({ language: "en", overrides: { es: overrides.es } }),
      buildDescription({ language: "en" }),
    );
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
          () =>
            buildDescription({ language, overrides: { [language]: override } }),
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

test("audits the complete 44-route description inventory and generated HTML", async () => {
  const routes = ssr.getRouteManifest();
  assert.equal(
    routes.length,
    44,
    "route inventory changed; review this contract",
  );

  const descriptions = [];
  for (const route of routes) {
    const description = ssr.getRouteSeoPayload(route).description;
    descriptions.push(description);
    assertDescriptionQuality(description, route.path);
    assert.doesNotMatch(description, FORBIDDEN_FRAGMENTS, route.path);
    const html = await readDist(outputPath(route.path));
    const descriptionTag = html.match(
      /<meta\s+[^>]*name="description"[^>]*>/u,
    )?.[0];
    assert.equal(
      descriptionTag?.match(/content="([^"]*)"/u)?.[1],
      description,
      `${route.path}: HTML description`,
    );
  }

  assert.equal(
    new Set(descriptions).size,
    descriptions.length,
    "all generated routes must have unique descriptions",
  );
});
