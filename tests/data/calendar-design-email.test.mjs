import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { temporaryDirectory } from "../helpers/temporary-directory.mjs";
import {
  browserFindings,
  designNotifications,
} from "../../scripts/review-calendar-design.ts";
import {
  formatCalendarNotificationEmail,
  calendarScreenshotAttachments,
} from "../../scripts/write-calendar-notification-email.mjs";

test("broken-design emails attach captures from the evidence directory and reject unrelated files", async (t) => {
  const directory = await temporaryDirectory(t, "calendar-captures-");
  const screenshot = path.join(directory, "capture.png");
  await writeFile(screenshot, Buffer.from("iVBORw0KGgo=", "base64"));
  const notifications = designNotifications(
    [
      {
        kind: "diseno_roto",
        event: "evento",
        route: "/eventos/evento/",
        viewport: null,
        rule: "recorte",
        component: "actions",
        measures: {},
        screenshot,
      },
    ],
    "local",
    true,
  );
  const attachments = await calendarScreenshotAttachments(
    { notifications: [...notifications, ...notifications] },
    directory,
  );
  assert.equal(attachments.length, 1);
  const email = formatCalendarNotificationEmail(
    { notifications },
    "sender@example.com",
    "recipient@example.com",
    attachments,
  );
  assert.match(email, /multipart\/mixed/);
  assert.match(
    email,
    /Content-Disposition: attachment; filename="calendar-layout-1.png"/,
  );
  assert.ok(email.includes("iVBORw0KGgo="));
  await assert.rejects(
    calendarScreenshotAttachments(
      { notifications },
      path.join(directory, "elsewhere"),
    ),
    /artifact directory/,
  );
});

test("measured breakage includes event, route, viewport, rule, measures and screenshot in the existing email", async () => {
  const record = {
    event: "Examen",
    route: "/eventos/examen/",
    viewport: { width: 360, height: 800 },
    state: "initial",
    findings: [
      {
        rule: "recorte",
        component: "actions",
        measures: { width: 20, minimum: 44 },
      },
    ],
  };
  const findings = await browserFindings({
    specs: [
      {
        title: "test",
        tests: [
          {
            results: [
              {
                status: "failed",
                attachments: [
                  {
                    name: "calendar-layout-findings",
                    body: Buffer.from(JSON.stringify(record)).toString(
                      "base64",
                    ),
                  },
                  { name: "calendar-layout-breakage", path: "/capture.png" },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
  assert.equal(findings[0].kind, "diseno_roto");
  assert.equal(findings[0].screenshot, "/capture.png");
  const email = formatCalendarNotificationEmail(
    {
      notifications: designNotifications(
        findings,
        "https://github.com/example/repo/actions/runs/1",
        true,
      ),
    },
    "sender@example.com",
    "recipient@example.com",
  );
  for (const value of [
    "diseno_roto",
    "360x800",
    "recorte",
    "actions",
    "capture.png",
    "guardados en Git",
    "Cloudflare: no verificado",
    "calendar-design-review",
  ])
    assert.ok(email.includes(value));
});
