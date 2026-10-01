import { temporaryDirectory } from "../helpers/temporary-directory.mjs";
import assert from "node:assert/strict";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

import {
  applyEditorialDecisionToFiles,
  serializeCalendarEvents,
  synchronizeCalendar,
} from "../../scripts/sync-calendar-events.mjs";
import { makePendingRevision } from "../helpers/event-history-fixtures.mjs";

test("F5: a stale file-backed decision leaves the persisted registry and published output untouched", async (t) => {
  const pending = makePendingRevision({ received: null });
  const directory = await temporaryDirectory(t, "fak-f5-decision-");

  const registryPath = path.join(directory, "calendarEventRegistry.json");
  const outputPath = path.join(directory, "calendarEvents.ts");
  const beforeRegistry = `${JSON.stringify({ version: 4, events: [pending] }, null, 2)}\n`;
  const beforeOutput = serializeCalendarEvents([pending]);
  await writeFile(registryPath, beforeRegistry);
  await writeFile(outputPath, beforeOutput);
  const decision = {
    sourceId: pending.sourceId,
    revisionId: pending.pendingRevision.id,
    evidenceFingerprint: pending.pendingRevision.evidence.fingerprint,
    action: "reject_deletion",
    decisionRecordId: "presidencia-2026-03-03-03",
    actorRole: "presidencia",
    decidedAt: "2026-03-03T00:00:00.000Z",
  };

  await t.test("stale evidence leaves both files unchanged", async () => {
    await assert.rejects(
      applyEditorialDecisionToFiles({
        registryPath,
        outputPath,
        decision: { ...decision, evidenceFingerprint: "stale" },
      }),
      /stale/,
    );
    assert.equal(await readFile(registryPath, "utf8"), beforeRegistry);
    assert.equal(await readFile(outputPath, "utf8"), beforeOutput);
  });

  await t.test(
    "current evidence updates the persisted publication",
    async () => {
      await applyEditorialDecisionToFiles({
        registryPath,
        outputPath,
        decision,
      });
      assert.equal(
        JSON.parse(await readFile(registryPath, "utf8")).events[0]
          .editorialState,
        "publicado",
      );
      assert.equal(
        (await readFile(outputPath, "utf8")).includes(pending.slug),
        true,
      );
    },
  );
});

test("C4: Calendar and a first gallery publication leave no mixed artifacts when staging calendar output fails", async (t) => {
  const directory = await temporaryDirectory(t, "fak-c4-atomic-");

  const sourcePath = path.join(directory, "calendar.ics");
  const blockedParent = path.join(directory, "blocked");
  const galleryOptions = {
    manifestPath: path.join(directory, "eventGalleries.ts"),
    statePath: path.join(directory, "eventGalleryState.json"),
    imagesRoot: path.join(directory, "images"),
    listFolder: async () => [{ id: "private-id", name: "1.jpg" }],
  };
  await writeFile(blockedParent, "not a directory");
  await writeFile(
    sourcePath,
    [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:c4@example.test",
      "DTSTART;VALUE=DATE:20260110",
      "SUMMARY:C4 event",
      "DESCRIPTION:Public text\\n---\\nALBUM_FOTOS: https://drive.google.com/drive/folders/approved",
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n"),
  );
  galleryOptions.downloadFile = async () =>
    sharp({
      create: { width: 640, height: 480, channels: 3, background: "red" },
    })
      .jpeg()
      .toBuffer();
  await assert.rejects(
    synchronizeCalendar({
      source: sourcePath,
      registryPath: path.join(directory, "registry.json"),
      outputPath: path.join(blockedParent, "calendarEvents.ts"),
      now: new Date("2026-03-01T00:00:00.000Z"),
      galleryOptions,
    }),
  );
  await assert.rejects(stat(galleryOptions.manifestPath), /ENOENT/);
  await assert.rejects(stat(galleryOptions.statePath), /ENOENT/);
  await assert.rejects(stat(galleryOptions.imagesRoot), /ENOENT/);
  await assert.rejects(stat(path.join(directory, "registry.json")), /ENOENT/);
});
