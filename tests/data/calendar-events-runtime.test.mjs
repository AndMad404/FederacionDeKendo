import assert from "node:assert/strict";
import test from "node:test";

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
