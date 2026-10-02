import assert from "node:assert/strict";
import test from "node:test";
import {
  browserFindings,
  browserMeasurements,
  measurementSummary,
  designNotifications,
} from "../../scripts/review-calendar-design.ts";

test("empty, skipped or interrupted browser reviews report incomplete design separately", async () => {
  assert.equal(
    (await browserFindings({ suites: [] }))[0].kind,
    "revision_diseno_no_completada",
  );
  for (const status of ["skipped", "interrupted", "timedOut", "failed"]) {
    const findings = await browserFindings({
      specs: [
        { title: "test", tests: [{ results: [{ status, attachments: [] }] }] },
      ],
    });
    assert.equal(findings[0].kind, "revision_diseno_no_completada");
  }
});

test("healthy large-content measurements remain evidence without generating alerts", async () => {
  const measured = {
    route: "/eventos/neutral/",
    event: "Neutral",
    viewport: { width: 360, height: 800 },
    state: "initial",
    source: "fixture",
    content: { characters: 10000, paragraphs: 20, listItems: 30, photos: 32 },
    blocks: {
      description: { width: 274, height: 3000, scrollHeight: 3000 },
      article: { width: 316, height: 3500, scrollHeight: 3500 },
    },
    margins: { photoToThumbnails: 10, galleryToFooter: 10 },
  };
  const report = {
    specs: [
      {
        title: "healthy",
        tests: [
          {
            results: [
              {
                status: "passed",
                attachments: [
                  {
                    name: "calendar-layout-measurements",
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
  };
  const findings = await browserFindings(report);
  assert.deepEqual(findings, []);
  assert.deepEqual(designNotifications(findings, "local", true), []);
  const rows = await browserMeasurements(report);
  assert.deepEqual(rows, [measured]);
  const maxima = measurementSummary([
    ...rows,
    {
      ...measured,
      blocks: { description: { width: 274, height: 4000, scrollHeight: 4000 } },
    },
  ]);
  assert.equal(maxima[0].count, 2);
  assert.equal(maxima[0].descriptionHeight, 4000);
});
