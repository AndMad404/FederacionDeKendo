import assert from "node:assert/strict";
import test from "node:test";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { temporaryDirectory } from "../helpers/temporary-directory.mjs";
import { makeHistoricalEvent } from "../helpers/event-history-fixtures.mjs";
import {
  assertSafeCalendarInput,
  applyEditorialDecision,
  detectHistoricalChanges,
  mergeRegistry,
  parseCalendarEvent,
  parseVEvents,
  serializeCalendarEvents,
  synchronizeCalendar,
} from "../../scripts/sync-calendar-events.ts";

const now = new Date("2026-10-20T00:00:00Z");

test("manual exceptions survive changed and missing Calendar entries without revisions", () => {
  const event = makeHistoricalEvent({
    syncPolicy: "manual",
    location: "Approved location",
  });
  const registry = { version: 4, events: [event] };
  for (const feed of [
    [
      {
        ...event,
        title: "Changed",
        location: "Wrong location",
        summary: "Changed",
      },
    ],
    [],
  ]) {
    assert.deepEqual(mergeRegistry(registry, feed, now).events, [event]);
    assert.deepEqual(
      detectHistoricalChanges(registry, feed, now).historicalChanges,
      [],
    );
  }
  assert.ok(!serializeCalendarEvents([event]).includes("syncPolicy"));
  assert.throws(
    () =>
      applyEditorialDecision(registry, {
        sourceId: event.sourceId,
        decisionRecordId: "owner-test",
      }),
    /Manually maintained/,
  );
});

test("manual exceptions do not mask or trigger disappearance protection for Calendar-owned events", () => {
  const manual = Array.from({ length: 6 }, (_, i) =>
    makeHistoricalEvent({ sourceId: `manual-${i}`, syncPolicy: "manual" }),
  );
  const current = makeHistoricalEvent({
    sourceId: "calendar-owned",
    slug: "calendar-owned",
  });
  assert.doesNotThrow(() =>
    assertSafeCalendarInput({ version: 4, events: [...manual, current] }, [
      current,
    ]),
  );
  assert.throws(
    () => assertSafeCalendarInput({ version: 4, events: manual }, []),
    /no valid events/,
  );
  assert.throws(
    () => mergeRegistry({ version: 4, events: [current] }, [], now),
    /All historical events disappeared/,
  );
});

test("a real sync keeps missing and changed manual exceptions without gallery alarms", async (t) => {
  const directory = await temporaryDirectory(t, "fak-manual-");
  const changedICS =
    "BEGIN:VEVENT\r\nUID:manual@example.test\r\nDTSTART;VALUE=DATE:20260110\r\nDTEND;VALUE=DATE:20260111\r\nSUMMARY:Changed event\r\nLOCATION:Wrong location\r\nEND:VEVENT\r\n";
  const parsed = parseCalendarEvent(
    parseVEvents(
      `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${changedICS}END:VCALENDAR\r\n`,
    )[0],
    [],
  );
  const event = makeHistoricalEvent({
    sourceId: parsed.sourceId,
    syncPolicy: "manual",
    location: "Approved location",
  });
  const registryPath = path.join(directory, "registry.json");
  const outputPath = path.join(directory, "calendarEvents.ts");
  const source = path.join(directory, "calendar.ics");
  await writeFile(
    registryPath,
    JSON.stringify({ version: 4, events: [event] }),
  );
  for (const manualICS of ["", changedICS]) {
    await writeFile(
      source,
      `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${manualICS}BEGIN:VEVENT\r\nUID:future@example.test\r\nDTSTART;VALUE=DATE:20300101\r\nDTEND;VALUE=DATE:20300102\r\nSUMMARY:Future event\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`,
    );
    const result = await synchronizeCalendar({
      source,
      registryPath,
      outputPath,
      now,
      galleryOptions: {
        listFolder: async () => {
          throw new Error("Manual gallery must not be requested");
        },
      },
    });
    assert.deepEqual(
      result.registry.events.find(
        ({ sourceId }) => sourceId === event.sourceId,
      ),
      event,
    );
    assert.match(await readFile(outputPath, "utf8"), /Approved location/);
    assert.deepEqual(result.historicalReport.historicalChanges, []);
    assert.deepEqual(result.historicalReport.galleryChanges, []);
    assert.equal(result.galleryResult, undefined);
  }
});
