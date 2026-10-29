import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  extractCoverSvgLayers,
  styleCoverBackground,
} from "../../scripts/event-cover-svg.ts";
import { assertCoverGenerationReady } from "../../scripts/event-cover-model.ts";

test("editable source retains user paths exactly and extracts only background and illustration", async () => {
  const source = await readFile("templates/event-covers/v1/source.svg", "utf8");
  const layers = extractCoverSvgLayers(source);
  assert.equal(layers.viewBox, "0 0 1448 1086");
  assert.ok(source.includes(layers.backgroundGroup));
  assert.ok(source.includes(layers.illustrationGroup));
  assert.equal(
    (layers.illustrationGroup.match(/<(?:\w+:)?path\b/g) ?? []).length,
    2446,
  );
  for (const layer of [layers.background, layers.illustration]) {
    assert.doesNotMatch(layer, /<(?:text|image)\b|id="(?:logo|titulo|tag)"/);
    assert.match(layer, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  }
  const config = JSON.parse(
    await readFile("templates/event-covers/v1/template.json", "utf8"),
  );
  assert.equal(config.source, "source.svg");
  assert.deepEqual(config.formats.calendar.figure, [0, 0, 1448, 1086]);
  assert.equal(
    config.formats.calendar.width / config.formats.calendar.height,
    4 / 3,
  );
  const layout = config.formats.calendar;
  assert.ok(layout.logo[2] >= 220);
});

test("archive uses the approved vertical source with unchanged kendoka paths and text-free layout", async () => {
  const config = JSON.parse(
    await readFile("templates/event-covers/v1/template.json", "utf8"),
  );
  const layout = config.formats.archive;
  const horizontal = extractCoverSvgLayers(
    await readFile("templates/event-covers/v1/source.svg", "utf8"),
  );
  const vertical = extractCoverSvgLayers(
    await readFile(`templates/event-covers/v1/${layout.source}`, "utf8"),
  );
  const paths = (layer) =>
    [...layer.matchAll(/\bd="([^"]*)"/g)].map((match) => match[1]);
  assert.equal(vertical.viewBox, "0 0 900 1200");
  assert.deepEqual(
    paths(vertical.illustration),
    paths(horizontal.illustration),
  );
  assert.match(
    vertical.illustrationGroup,
    /translate\(23\.5 437\.5\) scale\(0\.57\)/,
  );
  assert.deepEqual(layout.figure, [0, 0, 900, 1200]);
  assert.ok(layout.logo[2] >= 300);
});

test("source extraction rejects missing, unclosed and active layers without rasterization", () => {
  assert.throws(
    () =>
      extractCoverSvgLayers(
        '<svg viewBox="0 0 4 3"><g id="kendoka"></g></svg>',
      ),
    /Missing SVG layer/,
  );
  assert.throws(
    () =>
      extractCoverSvgLayers('<svg viewBox="0 0 4 3"><g id="fondo-bandera">'),
    /Unclosed/,
  );
  assert.throws(
    () => extractCoverSvgLayers("<svg><script>bad()</script></svg>"),
    /self-contained/,
  );
  assert.throws(
    () =>
      extractCoverSvgLayers(
        '<svg><image href="https://example.test/file"/></svg>',
      ),
    /self-contained/,
  );
});

test("uniform light gray background has no circle, lines or flag colors", async () => {
  const source = await readFile("templates/event-covers/v1/source.svg", "utf8");
  const config = JSON.parse(
    await readFile("templates/event-covers/v1/template.json", "utf8"),
  );
  const layer = extractCoverSvgLayers(source).background;
  const styled = styleCoverBackground(
    layer,
    config.colors.paper,
    config.flagOpacity,
  );
  assert.equal(config.colors.paper, "#fafafa");
  assert.doesNotMatch(styled, /<circle|<path|stroke=/);
  for (const color of ["#0052b4", "#ce1126"])
    assert.ok(!styled.includes(color));
  assert.match(styled, /data-design="solid-gray"/);
  assert.match(styled, /fill="#fafafa"/);
  assert.deepEqual(
    [...styled.matchAll(/\bd="([^"]*)"/g)].map((m) => m[1]),
    [...layer.matchAll(/\bd="([^"]*)"/g)].map((m) => m[1]),
  );
  const layout = config.formats.calendar;
  assert.ok(layout.logo[2] * (1 - layout.logoInset * 2) >= 220);
  assert.equal(layout.flagCircle, undefined);
  assert.throws(() => styleCoverBackground(layer, "white", 2));
});

test("calendar and vertical compositions are authorized", async () => {
  const approval = JSON.parse(
    await readFile("src/app/config/eventCoverApproval.json", "utf8"),
  );
  assert.doesNotThrow(() => assertCoverGenerationReady(approval));
  assert.equal(approval.formats.calendar, "approved");
  assert.equal(approval.formats.archive, "approved");
  assert.throws(() =>
    assertCoverGenerationReady({
      status: "approved",
      formats: { archive: "pending" },
    }),
  );
});

test("single calendar review exits before variants and production manifest writes", async () => {
  const source = await readFile("scripts/generate-event-covers.ts", "utf8");
  const reviewStart = source.indexOf("// Explicit single-review path:");
  const reviewReturn = source.indexOf("return manifest;", reviewStart);
  assert.ok(reviewStart > 0 && reviewReturn > reviewStart);
  assert.ok(
    reviewReturn < source.indexOf("for (const width of layout.variants)"),
  );
  assert.ok(reviewReturn < source.indexOf("await writeChanged(manifestPath"));
  assert.match(source, /coverApproval.formats\[format\] === "approved"/);
  assert.match(source, /\.cache\/event-cover-review/);
});
