import { lazy, Suspense, useMemo } from "react";
import { FeaturedImage } from "./gallery/FeaturedImage";
import { GalleryThumbnails } from "./gallery/GalleryThumbnails";
import { getGalleryImages } from "../data/gallery";
import { useCarousel } from "../hooks/useCarousel";
import { useGalleryLightbox } from "../hooks/useGalleryLightbox";
import { PageTitle } from "./PageTitle";
import { useLanguage } from "../config/i18n";

const Lightbox = lazy(() =>
  import("./Lightbox").then((module) => ({ default: module.Lightbox })),
);

export function GallerySection() {
  const { language } = useLanguage();
  const images = useMemo(() => getGalleryImages(language), [language]);
  const { index, prev, next, goTo } = useCarousel(images.length);
  const {
    closeLightbox,
    lightboxIndex,
    lightboxImage,
    openLightbox,
    showNext,
    showPrev,
    triggerRef,
  } = useGalleryLightbox(images);

  const featured = images[index];
  return (
    <section
      aria-labelledby="gallery-title"
      className="relative my-2 overflow-hidden rounded-xl bg-site-canvas tall-md:h-[calc(100%_-_1rem)] tall-md:min-h-0 land-sm:mt-[11px]"
    >
      <PageTitle
        id="gallery-title"
        placement="floating"
        tone="media"
        density="flush"
      >
        {language === "en" ? "Kendo gallery" : "Galería de kendo"}
      </PageTitle>
      <div className="flex min-h-0 flex-col tall-md:h-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-2 land-sm:gap-1">
            <FeaturedImage
              image={featured}
              index={index}
              total={images.length}
              onOpen={(event) => openLightbox(featured.id, event)}
              onPrev={(event) => {
                event.stopPropagation();
                prev();
              }}
              onNext={(event) => {
                event.stopPropagation();
                next();
              }}
              onSwipePrev={prev}
              onSwipeNext={next}
            />

            <GalleryThumbnails
              images={images}
              activeIndex={index}
              onSelect={goTo}
            />
          </div>
        </div>
      </div>

      {lightboxImage && (
        <Suspense fallback={null}>
          <Lightbox
            image={lightboxImage}
            index={lightboxIndex}
            total={images.length}
            triggerRef={triggerRef}
            onClose={closeLightbox}
            onPrev={showPrev}
            onNext={showNext}
          />
        </Suspense>
      )}
    </section>
  );
}
