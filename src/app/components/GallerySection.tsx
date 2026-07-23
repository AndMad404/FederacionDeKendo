import { FeaturedImage } from "./gallery/FeaturedImage";
import { GalleryThumbnails } from "./gallery/GalleryThumbnails";
import { GALLERY_IMAGES } from "../data/gallery";
import { useCarousel } from "../hooks/useCarousel";
import { useGalleryLightbox } from "../hooks/useGalleryLightbox";
import { Lightbox } from "./Lightbox";
import { PageTitle } from "./PageTitle";

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
      className="relative overflow-hidden bg-site-canvas tall-md:h-full tall-md:min-h-0"
    >
      <PageTitle
        id="gallery-title"
        className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 land-compact:top-2"
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
        <Lightbox
          image={lightboxImage}
          index={lightboxIndex}
          total={GALLERY_IMAGES.length}
          triggerRef={triggerRef}
          onClose={closeLightbox}
          onPrev={showPrev}
          onNext={showNext}
        />
      )}
    </section>
  );
}
