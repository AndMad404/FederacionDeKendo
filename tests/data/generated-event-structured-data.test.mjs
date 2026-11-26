import assert from "node:assert/strict";
import test from "node:test";
import { getExpectedEventZoneName } from "../helpers/generated-output-fixtures.mjs";

import {
  CALENDAR_EVENTS,
  getEventAddressCountry,
  getRouteManifest,
  getRouteSeoPayload,
} from "../../dist-ssr/entry-server.js";

function getExpectedTimedDate(event, date, time) {
  const zone = getExpectedEventZoneName(date, time, event.timeZone);
  const offset = zone.slice(3) || "+00:00";
  return `${date}T${time}:00${offset}`;
}

function getExpectedStructuredEndDate(event) {
  if (event.endDate && !event.startTime && !event.endTime) {
    const endDate = new Date(`${event.endDate}T00:00:00.000Z`);
    endDate.setUTCDate(endDate.getUTCDate() - 1);
    return endDate.toISOString().slice(0, 10);
  }
  if (event.endDate && event.endTime) {
    return getExpectedTimedDate(event, event.endDate, event.endTime);
  }
  if (event.endDate) return event.endDate;
  if (event.endTime)
    return getExpectedTimedDate(event, event.date, event.endTime);
  return event.startTime ? undefined : event.date;
}

test("publishes Event JSON-LD only for federation events with a known physical location", () => {
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

    const external =
      event.external === true ||
      /(?:^|\s)#EventoExterno\b/iu.test(event?.summary ?? "");

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
      structuredEvent.startDate,
      event.startTime
        ? getExpectedTimedDate(event, event.date, event.startTime)
        : event.date,
      `${route.path}: startDate must match the local event start`,
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
    for (const field of ["organizer", "performer", "offers"]) {
      assert.equal(
        Object.hasOwn(structuredEvent, field),
        false,
        `${route.path}: ${field} requires confirmed per-event data`,
      );
    }
  }
});

test("the manual Panamericano announcement does not acquire federation organizer metadata when its description changes", () => {
  const event = CALENDAR_EVENTS.find(
    (candidate) => candidate.id === "clak-1er-panamericano-brasil",
  );
  assert.ok(event);
  assert.equal(event.external, true);
  assert.doesNotMatch(event.summary, /#EventoExterno/);
  const route = getRouteManifest().find(
    (candidate) => candidate.eventId === event.id,
  );
  assert.ok(route);
  const graph = getRouteSeoPayload(route).structuredData?.["@graph"] ?? [];
  assert.equal(
    graph.some((entity) => entity?.["@type"] === "Event"),
    false,
  );
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
