import assert from "node:assert/strict";
import test from "node:test";

import {
  assertSafeCalendarInput,
  MASS_DISAPPEARANCE_MINIMUM,
  MASS_DISAPPEARANCE_RATIO,
  mergeRegistry,
  serializeCalendarEvents,
} from "../../scripts/sync-calendar-events.mjs";
import {
  REMOVED_HISTORICAL_FIELDS,
  makeHistoricalEvent,
  makeChangedCalendarEvent,
  mergeHistorical,
} from "../helpers/event-history-fixtures.mjs";

test("duplicate canonical slugs abort reconciliation", () => {
  assert.throws(
    () =>
      mergeRegistry({ version: 4, events: [] }, [
        makeHistoricalEvent(),
        makeHistoricalEvent(),
      ]),
    /Duplicate calendar canonical slug/,
  );
});

test("source timestamp alone does not create a historical editorial revision", () => {
  const previous = {
    ...makeHistoricalEvent(),
    sourceUpdatedAt: "2026-01-09T12:00:00.000Z",
  };
  const {
    historical: _historical,
    editorialState: _editorialState,
    ...current
  } = previous;
  current.sourceUpdatedAt = "2026-01-10T12:00:00.000Z";

  const result = mergeRegistry(
    { version: 4, events: [previous] },
    [current],
    new Date("2026-03-01T00:00:00.000Z"),
  );

  assert.equal(result.events[0].editorialState, "publicado");
  assert.equal(result.events[0].pendingRevision, undefined);
  assert.equal(result.events[0].sourceUpdatedAt, "2026-01-09T12:00:00.000Z");
});

test("Given one historical event disappears, When another remains in the feed, Then the missing snapshot remains public and pending", () => {
  const present = {
    ...makeHistoricalEvent(),
    sourceId: "present-source",
    slug: "2026-01-11-present",
    aliases: undefined,
  };
  const result = mergeRegistry(
    { version: 3, events: [makeHistoricalEvent(), present] },
    [{ ...present, historical: undefined }],
    new Date("2026-03-01T00:00:00.000Z"),
  );
  assert.deepEqual(
    result.events.find(
      ({ sourceId }) => sourceId === makeHistoricalEvent().sourceId,
    ),
    {
      ...makeHistoricalEvent(),
      editorialState: "pendiente",
      pendingRevision: result.events.find(
        ({ sourceId }) => sourceId === makeHistoricalEvent().sourceId,
      ).pendingRevision,
    },
  );
  assert.equal(
    serializeCalendarEvents(result.events).includes(makeHistoricalEvent().slug),
    true,
  );
});

test("Given every historical event disappears, When the registry is reconciled, Then synchronization aborts before changing historical publication", () => {
  assert.throws(
    () =>
      mergeRegistry(
        { version: 4, events: [makeHistoricalEvent()] },
        [],
        new Date("2026-03-01T00:00:00.000Z"),
      ),
    /all historical events disappeared/i,
  );
});

test("Given a future event, When Calendar changes every persisted editorial field, Then the changes remain editable", () => {
  const previous = {
    ...makeHistoricalEvent(),
    historical: false,
    archiveEligibleAt: "2026-04-13T06:00:00.000Z",
  };
  const current = {
    ...makeChangedCalendarEvent(),
    archiveEligibleAt: "2026-04-23T06:00:00.000Z",
  };
  const result = mergeRegistry(
    { version: 3, events: [previous] },
    [current],
    new Date("2026-03-01T00:00:00.000Z"),
  );
  assert.deepEqual(result.events[0], {
    ...current,
    aliases: [...previous.aliases, previous.slug],
    editorialState: "publicado",
  });
});

test("Given an event reaches archiveEligibleAt, When it synchronizes, Then its complete normalized event is captured once", () => {
  const current = {
    ...makeChangedCalendarEvent(),
    archiveEligibleAt: "2026-02-23T06:00:00.000Z",
  };
  const first = mergeRegistry(
    { version: 3, events: [] },
    [current],
    new Date("2026-03-01T00:00:00.000Z"),
  );

  assert.deepEqual(first.events, [
    { ...current, historical: true, editorialState: "publicado" },
  ]);
  const changed = mergeRegistry(
    first,
    [{ ...current, summary: "Cambio posterior" }],
    new Date("2026-03-02T00:00:00.000Z"),
  );
  assert.equal(changed.events[0].editorialState, "pendiente");
  assert.equal(changed.events[0].summary, current.summary);
});

test("Given a historical event, When Calendar changes every persisted field, Then its registry and generated TypeScript remain intact", () => {
  const generatedBefore = serializeCalendarEvents([makeHistoricalEvent()]);
  const result = mergeHistorical(makeHistoricalEvent());

  assert.equal(result.events[0].editorialState, "pendiente");
  assert.equal(result.events[0].title, makeHistoricalEvent().title);
  assert.equal(serializeCalendarEvents(result.events), generatedBefore);
});

