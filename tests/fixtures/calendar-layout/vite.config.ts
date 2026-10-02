import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import sharp from "sharp";

export default defineConfig({
  root: resolve(process.cwd(), "tests/fixtures/calendar-layout"),
  publicDir: resolve(process.cwd(), "public"),
  plugins: [
    {
      name: "isolated-calendar-fixtures",
      enforce: "pre",
      configureServer(server) {
        const images = new Map<string, Promise<Buffer>>();
        server.middlewares.use((request, response, next) => {
          const match = /^\/fixture-image\/(\d+)x(\d+)\.jpg$/.exec(
            request.url ?? "",
          );
          if (!match) return next();
          const [width, height] = match.slice(1).map(Number);
          if (width < 1 || height < 1 || width > 4096 || height > 4096) {
            response.statusCode = 400;
            response.end();
            return;
          }
          const key = `${width}x${height}`;
          const image =
            images.get(key) ??
            sharp({
              create: { width, height, channels: 3, background: "#78909c" },
            })
              .jpeg()
              .toBuffer();
          images.set(key, image);
          void image
            .then((buffer) => {
              response.setHeader("Content-Type", "image/jpeg");
              response.end(buffer);
            })
            .catch(() => {
              response.statusCode = 500;
              response.end();
            });
        });
      },
      resolveId(source, importer) {
        if (
          importer?.replaceAll("\\", "/").includes("/src/") &&
          /\/data\/(calendarEvents|eventGalleries|eventTranslations)(\.ts)?$/.test(
            source,
          )
        )
          return resolve(
            process.cwd(),
            "tests/fixtures/calendar-layout/data.ts",
          );
      },
    },
    react(),
    tailwindcss(),
  ],
  server: {
    host: "127.0.0.1",
    port: 4174,
    strictPort: true,
    fs: { allow: [process.cwd()] },
  },
});
