import { temporaryDirectory } from "../helpers/temporary-directory.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  assertSafeCalendarInput,
  createCalendarFailureNotification,
  createCalendarNotifications,
  getCalendarNotificationWarnings,
  recordCalendarNotifications,
  mergeRegistry,
  writeCalendarNotificationsSummary,
} from "../../scripts/sync-calendar-events.mjs";
import { formatCalendarNotificationEmail } from "../../scripts/write-calendar-notification-email.mjs";
import {
  makeHistoricalEvent,
  makePendingRevision,
  makeRegistry,
} from "../helpers/event-history-fixtures.mjs";

function captureError(operation) {
  try {
    operation();
  } catch (error) {
    return error;
  }
  throw new Error("Expected operation to fail.");
}

test("F4: pending revisions emit one redacted actionable notification per evidence fingerprint", () => {
  const pending = makePendingRevision({ received: null });
  pending.pendingRevision.evidence.published.infoUrl =
    "https://drive.google.com/drive/folders/private-folder";
  const execution = {
    origin: "github_actions",
    runId: "123",
    attempt: "2",
    trigger: "schedule",
  };
  const report = createCalendarNotifications(
    { version: 4, events: [pending, structuredClone(pending)] },
    execution,
  );

  assert.equal(report.version, 1);
  assert.equal(report.notifications.length, 1);
  const [notification] = report.notifications;
  assert.equal(notification.kind, "revision_pendiente");
  assert.equal(notification.temporality, "historico");
  assert.equal(
    notification.fingerprints.revisionId,
    pending.pendingRevision.id,
  );
  assert.equal(
    notification.fingerprints.evidenceFingerprint,
    pending.pendingRevision.evidence.fingerprint,
  );
  assert.deepEqual(notification.execution, execution);
  assert.match(notification.actionRequired, /Revisar/);
  assert.doesNotMatch(
    JSON.stringify(notification),
    /drive\.google\.com|private-folder/,
  );
});

test("F4: an emitted pending revision is not notified again until its evidence changes", () => {
  const pending = makeRegistry({
    events: [makePendingRevision({ received: null })],
  });
  const firstReport = createCalendarNotifications(pending);
  const recorded = recordCalendarNotifications(pending, firstReport);

  assert.equal(firstReport.notifications.length, 1);
  assert.equal(createCalendarNotifications(recorded).notifications.length, 0);

  const revised = structuredClone(recorded);
  revised.events.find(
    ({ sourceId }) => sourceId === makeHistoricalEvent().sourceId,
  ).pendingRevision.evidence.fingerprint = "new-evidence-fingerprint";
  assert.equal(createCalendarNotifications(revised).notifications.length, 1);
});

test("F4: source, parser, mass-disappearance, and verification failures have safe actionable notifications", () => {
  const duplicateSourceError = captureError(() =>
    assertSafeCalendarInput({ version: 4, events: [] }, [
      {
        sourceId: "duplicate-source",
        slug: "primer-evento",
        title: "Primer evento",
        date: "2026-10-01",
      },
      {
        sourceId: "duplicate-source",
        slug: "segundo-evento",
        title: "Segundo evento",
        date: "2026-11-01",
      },
    ]),
  );
  const duplicateUrlError = captureError(() =>
    mergeRegistry({ version: 4, events: [] }, [
      {
        sourceId: "first-source",
        slug: "evento-duplicado",
        title: "Evento duplicado",
        date: "2026-10-01",
      },
      {
        sourceId: "second-source",
        slug: "evento-duplicado",
        title: "Evento duplicado",
        date: "2026-11-01",
      },
    ]),
  );
  const cases = [
    [duplicateSourceError, "id_fuente_duplicado"],
    [duplicateUrlError, "url_evento_duplicada"],
    [new Error("Calendar request failed: 403 Forbidden"), "fuente_inaccesible"],
    [
      new Error("Invalid iCalendar feed: VCALENDAR boundaries are missing."),
      "parser_o_fuente_invalida",
    ],
    [
      new Error(
        "Mass calendar disappearance detected: 2 of 4 published events are absent (threshold 2); no files were changed.",
      ),
      "desaparicion_masiva",
    ],
    [new Error("Verification failed: typecheck."), "verificacion_fallida"],
  ];
  for (const [error, kind] of cases) {
    const report = createCalendarFailureNotification(error);
    assert.equal(report.notifications.length, 1);
    assert.equal(report.notifications[0].kind, kind);
    assert.match(report.notifications[0].actionRequired, /Revisar|Corregir/);
    const warnings = getCalendarNotificationWarnings(report);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /^::warning title=Calendario: /);
    assert.doesNotMatch(warnings[0], new RegExp(`title=Calendario: ${kind}`));
  }

  const duplicateSourceReport =
    createCalendarFailureNotification(duplicateSourceError);
  assert.deepEqual(duplicateSourceReport.notifications[0].identity, {
    sourceId: "duplicate-source",
  });
  assert.equal(
    duplicateSourceReport.notifications[0].before.slug,
    "primer-evento",
  );
  assert.equal(
    duplicateSourceReport.notifications[0].after.slug,
    "segundo-evento",
  );
  assert.match(
    formatCalendarNotificationEmail(
      duplicateSourceReport,
      "alerts@example.test",
      "owner@example.test",
    ),
    /Tipo: id_fuente_duplicado/,
  );

  const duplicateUrlReport =
    createCalendarFailureNotification(duplicateUrlError);
  assert.deepEqual(duplicateUrlReport.notifications[0].identity, {
    slug: "evento-duplicado",
  });
  assert.match(
    getCalendarNotificationWarnings(duplicateUrlReport)[0],
    /URLs duplicadas de eventos/,
  );
});

