import assert from "node:assert/strict";
import test from "node:test";

import {
  CALENDAR_EVENTS,
  getEventAddressCountry,
  getRouteManifest,
  getRouteSeoPayload,
} from "../../dist-ssr/entry-server.js";

function getExpectedStructuredEndDate(event) {
  if (event.endDate && !event.startTime && !event.endTime) {
    const endDate = new Date(`${event.endDate}T00:00:00.000Z`);
    endDate.setUTCDate(endDate.getUTCDate() - 1);
    return endDate.toISOString().slice(0, 10);
  }
  if (event.endDate && event.endTime) {
    return `${event.endDate}T${event.endTime}:00-06:00`;
  }
  if (event.endDate) return event.endDate;
  if (event.endTime) return `${event.date}T${event.endTime}:00-06:00`;
  return event.startTime ? undefined : event.date;
}

test("publishes Event JSON-LD only for federation events with a known physical location", () => {
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

    const external = /(?:^|\s)#EventoExterno\b/iu.test(event?.summary ?? "");

    if (!event.location?.trim() || external) {
      assert.equal(
        structuredEvent,
        undefined,
        `${route.path}: ineligible Event JSON-LD must be omitted`,
      );
      continue;
    }

    assert.ok(structuredEvent, `${route.path}: Event JSON-LD is missing`);
    assert.equal(structuredEvent.location?.["@type"], "Place");
    assert.equal(
      structuredEvent.location?.address?.streetAddress,
      event.location.trim(),
    );
    assert.equal(
      structuredEvent.location?.address?.addressCountry,
      getEventAddressCountry(event),
    );
    assert.equal(
      structuredEvent.endDate,
      getExpectedStructuredEndDate(event),
      `${route.path}: endDate must match the visible inclusive event end`,
    );
    assert.deepEqual(
      structuredEvent.image,
      [
        "https://fak-kendo.org/images/calendar/kendo-calendar-1600.webp?v=20260723-1004",
      ],
      `${route.path}: Event image must match the visible calendar banner`,
    );
    assert.deepEqual(
      structuredEvent.organizer,
      [
        { "@id": organizationId },
        {
          "@type": "Person",
          name: "Pablo Quesada",
          url: "https://www.facebook.com/pablo.quesadachavarria",
          sameAs: ["https://www.instagram.com/kendocostarica/"],
        },
      ],
      `${route.path}: unexpected organizer`,
    );
    assert.deepEqual(
      structuredEvent.performer,
      [
        {
          "@type": "Person",
          name: "Genki Kubo",
          description: "Sensei de kendo 7° Dan",
        },
        {
          "@type": "Person",
          name: "Haruyo Kubo",
          description: "Sensei de kendo 7° Dan",
        },
      ],
      `${route.path}: unexpected performers`,
    );
    const scheduled =
      structuredEvent.eventStatus === "https://schema.org/EventScheduled";
    assert.deepEqual(
      structuredEvent.offers,
      scheduled
        ? {
            "@type": "Offer",
            url: `https://fak-kendo.org${route.path}`,
            price: 0,
            priceCurrency: "CRC",
          }
        : undefined,
      `${route.path}: unexpected offer`,
    );
  }
});

test("publishes the correct address country for regional events", () => {
  const expectedCountries = [
    [/panam[aá]/iu, "PA"],
    [/chile/iu, "CL"],
    [/(?:brasil|brazil)/iu, "BR"],
  ];

  for (const [countryPattern, expectedCountry] of expectedCountries) {
    const event = CALENDAR_EVENTS.find((candidate) =>
      countryPattern.test(
        [candidate.title, candidate.location, candidate.summary]
          .filter(Boolean)
          .join(" "),
      ),
    );

    assert.ok(event, `${expectedCountry}: regional event is missing`);
    assert.equal(getEventAddressCountry(event), expectedCountry);
  }

  assert.equal(
    getEventAddressCountry({
      title: "Examen de Kendo",
      location: "San José, Costa Rica",
    }),
    "CR",
  );
});