test("Given a historical event, When Calendar removes persisted fields, Then its registry and generated TypeScript remain intact", () => {
  const current = { ...makeChangedCalendarEvent() };
  for (const field of REMOVED_HISTORICAL_FIELDS) delete current[field];

  const generatedBefore = serializeCalendarEvents([makeHistoricalEvent()]);
  const result = mergeHistorical(makeHistoricalEvent(), [current]);

  assert.equal(result.events[0].editorialState, "pendiente");
  assert.equal(result.events[0].title, makeHistoricalEvent().title);
  assert.equal(serializeCalendarEvents(result.events), generatedBefore);
});

test("Given a version 2 historical event, When the registry migrates, Then its existing identity is frozen", () => {
  const previous = {
    version: 2,
    events: [
      {
        sourceId: "legacy-source",
        slug: "2025-12-31-examen",
        title: "Examen original",
        date: "2025-12-31",
      },
    ],
  };
  const current = [
    {
      sourceId: "legacy-source",
      slug: "2026-01-10-examen-corregido",
      title: "Examen corregido",
      date: "2026-01-10",
      archiveEligibleAt: "2026-01-13T06:00:00.000Z",
    },
  ];

  const [event] = mergeRegistry(
    previous,
    current,
    new Date("2026-02-01T00:00:00Z"),
  ).events;
  assert.equal(event.slug, "2025-12-31-examen");
  assert.equal(event.title, "Examen original");
  assert.equal(event.date, "2025-12-31");
  assert.equal(event.archiveEligibleAt, "2026-01-02T06:00:00.000Z");
  assert.equal(event.historical, true);
});

test("a current title change preserves the previous URL as a redirect alias", () => {
  const previous = {
    version: 4,
    events: [
      {
        sourceId: "current-source",
        slug: "torneo-de-verano",
        aliases: ["2026-08-22-torneo-de-verano"],
        archiveEligibleAt: "2026-12-02T06:00:00.000Z",
        title: "Torneo de Verano",
        date: "2026-11-30",
        editorialState: "publicado",
      },
    ],
  };
  const current = [
    {
      sourceId: "current-source",
      slug: "copa-nacional-de-kendo",
      archiveEligibleAt: "2026-12-02T06:00:00.000Z",
      title: "Copa Nacional de Kendo",
      date: "2026-11-30",
    },
  ];

  const [event] = mergeRegistry(
    previous,
    current,
    new Date("2026-09-24T00:00:00.000Z"),
  ).events;

  assert.equal(event.slug, "copa-nacional-de-kendo");
  assert.deepEqual(event.aliases, [
    "2026-08-22-torneo-de-verano",
    "torneo-de-verano",
  ]);
});

test("a new title URL cannot reuse an existing alias", () => {
  const previous = {
    version: 4,
    events: [
      {
        sourceId: "renamed-source",
        slug: "torneo-de-verano",
        archiveEligibleAt: "2026-12-02T06:00:00.000Z",
        title: "Torneo de Verano",
        date: "2026-11-30",
        editorialState: "publicado",
      },
      {
        sourceId: "owner-source",
        slug: "encuentro-nacional",
        aliases: ["copa-nacional-de-kendo"],
        archiveEligibleAt: "2026-12-09T06:00:00.000Z",
        title: "Encuentro Nacional",
        date: "2026-12-07",
        editorialState: "publicado",
      },
    ],
  };
  const current = [
    {
      sourceId: "renamed-source",
      slug: "copa-nacional-de-kendo",
      archiveEligibleAt: "2026-12-02T06:00:00.000Z",
      title: "Copa Nacional de Kendo",
      date: "2026-11-30",
    },
    {
      sourceId: "owner-source",
      slug: "encuentro-nacional",
      archiveEligibleAt: "2026-12-09T06:00:00.000Z",
      title: "Encuentro Nacional",
      date: "2026-12-07",
    },
  ];

  assert.throws(
    () =>
      mergeRegistry(previous, current, new Date("2026-09-24T00:00:00.000Z")),
    /Duplicate calendar canonical slug or alias: copa-nacional-de-kendo/,
  );
});

test("the measured mass-disappearance threshold blocks publication while one absence remains pending", () => {
  const previous = {
    version: 4,
    events: Array.from({ length: 4 }, (_, index) => ({
      sourceId: `source-${index}`,
      slug: `2026-08-0${index + 1}-event`,
      title: `Event ${index}`,
      date: `2026-08-0${index + 1}`,
      editorialState: "publicado",
    })),
  };
  const current = previous.events.slice(0, 2);

  assert.throws(
    () => assertSafeCalendarInput(previous, current),
    new RegExp(`2 of 4.*threshold 2`, "i"),
  );
  assert.doesNotThrow(() =>
    assertSafeCalendarInput(previous, previous.events.slice(0, 3)),
  );
  assert.equal(MASS_DISAPPEARANCE_MINIMUM, 2);
  assert.equal(MASS_DISAPPEARANCE_RATIO, 0.5);
});