test("F4: failure summaries redact private values and retain duplicate details", async (t) => {
  const duplicateUrlError = captureError(() =>
    mergeRegistry({ version: 4, events: [] }, [
      {
        sourceId: "first-source",
        slug: "evento-duplicado",
        title: "Evento duplicado",
        date: "2026-10-01",
      },
      {
        sourceId: "second-source",
        slug: "evento-duplicado",
        title: "Evento duplicado",
        date: "2026-11-01",
      },
    ]),
  );
  const duplicateUrlReport =
    createCalendarFailureNotification(duplicateUrlError);
  const directory = await temporaryDirectory(t, "fak-f4-summary-");

  const summaryPath = path.join(directory, "summary.md");
  const failure = createCalendarFailureNotification(
    new Error(
      "Calendar request failed: https://calendar.example.test/private.ics?token=secret",
    ),
    {
      origin: "github_actions",
      runId: "456",
      attempt: "1",
      trigger: "workflow_dispatch",
    },
  );
  await writeCalendarNotificationsSummary(failure, summaryPath);
  const summary = await readFile(summaryPath, "utf8");
  assert.doesNotMatch(summary, /private\.ics|token=secret/);
  assert.match(summary, /run `456`/);
  assert.match(summary, /No se pudo leer la fuente del calendario/);
  assert.match(
    summary,
    /<summary>Detalles tecnicos para diagnostico automatico/,
  );
  assert.match(summary, /"before": null/);

  const duplicateSummaryPath = path.join(directory, "duplicate-summary.md");
  await writeCalendarNotificationsSummary(
    duplicateUrlReport,
    duplicateSummaryPath,
  );
  const duplicateSummary = await readFile(duplicateSummaryPath, "utf8");
  assert.match(duplicateSummary, /URLs duplicadas de eventos/);
  assert.match(
    duplicateSummary,
    /\| Titulo \| Evento duplicado \| Evento duplicado \|/,
  );
  assert.match(duplicateSummary, /\| Fecha \| 2026-10-01 \| 2026-11-01 \|/);
  assert.doesNotMatch(duplicateSummary, /url\\_evento\\_duplicada/);
});

test("F4: the approved email delivery body contains only the redacted structured notification", () => {
  const report = createCalendarFailureNotification(
    new Error(
      "Calendar request failed: https://calendar.example.test/private.ics?token=secret",
    ),
  );
  const email = formatCalendarNotificationEmail(
    report,
    "alerts@example.test",
    "andresgmr1@gmail.com",
  );

  assert.match(email, /To: andresgmr1@gmail\.com/);
  assert.match(email, /Accion requerida:/);
  assert.doesNotMatch(email, /private\.ics|token=secret/);
  assert.equal(
    formatCalendarNotificationEmail(
      { version: 1, notifications: [] },
      "alerts@example.test",
      "andresgmr1@gmail.com",
    ),
    null,
  );
});
