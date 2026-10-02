import { createServer } from "vite";

let serverPromise;

async function getServer() {
  serverPromise ??= createServer({
    appType: "custom",
    configFile: false,
    optimizeDeps: { noDiscovery: true },
    // Source-only tests do not need a WebSocket or hot reload.
    server: { middlewareMode: true, ws: false, hmr: false },
  });

  return serverPromise;
}

export async function loadSourceModule(modulePath) {
  return (await getServer()).ssrLoadModule(modulePath);
}

export async function closeSourceModuleLoader() {
  if (!serverPromise) return;
  await (await serverPromise).close();
  serverPromise = undefined;
}
