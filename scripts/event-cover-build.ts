import { cp } from "node:fs/promises";
import path from "node:path";

/** Filters only generator-owned assets; official posters and other public files pass. */
export function publicAssetFilter(
  publicDir: string,
  approved: boolean,
  formats?: Record<string, string>,
) {
  return (source: string) => {
    const relative = path.relative(publicDir, source).replaceAll("\\", "/");
    return (
      (approved &&
        (!relative.startsWith("images/event-covers/") ||
          !path.extname(relative) ||
          !formats ||
          Object.entries(formats).some(
            ([format, status]) =>
              status === "approved" &&
              path.basename(relative).includes(`-${format}-`),
          ))) ||
      (relative !== "images/event-covers" &&
        !relative.startsWith("images/event-covers/"))
    );
  };
}

export async function copyBuildPublicAssets(
  publicDir: string,
  outDir: string,
  approved: boolean,
  copy = cp,
  formats?: Record<string, string>,
) {
  await copy(publicDir, outDir, {
    recursive: true,
    filter: publicAssetFilter(publicDir, approved, formats),
  });
}
