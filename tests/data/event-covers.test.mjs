import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { CALENDAR_EVENTS } from "../../src/app/data/calendarEvents.ts";
import { EVENT_GALLERIES } from "../../src/app/data/eventGalleries.ts";
import {
  adaptCoverEvent,
  assertCoverGenerationReady,
} from "../../scripts/event-cover-model.ts";
import { getEventThumbnail } from "../../src/app/utils/eventThumbnail.ts";
import coverApproval from "../../src/app/config/eventCoverApproval.json";
import seoData from "../../src/app/config/seo-data.json";

const manifest = JSON.parse(
  await readFile("src/app/data/eventCovers.json", "utf8"),
);

test("cover adapter only requires safe event identity and ignores editorial text", () => {
  assert.deepEqual(adaptCoverEvent({ id: "examen" }), { id: "examen" });
  assert.deepEqual(adaptCoverEvent({ id: "examen", title: "", tag: "#Otro" }), {
    id: "examen",
  });
  assert.deepEqual(adaptCoverEvent({ id: "externo", external: true }), {
    id: "externo",
    external: true,
  });
  assert.throws(() => adaptCoverEvent({ id: "../escape" }));
});

test(
  "every calendar event has both complete, correctly sized optimized cover variants",
  { skip: coverApproval.status !== "approved" },
  async () => {
    const { default: sharp } = await import("sharp");
    assert.deepEqual(
      Object.keys(manifest.events).sort(),
      CALENDAR_EVENTS.filter(
        (event) =>
          !(
            EVENT_GALLERIES[event.id]?.thumbnail ??
            EVENT_GALLERIES[event.id]?.images[0]
          ),
      )
        .map((event) => event.id)
        .sort(),
    );
    for (const event of CALENDAR_EVENTS.filter(
      (event) =>
        !(
          EVENT_GALLERIES[event.id]?.thumbnail ??
          EVENT_GALLERIES[event.id]?.images[0]
        ),
    )) {
      const entry = manifest.events[event.id];
      for (const format of ["calendar", "archive"].filter(
        (format) => coverApproval.formats[format] === "approved",
      )) {
        const image = entry[format];
        assert.deepEqual(Object.keys(image.srcSet), ["webp"]);
        assert.equal(
          image.width / image.height,
          format === "calendar" ? 4 / 3 : 3 / 4,
        );
        for (const [extension, set] of Object.entries(image.srcSet)) {
          const candidates = set.split(", ");
          assert.equal(candidates.length, 3);
          for (const candidate of candidates) {
            const [src, width] = candidate.split(" ");
            assert.match(
              src,
              new RegExp(
                `^/images/event-covers/shared/kendo-${event.external ? "external" : "costa-rica"}-[a-f0-9]+-${format}-\\d+\\.${extension}$`,
              ),
            );
            const metadata = await sharp(
              await readFile(`public${src}`),
            ).metadata();
            assert.equal(metadata.width, Number.parseInt(width));
            assert.equal(
              metadata.width / metadata.height,
              image.width / image.height,
            );
          }
        }
      }
    }
  },
);

test("events share covers by external status without duplicate public images", async () => {
  for (const format of ["calendar", "archive"]) {
    const byStatus = new Map();
    for (const event of CALENDAR_EVENTS) {
      const entry = manifest.events[event.id];
      if (!entry) continue;
      const external = Boolean(event.external);
      const images = byStatus.get(external) ?? [];
      images.push(entry[format]);
      byStatus.set(external, images);
    }
    assert.equal(byStatus.size, 2);
    for (const images of byStatus.values()) {
      assert.equal(new Set(images.map((image) => image.src)).size, 1);
      assert.equal(new Set(images.map((image) => image.srcSet.webp)).size, 1);
    }
    assert.notEqual(byStatus.get(true)[0].src, byStatus.get(false)[0].src);
  }
  const files = await readdir("public/images/event-covers", {
    recursive: true,
  });
  assert.equal(files.filter((file) => file.endsWith(".webp")).length, 12);
});

test("site covers omit embedded text and retain separate calendar and archive compositions", async () => {
  const template = JSON.parse(
    await readFile("templates/event-covers/v1/template.json", "utf8"),
  );
  assert.equal("showText" in template, false);
  assert.equal("font" in template, false);
  for (const [name, ratio] of [
    ["calendar", 4 / 3],
    ["archive", 3 / 4],
  ]) {
    const layout = template.formats[name];
    assert.equal(layout.width / layout.height, ratio);
    for (const width of layout.variants)
      assert.equal(Number.isInteger(width / ratio), true);
    for (const key of ["title", "titleFontSize", "tagBox", "tagFontSize"])
      assert.equal(key in layout, false);
  }
  const component = await readFile(
    "src/app/components/events/EventThumbnail.tsx",
    "utf8",
  );
  assert.match(
    component,
    /format === "calendar"\s*\? "aspect-\[4\/3\]"\s*: "aspect-\[3\/4\]"/,
  );
});

