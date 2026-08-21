import assert from "node:assert/strict";
import test from "node:test";

import {
  buildArchiveUrl,
  filterAndSortArchiveEvents,
  getArchiveYears,
  normalizeArchiveFilters,
} from "../../src/app/utils/eventArchive.js";

const events = [
  { id: "no-gallery", date: "2024-01-15", eventType: "evento" },
  { id: "tournament", date: "2025-03-10", eventType: "torneo" },
  { id: "exam", date: "2025-02-10", eventType: "examen" },
  { id: "seminar", date: "2025-01-10", eventType: "seminario" },
];

test("orders archive events from most recent to oldest", () => {
  assert.deepEqual(
    filterAndSortArchiveEvents(events, {}).map(({ id }) => id),
    ["tournament", "exam", "seminar", "no-gallery"],
  );
});

test("filters by year and derives descending year options", () => {
  assert.deepEqual(
    filterAndSortArchiveEvents(events, { year: "2025" }).map(({ id }) => id),
    ["tournament", "exam", "seminar"],
  );
  assert.deepEqual(getArchiveYears(events), ["2025", "2024"]);
});

for (const type of ["torneo", "examen", "seminario", "evento"]) {
  test(`filters the ${type} event type`, () => {
    assert.equal(filterAndSortArchiveEvents(events, { type }).length, 1);
    assert.equal(
      filterAndSortArchiveEvents(events, { type })[0].eventType,
      type,
    );
  });
}

test("combines year and type filters and supports no results", () => {
  assert.deepEqual(
    filterAndSortArchiveEvents(events, { year: "2025", type: "examen" }).map(
      ({ id }) => id,
    ),
    ["exam"],
  );
  assert.deepEqual(
    filterAndSortArchiveEvents(events, { year: "2024", type: "torneo" }),
    [],
  );
});

test("the all option applies no filters and invalid values are ignored", () => {
  assert.equal(filterAndSortArchiveEvents(events, {}).length, events.length);
  assert.deepEqual(normalizeArchiveFilters({ year: "bad", type: "dojo" }), {});
});

test("builds equivalent localized URLs and preserves filters across pages", () => {
  assert.equal(
    buildArchiveUrl(2, "es", { year: "2025", type: "torneo" }),
    "/eventos/pasados/pagina/2/?year=2025&type=torneo",
  );
  assert.equal(
    buildArchiveUrl(2, "en", { year: "2025", type: "torneo" }),
    "/en/events/past/page/2/?year=2025&type=torneo",
  );
  assert.equal(
    buildArchiveUrl(1, "es", { year: "2025" }),
    "/eventos/pasados/?year=2025",
  );
});

test("events remain reachable regardless of gallery state", () => {
  assert.ok(
    filterAndSortArchiveEvents(events, {}).some(
      ({ id }) => id === "no-gallery",
    ),
  );
});
