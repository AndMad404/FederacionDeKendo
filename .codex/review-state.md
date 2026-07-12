SESSION_STATE:
  reviewed:
    - src/app/components/Navbar.tsx
    - src/app/components/HeroSection.tsx
    - src/app/App.tsx
    - src/app/config/seo-data.json
    - src/app/config/seo.ts
    - scripts/generate-route-html.mjs
    - public/robots.txt
    - public/sitemap.xml
    - src/app/components/GallerySection.tsx
    - src/app/components/AfiliadosSection.tsx
    - src/app/components/UpcomingEventsSection.tsx
    - src/app/components/Footer.tsx
    - src/app/components/Lightbox.tsx
    - src/app/components/gallery/FeaturedImage.tsx
    - src/app/components/gallery/GalleryThumbnails.tsx
    - src/app/components/gallery/GalleryDots.tsx
    - dist/index.html
    - dist/galeria/index.html
    - dist/afiliados/index.html
    - public repository folder structure for SEO document deliverables
    - C:/Users/and_m/Documents/Profesional/HerramientaPDFSEO root structure
    - C:/Users/and_m/Documents/Profesional/HerramientaPDFSEO/projects/federacion-kendo structure
    - private PDF generator dependency and artifact boundaries
    - current h1-h4 hierarchy across Home, Galería, Afiliados, Lightbox, events and Footer
    - semantic heading patch for FeaturedImage, Lightbox, event cards and Footer
    - 2026 SEO audit of route metadata, canonical URLs, structured data, headings, crawlable links, responsive images and initial HTML rendering
    - published production responses for /, /galeria/, /afiliados/, robots.txt, sitemap.xml and trailing-slash redirects
    - current SEO architecture after SSR prerender, 404 generation and shared RouteSeoPayload
  open_criticals: []
  open_structurals:
    - private PDF composition and capture logic remain client-specific and must be extracted before adding a second client.
    - private PDF runtime dependencies are incomplete because Playwright has no Node manifest and Python packages are unpinned.
  resolved_2026_07_11:
    - "[SEO ARCH] seo-data.json route records now form the validated route manifest used by React routing, prerender generation and the generated dist/sitemap.xml."
    - "[SEO HEAD] getRouteHeadDescriptors is the shared tag policy for client navigation and generated HTML; both adapters consume the same descriptors."
    - "[SEO TYPES] the SEO config now validates required site and route fields at module load, and RouteMeta includes component and preloadImage contracts."
    - "[JSON-LD] the base structured-data graph now has a route-component builder extension point for future approved route entities."
    - "[404] unknown production URLs returned HTTP 200 with homepage metadata (soft-404). Fix: seo.ts getRouteMeta no longer falls back to '/' meta — returns dedicated NOT_FOUND_META (noindex:true). App.tsx adds wildcard Route + NotFoundSection component, and RouteMetadata sets robots=noindex/strips canonical+OG+JSON-LD for unmatched routes. generate-route-html.mjs now emits dist/404.html with robots noindex (Cloudflare Pages serves it with real 404 status automatically, no _redirects present)."
    - "[SSR] initial HTML body was empty (<div id=\"root\"></div>), content depended entirely on client JS. Fix: added src/entry-server.tsx with renderToString and react-router StaticRouter. The server renders the shared App component, while App uses eager route imports so the server and client trees match. vite.config.ts builds a second SSR bundle, package.json runs both client and SSR builds, and generate-route-html.mjs injects real per-route body HTML. main.tsx uses createRoot for Vite development's empty container and hydrateRoot for prerendered production HTML."
    - "[SEO SOURCE] route metadata and JSON-LD were calculated independently in React and generate-route-html.mjs. Fix: seo.ts now exposes one RouteSeoPayload used by App.tsx and the postbuild through the SSR bundle, including title, description, robots, canonical, social image, locale and structured data."
    - "[SCROLL] ScrollToTop forced the initial page position and could interfere with fragment links. Fix: initial load and URLs with a hash now preserve the browser position; automatic scrolling only applies to later pathname navigation."
  pending_review:
    - configurable private PDF engine extraction before onboarding another client
    - Search Console URL Inspection, Rich Results Test and field Core Web Vitals data, which require external Google property access
    - approved visible dojo identity copy before considering per-dojo structured data
