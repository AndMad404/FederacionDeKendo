import { Suspense, useEffect, useRef, type ComponentType } from "react";
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
import { getRoutePresentation } from "./config/routePresentation";
import {
  getLanguageFromPathname,
  isLanguageSwitch,
  LanguageProvider,
  useLanguage,
} from "./config/i18n";

export interface RouteComponentRegistry {
  routes: Record<RouteComponent, ComponentType>;
}

function applyRouteHead(pathname: string) {
  const meta = getRouteMeta(pathname);
  const seo = getRouteSeoPayload(meta);
  document.title = seo.title;
  document.documentElement.lang = meta.language;

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

function AppShell({
  routeComponents,
}: {
  routeComponents: RouteComponentRegistry;
}) {
  const { copy } = useLanguage();
  const { pathname } = useLocation();
  const routeComponent = getRouteMeta(pathname).component;
  const NotFoundComponent = routeComponents.routes.notFound;
  const allowsTabletContainment =
    getRoutePresentation(routeComponent).tabletMode === "contained";
  const allowsDesktopContainment =
    getRoutePresentation(routeComponent).desktopMode === "contained";

  return (
    <div
      className={`flex min-h-svh flex-col bg-site-canvas text-site-text ${
        allowsDesktopContainment
          ? "page-fit:h-dvh page-fit:overflow-hidden"
          : ""
      } ${
        allowsTabletContainment
          ? "tablet-fit:h-dvh tablet-fit:overflow-hidden"
          : ""
      }`}
    >
      <ScrollToTop />
      <RouteMetadata />
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[60] -translate-y-20 rounded-lg bg-site-surface px-4 py-2 text-sm font-bold text-site-navy shadow-lg transition focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-site-focus"
      >
        {copy.shell.skip}
      </a>
      <Navbar />

      <main
        id="main-content"
        className={`px-2.5 pt-[calc(4rem_+_10px)] land-sm:pt-[calc(3rem_+_6px)] ${
          routeComponent === "event" ? "" : "tall-md:flex-1"
        } ${
          allowsDesktopContainment
            ? "page-fit:min-h-0 page-fit:overflow-hidden"
            : ""
        } ${
          allowsTabletContainment
            ? "tablet-fit:min-h-0 tablet-fit:overflow-hidden"
            : ""
        }`}
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
                        {copy.shell.loading}
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
                    {copy.shell.loading}
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

function ScrollToTop() {
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const isInitialLoad = previousPathname.current === pathname;
    const isEquivalentLanguageRoute = isLanguageSwitch(
      previousPathname.current,
      pathname,
    );
    previousPathname.current = pathname;

    if (isInitialLoad || isEquivalentLanguageRoute || window.location.hash)
      return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
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
  const { pathname } = useLocation();
  return (
    <LanguageProvider language={getLanguageFromPathname(pathname)}>
      <AppShell routeComponents={routeComponents} />
    </LanguageProvider>
  );
}
