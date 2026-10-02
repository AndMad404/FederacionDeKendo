import assert from "node:assert/strict";
import test from "node:test";

import {
  applyEditorialDecision,
  createCalendarNotifications,
  recordCalendarNotifications,
  decidePendingDeletion,
  mergeRegistry,
  serializeCalendarEvents,
} from "../../scripts/sync-calendar-events.ts";
import {
  makeHistoricalEvent,
  makePendingRevision,
  makeRegistry,
} from "../helpers/event-history-fixtures.mjs";

test("F1: rejecting a pending absence keeps the event published", () => {
  const missing = makePendingRevision({ received: null });
  assert.equal(missing.editorialState, "pendiente");
  assert.equal(serializeCalendarEvents([missing]).includes(missing.slug), true);
  const rejected = decidePendingDeletion(missing, {
    action: "reject_deletion",
    revisionId: missing.pendingRevision.id,
  });
  assert.equal(rejected.editorialState, "publicado");
  assert.equal(rejected.pendingRevision, undefined);
});

test("F1: an obsolete decision cannot change a pending absence", () => {
  const missing = makePendingRevision({ received: null });
  assert.throws(
    () =>
      decidePendingDeletion(missing, {
        action: "approve_deletion",
        revisionId: "obsolete",
      }),
    /stale/,
  );
});

test("F1: approving a pending absence removes it from publication", () => {
  const missing = makePendingRevision({ received: null });
  const removed = decidePendingDeletion(missing, {
    action: "approve_deletion",
    revisionId: missing.pendingRevision.id,
  });
  assert.equal(removed.editorialState, "eliminado");
  assert.equal(
    serializeCalendarEvents([removed]).includes(removed.slug),
    false,
  );
  assert.equal(removed.pendingRevision.id, missing.pendingRevision.id);
});

test("F1: a missing event becomes published again when it reappears", () => {
  const missing = makePendingRevision({ received: null });
  const reappeared = mergeRegistry(
    makeRegistry({ events: [missing] }),
    [{ ...makeHistoricalEvent() }],
    new Date("2026-03-01T00:00:00.000Z"),
  ).events[0];
  assert.equal(reappeared.editorialState, "publicado");
  assert.equal(reappeared.pendingRevision, undefined);
});

test("F3: pending revisions are byte-stable for identical evidence", () => {
  const changed = {
    ...makeHistoricalEvent(),
    title: "Propuesta con enlace privado",
    infoUrl: "https://drive.google.com/drive/folders/private-folder",
    summary:
      "Fuente privada https://calendar.example.test/private.ics?token=secret",
  };
  const firstAt = new Date("2026-03-01T00:00:00.000Z");
  const first = mergeRegistry(
    { version: 4, events: [makeHistoricalEvent()] },
    [changed],
    firstAt,
  ).events[0];
  const second = mergeRegistry(
    { version: 4, events: [first] },
    [changed],
    new Date("2026-03-02T00:00:00.000Z"),
  ).events[0];

  assert.equal(
    first.pendingRevision.evidence.sourceId,
    makeHistoricalEvent().sourceId,
  );
  assert.equal(
    first.pendingRevision.evidence.firstDetectedAt,
    "2026-03-01T00:00:00.000Z",
  );
  assert.equal(
    second.pendingRevision.evidence.firstDetectedAt,
    first.pendingRevision.evidence.firstDetectedAt,
  );
  assert.equal(
    second.pendingRevision.evidence.lastObservedAt,
    first.pendingRevision.evidence.lastObservedAt,
  );
  assert.deepEqual(second, first);
  assert.equal(
    first.pendingRevision.evidence.fingerprint,
    second.pendingRevision.evidence.fingerprint,
  );
  assert.equal(
    first.pendingRevision.evidence.lastReceived.infoUrl,
    "[redacted]",
  );
  assert.doesNotMatch(
    JSON.stringify(second.pendingRevision.evidence),
    /drive\.google\.com|private-folder|private\.ics|token=secret/,
  );
});

test("F3: rejected absences remain resolved until reappearance or new evidence", () => {
  const present = {
    ...makeHistoricalEvent(),
    sourceId: "present-source",
    slug: "2026-01-11-present",
    aliases: undefined,
  };
  const firstRegistry = mergeRegistry(
    { version: 4, events: [makeHistoricalEvent(), present] },
    [present],
    new Date("2026-03-01T00:00:00.000Z"),
  );
  const pending = firstRegistry.events.find(
    ({ sourceId }) => sourceId === makeHistoricalEvent().sourceId,
  );
  const firstReport = createCalendarNotifications(firstRegistry);
  const notified = recordCalendarNotifications(firstRegistry, firstReport);
  const rejected = applyEditorialDecision(notified, {
    sourceId: pending.sourceId,
    revisionId: pending.pendingRevision.id,
    evidenceFingerprint: pending.pendingRevision.evidence.fingerprint,
    action: "reject_deletion",
    decisionRecordId: "presidencia-2026-03-03-idempotence",
    actorRole: "presidencia",
    decidedAt: "2026-03-03T00:00:00.000Z",
  });

  const stillAbsent = mergeRegistry(
    rejected,
    [present],
    new Date("2026-03-04T00:00:00.000Z"),
  );
  assert.deepEqual(stillAbsent, rejected);
  assert.equal(
    createCalendarNotifications(stillAbsent).notifications.length,
    0,
  );
  assert.equal(
    serializeCalendarEvents(stillAbsent.events),
    serializeCalendarEvents(rejected.events),
  );

  const reappeared = mergeRegistry(
    stillAbsent,
    [makeHistoricalEvent(), present],
    new Date("2026-03-05T00:00:00.000Z"),
  );
  const restored = reappeared.events.find(
    ({ sourceId }) => sourceId === makeHistoricalEvent().sourceId,
  );
  assert.equal(restored.editorialDecision, undefined);

  const absentAgain = mergeRegistry(
    reappeared,
    [present],
    new Date("2026-03-06T00:00:00.000Z"),
  );
  const reopened = absentAgain.events.find(
    ({ sourceId }) => sourceId === makeHistoricalEvent().sourceId,
  );
  assert.equal(reopened.editorialState, "pendiente");
  assert.notEqual(
    reopened.pendingRevision.evidence.firstDetectedAt,
    pending.pendingRevision.evidence.firstDetectedAt,
  );
  assert.equal(
    createCalendarNotifications(absentAgain).notifications.length,
    1,
  );
});

