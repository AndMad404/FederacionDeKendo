import { Suspense, lazy, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { Footer } from "./components/Footer";
import { DEFAULT_SITE_DESCRIPTION, ROUTE_META } from "./config/seo";

const GallerySection = lazy(() =>
  import("./components/GallerySection").then((module) => ({
    default: module.GallerySection,
  })),
);

const AfiliadosSection = lazy(() =>
  import("./components/AfiliadosSection").then((module) => ({
    default: module.AfiliadosSection,
  })),
);

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [pathname]);

  return null;
}

function RouteMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = ROUTE_META[pathname] ?? ROUTE_META["/"];
    document.title = meta.title;

    let description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );

    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.append(description);
    }

    description.content = meta.description || DEFAULT_SITE_DESCRIPTION;
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <div className="flex min-h-dvh flex-col bg-stone-950 md:h-dvh md:overflow-hidden">
      <ScrollToTop />
      <RouteMetadata />
      <Navbar />

      <div className="min-h-0 flex-1 pt-16 md:overflow-hidden">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<HeroSection />} />
            <Route path="/galeria" element={<GallerySection />} />
            <Route path="/afiliados" element={<AfiliadosSection />} />
          </Routes>
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}
