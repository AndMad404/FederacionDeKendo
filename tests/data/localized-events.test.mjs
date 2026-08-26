import assert from "node:assert/strict";
import test from "node:test";

import {
  CALENDAR_EVENTS,
  getEventTranslationStatus,
  getLocalizedEvent,
  getLocalizedEvents,
} from "../../dist-ssr/entry-server.js";

const gasshuku = CALENDAR_EVENTS.find(
  ({ id }) => id === "2026-09-12-gasshuku-monteverde",
);

test("uses the reviewed English Gasshuku translation from the editorial record", () => {
  const localized = getLocalizedEvent(gasshuku, "en");

  assert.equal(getEventTranslationStatus(gasshuku), "valid");
  assert.equal(localized?.title, "Gasshuku Monteverde");
  assert.match(localized?.summary ?? "", /round-trip transportation/);
  assert.doesNotMatch(localized?.summary ?? "", /La participación incluye/);
});

test("classifies absent and changed editorial translations without falling back", () => {
  const missing = { ...gasshuku, id: "not-translated" };
  const stale = { ...gasshuku, title: "Gasshuku Monteverde actualizado" };

  assert.equal(getEventTranslationStatus(missing), "missing");
  assert.equal(getEventTranslationStatus(stale), "stale");
  assert.equal(getLocalizedEvent(missing, "en"), undefined);
  assert.equal(getLocalizedEvent(stale, "en"), undefined);
});

test("omits unavailable English events while retaining their Spanish publication", () => {
  const stale = { ...gasshuku, summary: "Texto español actualizado." };

  assert.deepEqual(getLocalizedEvents([stale], "en"), []);
  assert.deepEqual(getLocalizedEvents([stale], "es"), [stale]);
});
