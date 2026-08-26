import { lazy, Suspense, useMemo } from "react";
import type { MouseEvent } from "react";
import { EVENT_GALLERIES } from "../data/eventGalleries";
import { useCarousel } from "../hooks/useCarousel";
import { useGalleryLightbox } from "../hooks/useGalleryLightbox";
import { useSwipeNavigation } from "../hooks/useSwipeNavigation";
import { focusRingClass } from "../styles/shared";
import type { GalleryImage } from "../types";
import { GalleryThumbnails } from "./gallery/GalleryThumbnails";
import { NavigationArrowButton } from "./ui/ModalControls";

const Lightbox = lazy(() =>
  import("./Lightbox").then((module) => ({ default: module.Lightbox })),
);

interface HistoricalEventGalleryProps {
  eventId: string;
  eventTitle: string;
}

export function HistoricalEventGallery({
  eventId,
  eventTitle,
}: HistoricalEventGalleryProps) {
  const images = useMemo<GalleryImage[]>(() => {
    const gallery = EVENT_GALLERIES[eventId];
    return (gallery?.images ?? []).slice(0, 5).map((image) => ({
      id: image.order,
      src: image.src,
      srcSet: image.srcSet.webp,
      sizes: image.sizes,
      width: image.width,
      height: image.height,
      thumbnailSrc: image.src,
      thumbnailSrcSet: image.srcSet.webp,
      thumbnailWidth: image.width,
      thumbnailHeight: image.height,
      title: `Fotografía ${image.order}`,
      tag: eventTitle,
      alt: `Fotografía ${image.order} del evento ${eventTitle}`,
    }));
  }, [eventId, eventTitle]);
  const firstLandscapeIndex = images.findIndex(
    (image) => image.width >= image.height,
  );
  const { index, prev, next, goTo } = useCarousel(
    images.length,
    firstLandscapeIndex >= 0 ? firstLandscapeIndex : 0,
  );
  const {
    closeLightbox,
    lightboxImage,
    openLightbox,
    showNext,
    showPrev,
    triggerRef,
  } = useGalleryLightbox(images);
  const { consumeSwipe, swipeHandlers } = useSwipeNavigation({
    onSwipeLeft: next,
    onSwipeRight: prev,
    allowInteractiveStart: true,
    preventDefaultOnSwipe: true,
  });
  if (!images.length) return null;
  const featured = images[index];
  const openFeatured = (event: MouseEvent<HTMLButtonElement>) => {
    if (consumeSwipe()) {
      event.preventDefault();
      return;
    }
    openLightbox(featured.id, event);
  };

  return (
    <section
      aria-label={`Fotografías del evento ${eventTitle}`}
      className="-mx-3 grid w-[calc(100%_+_1.5rem)] gap-2 sm:mx-0 sm:w-full"
    >
      <figure className="group relative h-[clamp(11rem,28vw,12.5rem)] cursor-pointer overflow-hidden rounded-xl bg-site-media">
        <picture>
          <source
            srcSet={EVENT_GALLERIES[eventId].images[index].srcSet.avif}
            sizes={featured.sizes}
            type="image/avif"
          />
          <img
            src={featured.src}
            srcSet={featured.srcSet}
            sizes={featured.sizes}
            alt={featured.alt}
            width={featured.width}
            height={featured.height}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:transform-none"
          />
        </picture>
        <button
          type="button"
          aria-label={`Abrir ${featured.alt}`}
          onClick={openFeatured}
          className={`absolute inset-0 touch-pan-y cursor-pointer ${focusRingClass}`}
          {...swipeHandlers}
        >
          <span className="sr-only">Abrir fotografía</span>
        </button>
        {images.length > 1 ? (
          <div className="pointer-events-none absolute inset-y-0 left-5 right-5 flex items-center justify-between">
            <NavigationArrowButton
              direction="previous"
              label="Fotografía anterior"
              onClick={(event) => {
                event.stopPropagation();
                prev();
              }}
              className="pointer-events-auto"
            />
            <NavigationArrowButton
              direction="next"
              label="Fotografía siguiente"
              onClick={(event) => {
                event.stopPropagation();
                next();
              }}
              className="pointer-events-auto"
            />
          </div>
        ) : null}
      </figure>
      {images.length > 1 ? (
        <GalleryThumbnails
          images={images}
          activeIndex={index}
          ariaLabel="Seleccionar fotografía"
          centerWhenContained
          onSelect={goTo}
        />
      ) : null}
      {lightboxImage ? (
        <Suspense fallback={null}>
          <Lightbox
            image={lightboxImage}
            triggerRef={triggerRef}
            onClose={closeLightbox}
            onPrev={showPrev}
            onNext={showNext}
          />
        </Suspense>
      ) : null}
    </section>
  );
}
