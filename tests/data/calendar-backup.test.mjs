import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { parse } from "yaml";
import {
  backupCalendar,
  restoreCalendar,
} from "../../scripts/calendar-backup.mjs";
import { temporaryDirectory } from "../helpers/temporary-directory.mjs";
import { createIcs } from "../helpers/calendar-fixtures.mjs";

function fixture(overrides = {}) {
  const env = {
    CALENDAR_BACKUP_CF_ACCOUNT_ID: "a".repeat(32),
    CALENDAR_BACKUP_R2_BUCKET: "private-calendar",
    CALENDAR_BACKUP_CF_API_TOKEN: "test-token",
    CALENDAR_ICS_URL: "https://calendar.example.test/private.ics",
  };
  const bytes = Buffer.from(
    createIcs([
      { uid: "restore@example.test", title: "Restauración de examen" },
    ]).replaceAll("\n", "\r\n"),
  );
  const objects = new Map();
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const href = String(url);
    calls.push({ url: href, options });
    if (href === env.CALENDAR_ICS_URL) {
      assert.equal(options.headers?.authorization, undefined);
      return new Response(overrides.source ?? bytes);
    }
    assert.equal(options.headers.authorization, "Bearer test-token");
    const json = (result) => Response.json({ success: true, result });
    if (href.endsWith("/domains/managed"))
      return json({ enabled: overrides.public ?? false });
    if (href.endsWith("/domains/custom"))
      return json({ domains: overrides.domains ?? [] });
    if (href.endsWith("/lifecycle"))
      return json({
        rules: overrides.rules ?? [
          {
            enabled: true,
            conditions: { prefix: "calendar/" },
            deleteObjectsTransition: {
              condition: { type: "Age", maxAge: 2592000 },
            },
          },
        ],
      });
    const key = href.split("/objects/")[1];
    if (options.method === "PUT") {
      objects.set(key, Buffer.from(options.body));
      return json({ key });
    }
    if (!objects.has(key)) return new Response(null, { status: 404 });
    return new Response(
      overrides.corrupt ? Buffer.from("corrupted") : objects.get(key),
    );
  };
  return {
    env,
    bytes,
    objects,
    calls,
    fetchImpl,
    now: new Date("2026-11-24T09:15:00Z"),
  };
}

test("backs up exact private ICS bytes, verifies remote readback and restores a new local file", async (t) => {
  const context = fixture();
  const result = await backupCalendar(context);
  assert.equal(result.restorationVerified, true);
  assert.deepEqual(context.objects.get(result.key), context.bytes);
  const directory = await temporaryDirectory(t, "calendar-restore-");
  const outputPath = path.join(directory, "restored.ics");
  const restored = await restoreCalendar({
    ...context,
    key: result.key,
    outputPath,
  });
  assert.equal(restored.sha256, result.sha256);
  assert.deepEqual(await readFile(outputPath), context.bytes);
  await assert.rejects(
    restoreCalendar({ ...context, key: result.key, outputPath }),
    /EEXIST/,
  );
  assert.deepEqual(await readFile(outputPath), context.bytes);
});

for (const options of [
  { public: true },
  { domains: [{ enabled: true }] },
  { rules: [] },
  {
    rules: [
      {
        enabled: true,
        conditions: { prefix: "calendar/" },
        deleteObjectsTransition: { condition: { type: "Age", maxAge: 86400 } },
      },
    ],
  },
]) {
  test(`rejects unsafe bucket policy ${JSON.stringify(options)}`, async () => {
    const context = fixture(options);
    await assert.rejects(backupCalendar(context));
    assert.equal(context.objects.size, 0);
    assert.equal(
      context.calls.some(({ url }) => url === context.env.CALENDAR_ICS_URL),
      false,
    );
  });
}

test("never uploads an invalid or empty calendar", async () => {
  for (const source of [
    "<html>Error</html>",
    "BEGIN:VCALENDAR\r\nEND:VCALENDAR",
  ]) {
    const context = fixture({ source });
    await assert.rejects(backupCalendar(context));
    assert.equal(context.objects.size, 0);
  }
});

test("corrupted remote snapshot fails the backup restoration check", async () => {
  await assert.rejects(backupCalendar(fixture({ corrupt: true })), /checksum/);
});

test("failed restoration leaves an existing destination untouched", async (t) => {
  const context = fixture();
  const directory = await temporaryDirectory(t, "calendar-restore-fail-");
  const outputPath = path.join(directory, "original.ics");
  await writeFile(outputPath, "original");
  await assert.rejects(
    restoreCalendar({ ...context, key: "other/key", outputPath }),
    /Invalid backup/,
  );
  assert.equal(await readFile(outputPath, "utf8"), "original");
});

test("daily backup workflow uses private storage, scoped credentials and no ICS artifacts", async () => {
  const workflow = parse(
    await readFile(
      new URL("../../.github/workflows/backup-calendar.yml", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(workflow.on.schedule[0].cron, "15 9 * * *");
  assert.deepEqual(workflow.permissions, { contents: "read" });
  const steps = workflow.jobs.backup.steps;
  assert.equal(steps[0].with["persist-credentials"], false);
  assert.equal(
    steps.some((step) => step.uses?.startsWith("actions/upload-artifact")),
    false,
  );
  assert.match(steps.at(-1).env.CALENDAR_ICS_URL, /secrets.CALENDAR_ICS_URL/);
  assert.equal(
    steps.slice(0, -1).some((step) => step.env?.CALENDAR_BACKUP_CF_API_TOKEN),
    false,
  );
});
