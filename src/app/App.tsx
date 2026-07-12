import { useEffect, useRef } from "react";
import { Route, Routes, useLocation } from "react-router";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { GallerySection } from "./components/GallerySection";
import { AfiliadosSection } from "./components/AfiliadosSection";
import { Footer } from "./components/Footer";
import { NotFoundSection } from "./components/NotFoundSection";
import {
  getRouteMeta,
  getRouteSeoPayload,
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

function removeElement(selector: string) {
  document.querySelector(selector)?.remove();
}

function removeElements(selector: string) {
  document.querySelectorAll(selector).forEach((el) => el.remove());
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
    const meta = getRouteMeta(pathname);
    const seo = getRouteSeoPayload(meta);

    document.title = seo.title;
    setMetaName("description", seo.description);
    setMetaName("robots", seo.robots);

    if (!seo.canonicalUrl) {
      removeElement('link[rel="canonical"]');
      removeElements('meta[property^="og:"]');
      removeElements('meta[name^="twitter:"]');
      removeElement("script#route-json-ld");
      return;
    }

    setCanonicalLink(seo.canonicalUrl);
    setMetaProperty("og:type", "website");
    setMetaProperty("og:site_name", seo.siteName);
    setMetaProperty("og:title", seo.title);
    setMetaProperty("og:description", seo.description);
    setMetaProperty("og:url", seo.canonicalUrl);
    setMetaProperty("og:image", seo.image.url);
    setMetaProperty("og:image:secure_url", seo.image.url);
    setMetaProperty("og:image:type", "image/png");
    setMetaProperty("og:image:width", String(seo.image.width));
    setMetaProperty("og:image:height", String(seo.image.height));
    setMetaProperty("og:image:alt", seo.image.alt);
    setMetaProperty("og:locale", seo.locale);
    setMetaName("twitter:card", "summary_large_image");
    setMetaName("twitter:title", seo.title);
    setMetaName("twitter:description", seo.description);
    setMetaName("twitter:image", seo.image.url);
    setMetaName("twitter:image:alt", seo.image.alt);

    if (seo.structuredData) {
      setJsonLd("route-json-ld", seo.structuredData);
    }
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
          <Route path="/" element={<HeroSection />} />
          <Route path="/galeria" element={<GallerySection />} />
          <Route path="/afiliados" element={<AfiliadosSection />} />
          <Route path="*" element={<NotFoundSection />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
