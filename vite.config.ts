import { defineConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { cp } from "node:fs/promises";
import coverApproval from "./src/app/config/eventCoverApproval.json";
import seoData from "./src/app/config/seo-data.json";
import { copyBuildPublicAssets } from "./scripts/event-cover-build";

function filteredPublicAssets(isSsrBuild?: boolean): Plugin {
  let publicDir = "";
  let outDir = "";
  return {
    name: "filtered-public-assets",
    apply: "build",
    configResolved(config) {
      publicDir = config.publicDir;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async writeBundle() {
      if (!isSsrBuild)
        await copyBuildPublicAssets(
          publicDir,
          outDir,
          coverApproval.status === "approved",
          cp,
          coverApproval.formats,
        );
    },
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), tailwindcss(), filteredPublicAssets(isSsrBuild)],
  define: {
    "import.meta.env.SITE_ORIGIN": JSON.stringify(
      new URL(seoData.siteUrl).origin,
    ),
  },
  resolve: {
    alias: {
      "@": "/src/app",
    },
  },
  build: {
    copyPublicDir: false,
    emptyOutDir: true,
    rollupOptions: isSsrBuild
      ? undefined
      : {
          output: {
            manualChunks: {
              vendor: ["react", "react-dom", "react-router"],
            },
          },
        },
  },
}));
