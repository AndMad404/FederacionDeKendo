import {
  Suspense,
  useEffect,
  useRef,
  type ComponentType,
} from "react";
import { Route, Routes, useLocation } from "react-router";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import {
  getRouteHeadDescriptors,
  getRouteManifest,
  getRouteMeta,
  getRouteSeoPayload,
  type RouteComponent,
} from "./config/seo";

export interface RouteComponentRegistry {
  routes: Record<RouteComponent, ComponentType>;
  notFound: ComponentType;
}

function applyRouteHead(pathname: string) {
  const meta = getRouteMeta(pathname);
  const seo = getRouteSeoPayload(meta);
  document.title = seo.title;

  document
    .querySelectorAll(
      '[data-route-seo], link[rel="canonical"], link[rel="preload"][as="image"], meta[name="description"], meta[name="robots"], meta[property^="og:"], script#route-json-ld',
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

export default function App({
  routeComponents,
}: {
  routeComponents: RouteComponentRegistry;
}) {
  const NotFoundComponent = routeComponents.notFound;

  return (
    <div className="flex min-h-svh flex-col bg-site-canvas text-site-text tall-md:h-dvh tall-md:overflow-hidden">
      <ScrollToTop />
      <RouteMetadata />
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[60] -translate-y-20 rounded-lg bg-site-surface px-4 py-2 text-sm font-bold text-site-navy shadow-lg transition focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-site-focus"
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
            const Component = routeComponents.routes[route.component];
            return (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <Suspense
                    fallback={
                      <p className="sr-only" role="status">
                        Cargando contenido…
                      </p>
                    }
                  >
                    <Component />
                  </Suspense>
                }
              />
            );
          })}
          <Route
            path="*"
            element={
              <Suspense
                fallback={
                  <p className="sr-only" role="status">
                    Cargando contenido…
                  </p>
                }
              >
                <NotFoundComponent />
              </Suspense>
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