test("F3: materially different evidence creates a new fingerprint and notification", () => {
  const first = mergeRegistry(
    { version: 4, events: [makeHistoricalEvent()] },
    [{ ...makeHistoricalEvent(), title: "Primera correccion" }],
    new Date("2026-03-01T00:00:00.000Z"),
  );
  const recorded = recordCalendarNotifications(
    first,
    createCalendarNotifications(first),
  );
  const second = mergeRegistry(
    recorded,
    [{ ...makeHistoricalEvent(), title: "Segunda correccion" }],
    new Date("2026-03-02T00:00:00.000Z"),
  );
  assert.notEqual(
    second.events[0].pendingRevision.evidence.fingerprint,
    first.events[0].pendingRevision.evidence.fingerprint,
  );
  assert.equal(
    second.events[0].pendingRevision.evidence.lastObservedAt,
    "2026-03-02T00:00:00.000Z",
  );
  assert.equal(createCalendarNotifications(second).notifications.length, 1);
});

test("F3: a deletion decision retains the linked pending evidence", () => {
  const pending = makePendingRevision({ received: null });
  const removed = decidePendingDeletion(pending, {
    action: "approve_deletion",
    revisionId: pending.pendingRevision.id,
    decidedAt: "2026-03-03T00:00:00.000Z",
    reason: "Retirado por Presidencia",
  });
  assert.equal(
    removed.editorialDecision.revisionId,
    pending.pendingRevision.id,
  );
  assert.equal(
    removed.editorialDecision.evidenceFingerprint,
    pending.pendingRevision.evidence.fingerprint,
  );
  assert.equal(removed.editorialDecision.decidedAt, "2026-03-03T00:00:00.000Z");
  assert.equal(
    serializeCalendarEvents([removed]).includes(removed.slug),
    false,
  );
});

test("F5: only a recorded decision for the current revision and evidence can change publication", async (t) => {
  const pending = makePendingRevision({ received: null });
  const decision = {
    sourceId: pending.sourceId,
    revisionId: pending.pendingRevision.id,
    evidenceFingerprint: pending.pendingRevision.evidence.fingerprint,
    action: "reject_deletion",
    decisionRecordId: "presidencia-2026-03-03-01",
    actorRole: "presidencia",
    decidedAt: "2026-03-03T00:00:00.000Z",
  };
  await t.test("current recorded decision preserves publication", () => {
    const updated = applyEditorialDecision(
      makeRegistry({ events: [pending] }),
      decision,
    );
    assert.equal(updated.events[0].editorialState, "publicado");
    assert.equal(
      updated.events[0].editorialDecision.decisionRecordId,
      decision.decisionRecordId,
    );
    assert.equal(
      updated.events[0].editorialDecision.evidenceFingerprint,
      decision.evidenceFingerprint,
    );
    assert.equal(
      serializeCalendarEvents(updated.events).includes(pending.slug),
      true,
    );
  });
  await t.test("stale evidence is rejected", () => {
    assert.throws(
      () =>
        applyEditorialDecision(makeRegistry({ events: [pending] }), {
          ...decision,
          evidenceFingerprint: "stale",
        }),
      /stale/,
    );
  });
  await t.test("missing record identifier is rejected", () => {
    assert.throws(
      () =>
        applyEditorialDecision(makeRegistry({ events: [pending] }), {
          ...decision,
          decisionRecordId: "",
        }),
      /record identifier/,
    );
  });
});

test("F5: a future deletion is reserved for Presidencia and preserves its revision evidence", async (t) => {
  const future = {
    ...makeHistoricalEvent(),
    historical: false,
    date: "2027-01-10",
    archiveEligibleAt: "2027-01-13T06:00:00.000Z",
  };
  const pending = makePendingRevision({ event: future, received: null });
  const decision = {
    sourceId: pending.sourceId,
    revisionId: pending.pendingRevision.id,
    evidenceFingerprint: pending.pendingRevision.evidence.fingerprint,
    action: "approve_deletion",
    decisionRecordId: "presidencia-2026-03-03-02",
    decidedAt: "2026-03-03T00:00:00.000Z",
  };
  await t.test("a delegate cannot authorize deletion", () => {
    assert.throws(
      () =>
        applyEditorialDecision(makeRegistry({ events: [pending] }), {
          ...decision,
          actorRole: "delegado",
        }),
      /Only Presidencia/,
    );
  });
  await t.test("Presidencia can delete while retaining evidence", () => {
    const updated = applyEditorialDecision(
      makeRegistry({ events: [pending] }),
      { ...decision, actorRole: "presidencia" },
    );
    assert.equal(updated.events[0].editorialState, "eliminado");
    assert.equal(
      updated.events[0].pendingRevision.evidence.fingerprint,
      decision.evidenceFingerprint,
    );
    assert.equal(
      serializeCalendarEvents(updated.events).includes(pending.slug),
      false,
    );
  });
});
