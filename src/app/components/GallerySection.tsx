import { lazy, Suspense } from "react";
import { FeaturedImage } from "./gallery/FeaturedImage";
import { GalleryThumbnails } from "./gallery/GalleryThumbnails";
import { GALLERY_IMAGES } from "../data/gallery";
import { useCarousel } from "../hooks/useCarousel";
import { useGalleryLightbox } from "../hooks/useGalleryLightbox";
import { PageTitle } from "./PageTitle";

const Lightbox = lazy(() =>
  import("./Lightbox").then((module) => ({ default: module.Lightbox })),
);

export function GallerySection() {
  const { index, prev, next, goTo } = useCarousel(GALLERY_IMAGES.length);
  const {
    closeLightbox,
    lightboxIndex,
    lightboxImage,
    openLightbox,
    showNext,
    showPrev,
    triggerRef,
  } = useGalleryLightbox(GALLERY_IMAGES);

  const featured = GALLERY_IMAGES[index];
  return (
    <section
      aria-labelledby="gallery-title"
      className="relative my-2 overflow-hidden rounded-xl bg-site-canvas tall-md:h-[calc(100%_-_1rem)] tall-md:min-h-0"
    >
      <PageTitle
        id="gallery-title"
        placement="floating"
        tone="media"
        className="!p-0"
      >
        Galería de kendo
      </PageTitle>
      <div className="mx-auto flex min-h-0 flex-col tall-md:h-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-2 land-sm:gap-1">
            <FeaturedImage
              image={featured}
              index={index}
              total={GALLERY_IMAGES.length}
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
              images={GALLERY_IMAGES}
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
            total={GALLERY_IMAGES.length}
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