test("existing event artwork takes priority over generated covers in both formats", () => {
  for (const event of CALENDAR_EVENTS) {
    for (const format of ["calendar", "archive"]) {
      const selection = getEventThumbnail(event.id, format);
      if (
        coverApproval.formats[format] !== "approved" &&
        !(
          EVENT_GALLERIES[event.id]?.thumbnail ??
          EVENT_GALLERIES[event.id]?.images[0]
        )
      ) {
        assert.equal(selection, undefined);
        continue;
      }
      const gallery = EVENT_GALLERIES[event.id];
      assert.ok(selection);
      if (gallery?.thumbnail ?? gallery?.images[0]) {
        assert.equal(
          selection.source,
          gallery.posterSource ? "poster" : "gallery",
        );
        assert.equal(selection.image, gallery.thumbnail ?? gallery.images[0]);
      } else {
        assert.equal(selection.source, "generated");
        assert.equal(
          selection.image.src,
          manifest.events[event.id][format].src,
        );
      }
    }
  }
  assert.equal(getEventThumbnail("unknown-id"), undefined);
});

test("generated thumbnails describe organization and event in their alternative text", () => {
  for (const event of CALENDAR_EVENTS) {
    const selection = getEventThumbnail(event.id);
    if (selection?.source === "generated") {
      assert.equal(
        selection.image.alt,
        event.external
          ? `Ilustración genérica para evento externo: ${event.title}`
          : `Afiche de ${seoData.siteName}, ${event.title}`,
      );
    }
  }
});

test("pending illustration disables generated covers while preserving official Shogun artwork", () => {
  assert.throws(
    () => assertCoverGenerationReady({ status: "awaiting-user-illustration" }),
    /No images were generated/,
  );
  assert.doesNotThrow(() => assertCoverGenerationReady({ status: "approved" }));
  const shogun = getEventThumbnail(
    "panama-5ta-copa-shogun-torneo-por-equipos-y-seminario",
  );
  assert.equal(shogun?.source, "poster");
  assert.match(shogun.image.src, /copa-shogun-2026-panama-kendo-thumbnail/);
  for (const event of CALENDAR_EVENTS) {
    if (!(
      EVENT_GALLERIES[event.id]?.thumbnail ??
      EVENT_GALLERIES[event.id]?.images[0]
    ))
      assert.equal(
        getEventThumbnail(event.id, "archive", {
          status: "awaiting-user-illustration",
        }),
        undefined,
      );
  }
});

test("explicit generation guards before loading Sharp or writing output", async () => {
  const source = await readFile("scripts/generate-event-covers.ts", "utf8");
  const guard = source.indexOf("assertCoverGenerationReady(coverApproval);");
  assert.ok(guard > 0);
  assert.ok(guard < source.indexOf('await import("sharp")'));
  assert.ok(guard < source.indexOf("await mkdir(outputRoot"));
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  assert.match(
    pkg.scripts.build,
    /^tsx scripts\/prepare-event-covers\.ts && vite build/,
  );
  const approval = JSON.parse(
    await readFile("src/app/config/eventCoverApproval.json", "utf8"),
  );
  assert.equal(approval.status, "approved");
  assert.equal(approval.formats.calendar, "approved");
  assert.equal(approval.formats.archive, "approved");
});

test("external fallback uses the approved kendo artwork with its diagonal label", async () => {
  const template = JSON.parse(
    await readFile("templates/event-covers/v1/template.json", "utf8"),
  );
  const source = await readFile(
    `templates/event-covers/v1/${template.externalSource}`,
    "utf8",
  );
  assert.match(source, /id="evento-externo"/);
  assert.match(source, /data-font-family="Zen Kaku Gothic New"/);
  assert.match(source, /rotate\(-42\)/);
  assert.match(source, /<title>#EventoExterno<\/title>/);
  assert.doesNotMatch(source, /href="https?:/);
  const panamaId = "panama-5ta-copa-shogun-torneo-por-equipos-y-seminario";
  assert.equal(manifest.events[panamaId], undefined);
  assert.equal(getEventThumbnail(panamaId).source, "poster");
  const event = CALENDAR_EVENTS.find(
    (event) => event.id === "clak-1er-panamericano-brasil",
  );
  assert.equal(event.external, true);
  for (const format of ["calendar", "archive"]) {
    const thumbnail = getEventThumbnail(event.id, format);
    assert.equal(thumbnail.source, "generated");
    assert.match(thumbnail.image.src, /\/kendo-external-/);
    assert.doesNotMatch(thumbnail.image.alt, /afiche de|federaci[oó]n/i);
  }
});

test("vertical external cover groups logo and label above the complete kendoka", async () => {
  const template = JSON.parse(
    await readFile("templates/event-covers/v1/template.json", "utf8"),
  );
  const source = await readFile(
    `templates/event-covers/v1/${template.formats.archive.externalSource}`,
    "utf8",
  );
  assert.match(source, /viewBox="0 0 900 1200"/);
  assert.match(
    source,
    /id="external-logo"><image x="48" y="48" width="420" height="400"/,
  );
  assert.ok(420 < 900 / 2);
  assert.match(source, /id="evento-externo"/);
  assert.match(source, /translate\(682 102\)/);
  assert.doesNotMatch(source, /rotate\(/);
  assert.match(
    source,
    /id="external-kendoka" x="48" y="431" width="804" height="721"/,
  );
  assert.match(source, /preserveAspectRatio="xMidYMid meet"/);
});
