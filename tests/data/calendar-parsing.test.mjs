import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createCanonicalSlug,
  getPrivateAlbumUrl,
  parseCalendarEvent,
  parseVEvents,
  serializeCalendarEvents,
} from "../../scripts/sync-calendar-events.ts";
const fixturePath = new URL("../fixtures/calendar-events.ics", import.meta.url);
test("creates the same opaque 24-character sourceId for the same UID", async () => {
  const [properties] = parseVEvents(await readFile(fixturePath, "utf8"));
  const first = parseCalendarEvent(properties);
  const second = parseCalendarEvent(properties);

  assert.equal(first.sourceId, second.sourceId);
  assert.equal(first.sourceId, "aac691754e9f35832d4dfec4");
  assert.match(first.sourceId, /^[a-f0-9]{24}$/);
  assert.equal(first.sourceId.includes("exam-1@example.test"), false);
});

test("captures LAST-MODIFIED as sourceUpdatedAt without falling back to DTSTAMP", () => {
  const properties = parseVEvents(
    [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:last-modified@example.test",
      "DTSTART;VALUE=DATE:20260822",
      "SUMMARY:3er Torneo",
      "LAST-MODIFIED:20260917T123456Z",
      "DTSTAMP:20260918T010203Z",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:dtstamp-only@example.test",
      "DTSTART;VALUE=DATE:20261031",
      "SUMMARY:Examen",
      "DTSTAMP:20260918T020304Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n"),
  );

  const withLastModified = parseCalendarEvent(properties[0]);
  const withDtstampOnly = parseCalendarEvent(properties[1]);

  assert.equal(withLastModified.sourceUpdatedAt, "2026-09-17T12:34:56.000Z");
  assert.equal(withDtstampOnly.sourceUpdatedAt, undefined);

  const generated = serializeCalendarEvents([
    { ...withLastModified, editorialState: "publicado" },
  ]);
  assert.match(generated, /sourceUpdatedAt: "2026-09-17T12:34:56\.000Z"/);
});

test("stores the exclusive DTEND for all-day ranges", async () => {
  const properties = parseVEvents(await readFile(fixturePath, "utf8"));
  const events = properties
    .map((event) => parseCalendarEvent(event))
    .filter(Boolean);

  assert.equal(events[1].date, "2026-09-11");
  assert.equal(events[1].endDate, "2026-09-13");
});

test("omits drafts and recurring events while allowing optional content to be absent", async () => {
  const warnings = [];
  const events = parseVEvents(await readFile(fixturePath, "utf8"))
    .map((event) => parseCalendarEvent(event, warnings))
    .filter(Boolean);

  assert.equal(
    events.some((event) => event.title.includes("BORRADOR")),
    false,
  );
  assert.equal(
    events.some((event) => event.title === "Entrenamiento semanal"),
    false,
  );
  assert.equal(
    events.some((event) => event.title === "Actividad sin detalles"),
    true,
  );
  assert.equal(
    warnings.some((warning) => warning.includes("Draft omitted")),
    true,
  );
  assert.equal(
    warnings.some((warning) => warning.includes("Recurring event omitted")),
    true,
  );
  assert.equal(
    warnings.some((warning) =>
      /location|description|gallery|ubicación|descripción/i.test(warning),
    ),
    false,
  );
});

test("omits an event and warns when title or date is missing", () => {
  const warnings = [];
  const events = parseVEvents(
    [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:missing-title@example.test",
      "DTSTART;VALUE=DATE:20260808",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:missing-date@example.test",
      "SUMMARY:Evento sin fecha",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n"),
  )
    .map((event) => parseCalendarEvent(event, warnings))
    .filter(Boolean);

  assert.deepEqual(events, []);
  assert.equal(
    warnings.some((warning) => warning.includes("title")),
    true,
  );
  assert.equal(
    warnings.some((warning) => warning.includes("date")),
    true,
  );
});

test("accepts matching Drive album links with different query parameters", () => {
  const [properties] = parseVEvents(
    [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:album@example.test",
      "DTSTART;VALUE=DATE:20260822",
      "SUMMARY:3er Torneo",
      'DESCRIPTION:Resultados.\\n<a href="https://drive.google.com/drive/folders/same-folder?usp=drive_link" class="pastedDriveLink-0">Álbum</a>\\n---\\nALBUM_FOTOS: https://drive.google.com/drive/folders/same-folder',
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n"),
  );

  const event = parseCalendarEvent(properties);

  assert.equal(
    getPrivateAlbumUrl(event),
    "https://drive.google.com/drive/folders/same-folder?usp=drive_link",
  );
  assert.equal(event.summary, "Resultados.");
});

test("normalizes pasted HTML in public event descriptions", () => {
  const [properties] = parseVEvents(
    [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:pasted-html@example.test",
      "DTSTART;VALUE=DATE:20260822",
      "SUMMARY:3er Torneo",
      'DESCRIPTION:- Categoría con Bogu y sin Bogu<br>- Categoría por equipos<br><br><a href=" class="pastedDriveLink-0">',
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n"),
  );

  const event = parseCalendarEvent(properties);

  assert.equal(
    event.summary,
    "- Categoría con Bogu y sin Bogu\n- Categoría por equipos",
  );
});

test("rejects different Drive album folders", () => {
  const [properties] = parseVEvents(
    [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:albums@example.test",
      "DTSTART;VALUE=DATE:20260822",
      "SUMMARY:3er Torneo",
      "DESCRIPTION:https://drive.google.com/drive/folders/first-folder\\nhttps://drive.google.com/drive/folders/second-folder",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n"),
  );

  assert.throws(() => parseCalendarEvent(properties), /Multiple album URLs/);
});

test("Given timed and all-day events, When parsed, Then eligibility uses the last local event day instead of its ending hour", () => {
  const timed = parseCalendarEvent(
    parseVEvents(
      [
        "BEGIN:VCALENDAR",
        "BEGIN:VEVENT",
        "UID:timed@example.test",
        "DTSTART;TZID=America/Costa_Rica:20260808T130000",
        "DTEND;TZID=America/Costa_Rica:20260808T150000",
        "SUMMARY:Timed",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\n"),
    )[0],
  );
  const allDay = parseCalendarEvent(
    parseVEvents(
      [
        "BEGIN:VCALENDAR",
        "BEGIN:VEVENT",
        "UID:all-day@example.test",
        "DTSTART;VALUE=DATE:20260808",
        "DTEND;VALUE=DATE:20260809",
        "SUMMARY:All day",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\n"),
    )[0],
  );

  assert.equal(timed.archiveEligibleAt, "2026-08-10T06:00:00.000Z");
  assert.equal(allDay.archiveEligibleAt, "2026-08-10T06:00:00.000Z");
});

test("canonical slug uses only the normalized event title", () => {
  assert.equal(createCanonicalSlug("Torneo de América"), "torneo-de-america");
});
