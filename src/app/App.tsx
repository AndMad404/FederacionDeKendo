import { useEffect, useRef, type ComponentType } from "react";
import { Route, Routes, useLocation } from "react-router";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { GallerySection } from "./components/GallerySection";
import { AfiliadosSection } from "./components/AfiliadosSection";
import { Footer } from "./components/Footer";
import { NotFoundSection } from "./components/NotFoundSection";
import {
  getRouteHeadDescriptors,
  getRouteManifest,
  getRouteMeta,
  getRouteSeoPayload,
  type RouteComponent,
} from "./config/seo";

const ROUTE_COMPONENTS: Record<RouteComponent, ComponentType> = {
  home: HeroSection,
  gallery: GallerySection,
  affiliates: AfiliadosSection,
};

function applyRouteHead(pathname: string) {
  const meta = getRouteMeta(pathname);
  const seo = getRouteSeoPayload(meta);
  document.title = seo.title;

  document
    .querySelectorAll(
      '[data-route-seo], link[rel="canonical"], link[rel="preload"][as="image"], meta[name="description"], meta[name="robots"], meta[property^="og:"], meta[name^="twitter:"], script#route-json-ld',
    )
    .forEach((element) => element.remove());

  for (const descriptor of getRouteHeadDescriptors(meta)) {
    const element = document.createElement(descriptor.tag);
    element.setAttribute("data-route-seo", "");

    for (const [name, value] of Object.entries(descriptor.attributes)) {
      element.setAttribute(name, value);
    }

    if (descriptor.text) element.textContent = descriptor.text;
    document.head.append(element);
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const isInitialLoad = previousPathname.current === pathname;
    previousPathname.current = pathname;

    if (isInitialLoad || window.location.hash) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [pathname]);

  return null;
}

function RouteMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    applyRouteHead(pathname);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <div className="flex min-h-svh flex-col bg-stone-950 tall-md:h-dvh tall-md:overflow-hidden">
      <ScrollToTop />
      <RouteMetadata />
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
        <Routes>
          {getRouteManifest().map((route) => {
            const Component = ROUTE_COMPONENTS[route.component];
            return (
              <Route
                key={route.path}
                path={route.path}
                element={<Component />}
              />
            );
          })}
          <Route path="*" element={<NotFoundSection />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
