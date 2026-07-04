import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { Footer } from "./components/Footer";
import { GallerySection } from "./components/GallerySection";
import { AfiliadosSection } from "./components/AfiliadosSection";
import {
  DEFAULT_SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  getRouteImageMetadata,
  getCanonicalUrl,
  getRouteMeta,
  getRouteStructuredData,
} from "./config/seo";

function setMetaName(name: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.append(meta);
  }

  meta.content = content;
}

function setMetaProperty(property: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  );

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("property", property);
    document.head.append(meta);
  }

  meta.content = content;
}

function setCanonicalLink(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.append(link);
  }

  link.href = href;
}

function setJsonLd(id: string, data: Record<string, unknown>) {
  let script = document.querySelector<HTMLScriptElement>(`script#${id}`);

  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.append(script);
  }

  script.text = JSON.stringify(data);
}

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
    const meta = getRouteMeta(pathname);
    const canonicalUrl = getCanonicalUrl(meta);
    const image = getRouteImageMetadata(meta);

    document.title = meta.title;
    setMetaName("description", meta.description || DEFAULT_SITE_DESCRIPTION);
    setCanonicalLink(canonicalUrl);
    setMetaProperty("og:type", "website");
    setMetaProperty("og:site_name", SITE_NAME);
    setMetaProperty("og:title", meta.title);
    setMetaProperty("og:description", meta.description);
    setMetaProperty("og:url", canonicalUrl);
    setMetaProperty("og:image", image.url);
    setMetaProperty("og:image:secure_url", image.url);
    setMetaProperty("og:image:type", "image/png");
    setMetaProperty("og:image:width", String(image.width));
    setMetaProperty("og:image:height", String(image.height));
    setMetaProperty("og:image:alt", image.alt);
    setMetaProperty("og:locale", SITE_LOCALE);
    setMetaName("twitter:card", "summary_large_image");
    setMetaName("twitter:title", meta.title);
    setMetaName("twitter:description", meta.description);
    setMetaName("twitter:image", image.url);
    setMetaName("twitter:image:alt", image.alt);
    setJsonLd("route-json-ld", getRouteStructuredData(meta));
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <div className="flex min-h-svh flex-col bg-stone-950 [@media_(min-width:768px)_and_(min-height:640px)]:h-dvh [@media_(min-width:768px)_and_(min-height:640px)]:overflow-hidden">
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
        className="min-h-[calc(100svh_-_4rem_-_10px)] flex-1 px-2.5 pt-[calc(4rem_+_10px)] [@media_(orientation:landscape)_and_(max-height:640px)]:min-h-[calc(100svh_-_3rem_-_6px)] [@media_(orientation:landscape)_and_(max-height:640px)]:pt-[calc(3rem_+_6px)] [@media_(min-width:768px)_and_(min-height:640px)]:min-h-0 [@media_(min-width:768px)_and_(min-height:640px)]:overflow-hidden"
      >
        <Routes>
          <Route path="/" element={<HeroSection />} />
          <Route path="/galeria" element={<GallerySection />} />
          <Route path="/afiliados" element={<AfiliadosSection />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
