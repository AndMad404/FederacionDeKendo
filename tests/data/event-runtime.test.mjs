import assert from "node:assert/strict";
import test from "node:test";

import {
  CALENDAR_EVENTS,
  getEventTranslationStatus,
  getLocalizedEvent,
  getLocalizedEvents,
} from "../../dist-ssr/entry-server.js";

import {
  closeSourceModuleLoader,
  loadSourceModule,
} from "../helpers/load-source-module.mjs";

test.after(async () => closeSourceModuleLoader());

const tournament = {
  id: "2026-08-22-3er-torneo",
  title: "3er Torneo",
  date: "2026-08-22",
  startTime: "13:00",
  endTime: "17:00",
  timeZone: "America/Costa_Rica",
};

const gasshuku = {
  id: "2026-09-12-gasshuku-monteverde",
  title: "Gasshuku Monteverde",
  date: "2026-09-12",
  endDate: "2026-09-14",
  timeZone: "America/Costa_Rica",
};

const publishedGasshuku = CALENDAR_EVENTS.find(
  ({ id }) => id === "2026-09-12-gasshuku-monteverde",
);

test("upcoming events advance at the exact local event end time", async () => {
  const { getUpcomingEvents } = await loadSourceModule(
    "/src/app/utils/calendarEvents.ts",
  );

  assert.deepEqual(
    getUpcomingEvents(
      [tournament, gasshuku],
      new Date("2026-08-22T16:59:59-06:00"),
    ).map(({ id }) => id),
    [tournament.id, gasshuku.id],
  );

  assert.deepEqual(
    getUpcomingEvents(
      [tournament, gasshuku],
      new Date("2026-08-22T17:00:00-06:00"),
    ).map(({ id }) => id),
    [gasshuku.id],
  );
});

test("public history keeps its separate next-midnight boundary", async () => {
  const { isPastEvent } = await loadSourceModule(
    "/src/app/utils/calendarEvents.ts",
  );

  assert.equal(
    isPastEvent(tournament, new Date("2026-08-22T23:59:59-06:00")),
    false,
  );

  assert.equal(
    isPastEvent(tournament, new Date("2026-08-23T00:00:00-06:00")),
    true,
  );
});

test("identifies #EventoExterno markers in the event description", async () => {
  const { isExternalEvent } = await loadSourceModule(
    "/src/app/utils/calendarEvents.ts",
  );

  assert.equal(
    isExternalEvent({ summary: "#EventoExterno Seminario de CLAK" }),
    true,
  );

  assert.equal(isExternalEvent({ summary: "Seminario" }), false);
});

test("uses the reviewed English Gasshuku translation from the editorial record", () => {
  const localized = getLocalizedEvent(publishedGasshuku, "en");

  assert.equal(getEventTranslationStatus(publishedGasshuku), "valid");
  assert.equal(localized?.title, "Gasshuku Monteverde");
  assert.match(localized?.summary ?? "", /round-trip transportation/);
  assert.doesNotMatch(localized?.summary ?? "", /La participación incluye/);
});

test("classifies unavailable editorial translations and falls back to Spanish", () => {
  const missing = {
    ...publishedGasshuku,
    id: "not-translated",
  };

  const stale = {
    ...publishedGasshuku,
    title: "Gasshuku Monteverde actualizado",
  };

  assert.equal(getEventTranslationStatus(missing), "missing");
  assert.equal(getEventTranslationStatus(stale), "stale");
  assert.deepEqual(getLocalizedEvent(missing, "en"), missing);
  assert.deepEqual(getLocalizedEvent(stale, "en"), stale);
});

test("keeps untranslated events available in both route languages", () => {
  const stale = {
    ...publishedGasshuku,
    summary: "Texto español actualizado.",
  };

  assert.deepEqual(getLocalizedEvents([stale], "en"), [stale]);
  assert.deepEqual(getLocalizedEvents([stale], "es"), [stale]);
});
