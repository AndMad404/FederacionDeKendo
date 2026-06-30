import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { Footer } from "./components/Footer";
import { GallerySection } from "./components/GallerySection";
import { AfiliadosSection } from "./components/AfiliadosSection";
import { DEFAULT_SITE_DESCRIPTION, ROUTE_META } from "./config/seo";

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
    <div className="flex min-h-dvh flex-col bg-stone-950 [@media_(min-width:768px)_and_(min-height:640px)]:h-dvh [@media_(min-width:768px)_and_(min-height:640px)]:overflow-hidden">
      <ScrollToTop />
      <RouteMetadata />
      <Navbar />

      <div className="min-h-[calc(100dvh_-_4rem_-_10px)] flex-1 px-2.5 pt-[calc(4rem_+_10px)] [@media_(min-width:768px)_and_(min-height:640px)]:min-h-0 [@media_(min-width:768px)_and_(min-height:640px)]:overflow-hidden">
        <Routes>
          <Route path="/" element={<HeroSection />} />
          <Route path="/galeria" element={<GallerySection />} />
          <Route path="/afiliados" element={<AfiliadosSection />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}
