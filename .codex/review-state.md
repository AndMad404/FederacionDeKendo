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
  open_criticals: []
  open_structurals:
    - unknown production URLs return HTTP 200 with homepage metadata and no route content, creating soft-404 behavior.
    - dist route HTML contains route-specific head tags but no rendered body content, so route semantics depend on client-side React execution.
    - route metadata and JSON-LD generation are duplicated between src/app/config/seo.ts and scripts/generate-route-html.mjs, creating a drift risk.
    - private PDF composition and capture logic remain client-specific and must be extracted before adding a second client.
    - private PDF runtime dependencies are incomplete because Playwright has no Node manifest and Python packages are unpinned.
  pending_review:
    - configurable private PDF engine extraction before onboarding another client
    - Search Console URL Inspection, Rich Results Test and field Core Web Vitals data, which require external Google property access
    - approved visible dojo identity copy before considering per-dojo structured data
