import { renderToString } from "react-dom/server";
import type { ReactElement } from "react";
import { StaticRouter } from "react-router";
import { Navbar } from "./app/components/Navbar";
import { HeroSection } from "./app/components/HeroSection";
import { GallerySection } from "./app/components/GallerySection";
import { AfiliadosSection } from "./app/components/AfiliadosSection";
import { NotFoundSection } from "./app/components/NotFoundSection";
import { Footer } from "./app/components/Footer";

// Nota: se importan las secciones directamente (sin React.lazy) porque
// renderToString es síncrono y no espera a que resuelvan los imports
// dinámicos. El code-splitting real se mantiene en el bundle de cliente
// (ver App.tsx); este bundle SSR es de un solo uso en build time.
const ROUTE_COMPONENTS: Record<string, () => ReactElement> = {
  "/": HeroSection,
  "/galeria/": GallerySection,
  "/afiliados/": AfiliadosSection,
};

export function render(url: string) {
  const RouteComponent = ROUTE_COMPONENTS[url] ?? NotFoundSection;

  return renderToString(
    <StaticRouter location={url}>
      <div className="flex min-h-svh flex-col bg-stone-950 tall-md:h-dvh tall-md:overflow-hidden">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[60] -translate-y-20 rounded bg-white px-4 py-2 text-sm font-bold text-stone-950 shadow-lg transition focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Saltar al contenido principal
        </a>
        <Navbar />

        <main
          id="main-content"
          className="min-h-[calc(100svh_-_4rem_-_10px)] flex-1 px-2.5 pt-[calc(4rem_+_10px)] land-sm:min-h-[calc(100svh_-_3rem_-_6px)] land-sm:pt-[calc(3rem_+_6px)] tall-md:min-h-0 tall-md:overflow-hidden"
        >
          <RouteComponent />
        </main>

        <Footer />
      </div>
    </StaticRouter>,
  );
}
