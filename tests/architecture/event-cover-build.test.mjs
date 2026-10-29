import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { prepareEventCovers } from "../../scripts/prepare-event-covers.ts";
import {
  publicAssetFilter,
  copyBuildPublicAssets,
} from "../../scripts/event-cover-build.ts";

test("pending build preparation never invokes the generator; approved preparation invokes its injected mock", async () => {
  let calls = 0;
  const generate = async () => {
    calls++;
  };
  assert.equal(
    await prepareEventCovers(
      { status: "awaiting-user-illustration" },
      generate,
    ),
    "skipped-pending-illustration",
  );
  assert.equal(calls, 0);
  assert.equal(
    await prepareEventCovers({ status: "approved" }, generate),
    "generated",
  );
  assert.equal(calls, 1);
});

test("pending public asset copy excludes cover subtree and preserves official posters, fonts and other files (mock only)", async () => {
  const publicDir = path.resolve("public");
  const outDir = path.resolve("dist");
  let calls = 0;
  await copyBuildPublicAssets(
    publicDir,
    outDir,
    false,
    async (source, target, options) => {
      calls++;
      assert.equal(source, publicDir);
      assert.equal(target, outDir);
      assert.equal(options.recursive, true);
      for (const name of [
        "images/event-covers",
        "images/event-covers/test/archive.webp",
      ])
        assert.equal(options.filter(path.join(publicDir, name)), false);
      for (const name of [
        "",
        "images",
        "images/events/copa-shogun/flyer.webp",
        "fonts/font.woff2",
        "robots.txt",
        "images/event-covers-other.webp",
      ])
        assert.equal(options.filter(path.join(publicDir, name)), true);
    },
  );
  assert.equal(calls, 1);
  assert.equal(
    publicAssetFilter(
      publicDir,
      true,
    )(path.join(publicDir, "images/event-covers/approved.webp")),
    true,
  );
});

test("Vite disables unfiltered public copying and clears prior output before the filtered copy", async () => {
  const config = await readFile("vite.config.ts", "utf8");
  assert.match(config, /copyPublicDir: false/);
  assert.match(config, /emptyOutDir: true/);
  assert.match(config, /filteredPublicAssets\(isSsrBuild\)/);
  assert.match(config, /if \(!isSsrBuild\)/);
});

test("calendar approval copies horizontal covers but excludes unapproved vertical files", () => {
  const root = path.resolve("public");
  const filter = publicAssetFilter(root, true, {
    calendar: "approved",
    archive: "awaiting-composition-approval",
  });
  assert.equal(
    filter(path.join(root, "images/event-covers/exam/hash-calendar-1448.webp")),
    true,
  );
  assert.equal(
    filter(path.join(root, "images/event-covers/exam/hash-archive-900.webp")),
    false,
  );
  assert.equal(
    filter(path.join(root, "images/events/shogun/flyer.webp")),
    true,
  );
});
