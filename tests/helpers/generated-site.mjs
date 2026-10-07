import { readFileSync } from "node:fs";

// Route publication and browser hydration must observe the same archive boundary.
export function getGeneratedSiteTime() {
  const html = readFileSync(
    new URL("../../dist/index.html", import.meta.url),
    "utf8",
  );
  const timestamp = html.match(
    /<meta name="app-prerendered-at" content="([^"]+)"\s*\/>/,
  )?.[1];
  const time = new Date(timestamp ?? "");
  if (!Number.isFinite(time.getTime())) {
    throw new Error(
      "Generated site has no valid prerender timestamp; run the build first.",
    );
  }
  return time;
}
