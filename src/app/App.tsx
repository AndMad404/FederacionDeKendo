import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { GallerySection } from "./components/GallerySection";
import { AfiliadosSection } from "./components/AfiliadosSection";
import { Footer } from "./components/Footer";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <div className="flex min-h-dvh flex-col bg-stone-950 md:h-dvh md:overflow-hidden">
      <ScrollToTop />
      <Navbar />

      <div className="min-h-0 flex-1 pt-16 md:overflow-hidden">
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
