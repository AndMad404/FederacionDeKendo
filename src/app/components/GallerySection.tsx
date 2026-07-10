import { FeaturedImage } from "./gallery/FeaturedImage";
import { GalleryDots } from "./gallery/GalleryDots";
import { GalleryThumbnails } from "./gallery/GalleryThumbnails";
import { GALLERY_IMAGES } from "../data/gallery";
import { useCarousel } from "../hooks/useCarousel";
import { useGalleryLightbox } from "../hooks/useGalleryLightbox";
import { Lightbox } from "./Lightbox";

const THUMBS_COUNT = 6;

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
  const thumbs = Array.from(
    { length: THUMBS_COUNT },
    (_, offset) => GALLERY_IMAGES[(index + 1 + offset) % GALLERY_IMAGES.length],
  );

  return (
    <section
      aria-labelledby="gallery-title"
      className="relative overflow-hidden bg-stone-950 tall-md:h-full tall-md:min-h-0"
    >
      <h1
        id="gallery-title"
        className="pointer-events-none absolute left-1/2 top-3 z-30 max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-lg border border-blue-500/70 bg-black/70 px-3 py-2 text-center text-base font-bold uppercase tracking-wide text-white shadow-xl sm:top-5 sm:text-lg"
      >
        Galería de kendo
      </h1>
      <div className="mx-auto flex min-h-0 flex-col tall-md:h-full land-sm:pt-2">
        <div className="flex min-h-0 flex-1 flex-col gap-4">
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
              images={thumbs}
              onSelect={(thumbIndex) =>
                goTo((index + 1 + thumbIndex) % GALLERY_IMAGES.length)
              }
            />

            <GalleryDots
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
