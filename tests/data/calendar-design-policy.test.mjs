import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { temporaryDirectory } from "../helpers/temporary-directory.mjs";
import { writeFileSync } from "node:fs";
import { runDesignReview } from "../../scripts/review-calendar-design.ts";
import { synchronizeCalendar } from "../../scripts/sync-calendar-events.ts";
import {
  verificationSteps,
  runVerification,
} from "../../scripts/verify-site.mjs";

test("valid data with excess content stays published when the post-publication review detects broken design", async (t) => {
  const directory = await temporaryDirectory(t, "calendar-policy-");
  const source = path.join(directory, "source.ics");
  const outputPath = path.join(directory, "calendarEvents.ts");
  const registryPath = path.join(directory, "registry.json");
  await writeFile(
    source,
    `BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:layout-policy\nDTSTART;VALUE=DATE:20260808\nSUMMARY:Evento de prueba\nDESCRIPTION:${"Contenido extenso. ".repeat(100)}\nEND:VEVENT\nEND:VCALENDAR`,
  );
  await synchronizeCalendar({
    source,
    outputPath,
    registryPath,
    now: new Date("2026-08-04T18:00:00Z"),
  });
  const published = await readFile(outputPath, "utf8");
  assert.ok(published.includes("Contenido extenso."));
  runVerification({
    root: directory,
    mode: "calendar",
    captureFingerprint: () => "valid-data",
    executeStep: (_, step) => {
      assert.ok(!step.includes("test:design"));
    },
  });
  const measured = {
    route: "/eventos/evento-de-prueba/",
    event: "Evento de prueba",
    viewport: { width: 360, height: 800 },
    state: "initial",
    findings: [
      {
        rule: "overflow_horizontal",
        component: "description",
        measures: { scrollWidth: 500, clientWidth: 360 },
      },
    ],
  };
  const report = await runDesignReview({
    directory,
    gitSaved: true,
    captureFingerprint: async () => "generated-content",
    execute: (directory) => {
      writeFileSync(
        path.join(directory, "playwright.json"),
        JSON.stringify({
          specs: [
            {
              title: "event",
              tests: [
                {
                  results: [
                    {
                      status: "failed",
                      attachments: [
                        {
                          name: "calendar-layout-findings",
                          body: Buffer.from(JSON.stringify(measured)).toString(
                            "base64",
                          ),
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      );
      return 1;
    },
  });
  assert.equal(report.gitSaved, true);
  assert.ok(report.findings.some((finding) => finding.kind === "diseno_roto"));
  assert.equal(await readFile(outputPath, "utf8"), published);
  const notifications = JSON.parse(
    await readFile(path.join(directory, "calendar-notifications.json"), "utf8"),
  );
  assert.ok(
    notifications.notifications.some(
      (notification) => notification.kind === "diseno_roto",
    ),
  );
});

test("calendar gate blocks functional failures and omits design while full gate retains it", () => {
  const steps = verificationSteps("test:unit", "calendar");
  assert.ok(steps.some((step) => step.includes("typecheck")));
  assert.ok(steps.some((step) => step.includes("build")));
  assert.ok(steps.some((step) => step.includes("test:behavior")));
  assert.ok(!steps.some((step) => step.includes("test:design")));
  assert.ok(verificationSteps().some((step) => step.includes("test:design")));
  for (const command of ["typecheck", "build", "test:behavior"])
    assert.throws(
      () =>
        runVerification({
          root: ".",
          mode: "calendar",
          captureFingerprint: () => "unchanged",
          executeStep: (_, step) => {
            if (step.includes(command)) throw new Error("controlled failure");
          },
        }),
      /controlled failure/,
    );
  assert.throws(
    () => verificationSteps("test:unit", "untrusted"),
    /Unsupported verification mode/,
  );
});

test("a runner startup failure after publication alerts without rolling back data", async (t) => {
  const directory = await temporaryDirectory(t, "calendar-design-");
  const before = await readFile(
    "src/app/data/calendarEventRegistry.json",
    "utf8",
  );
  const report = await runDesignReview({
    directory,
    gitSaved: true,
    execute: () => {
      throw new Error("browser unavailable");
    },
  });
  assert.equal(report.gitSaved, true);
  assert.ok(
    report.findings.some(
      (finding) => finding.kind === "revision_diseno_no_completada",
    ),
  );
  assert.equal(
    await readFile("src/app/data/calendarEventRegistry.json", "utf8"),
    before,
  );
});
