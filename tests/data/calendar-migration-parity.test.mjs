import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  parseVEvents,
  parseCalendarEvent,
  mergeRegistry,
  serializeCalendarEvents,
  fingerprintHistoricalSnapshot,
  createCalendarNotifications,
} from "../../scripts/sync-calendar-events.ts";

test("TypeScript migration preserves the baseline bytes, fingerprints, formats and registry", async () => {
  const baseline = JSON.parse(
    await readFile("tests/fixtures/calendar-migration-baseline.json", "utf8"),
  );
  const warnings = [];
  const events = parseVEvents(
    await readFile("tests/fixtures/calendar-events-phase-2.ics", "utf8"),
  )
    .map((properties) => parseCalendarEvent(properties, warnings))
    .filter(Boolean);
  const registry = mergeRegistry(
    { version: 4, events: [] },
    events,
    new Date("2026-08-04T18:00:00Z"),
  );
  assert.deepEqual(JSON.parse(JSON.stringify(registry)), baseline.registry);
  assert.deepEqual(warnings, baseline.warnings);
  assert.equal(serializeCalendarEvents(registry.events), baseline.serialized);
  assert.deepEqual(
    registry.events.map(fingerprintHistoricalSnapshot),
    baseline.fingerprints,
  );
  assert.deepEqual(
    createCalendarNotifications(registry, {
      origin: "local",
      runId: null,
      attempt: null,
      trigger: null,
    }),
    baseline.notifications,
  );
});
