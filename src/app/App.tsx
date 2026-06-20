import { useState, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { GallerySection } from "./components/GallerySection";
import { AfiliadosSection } from "./components/AfiliadosSection";
import { Footer } from "./components/Footer";
import type { Page } from "./types";

export default function App() {
  const [page, setPage] = useState<Page>("inicio");

  const navigate = useCallback((p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-stone-950 md:h-dvh md:overflow-hidden">
      <Navbar currentPage={page} onNavigate={navigate} />

      <div className="min-h-0 flex-1 pt-16 md:overflow-hidden">
        {page === "inicio" && <HeroSection onNavigate={navigate} />}
        {page === "galeria" && <GallerySection />}
        {page === "afiliados" && <AfiliadosSection />}
      </div>

      <Footer onNavigate={navigate} />
    </div>
  );
}
