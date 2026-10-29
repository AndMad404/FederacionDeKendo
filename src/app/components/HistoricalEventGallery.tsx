import { lazy, Suspense, useMemo } from "react";
import type { MouseEvent } from "react";
import { EVENT_GALLERIES } from "../data/eventGalleries";
import { useLanguage } from "../config/i18n";
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

const FEATURED_IMAGE_SIZES =
  "(min-width: 1280px) calc((100vw - 84px) / 2), (min-width: 640px) calc(100vw - 52px), 100vw";

interface HistoricalEventGalleryProps {
  eventId: string;
  eventTitle: string;
}

export function HistoricalEventGallery({
  eventId,
  eventTitle,
}: HistoricalEventGalleryProps) {
  const { language, copy } = useLanguage();
  const posterSource = EVENT_GALLERIES[eventId]?.posterSource;
  const translatedPosterAlt =
    language === "en" ? `${copy.event.officialFlyer} ${eventTitle}` : undefined;
  const images = useMemo<GalleryImage[]>(() => {
    const gallery = EVENT_GALLERIES[eventId];
    return (gallery?.images ?? []).map((image) => ({
      id: image.order,
      src: image.src,
      srcSet: image.srcSet.webp,
      sizes: FEATURED_IMAGE_SIZES,
      width: image.width,
      height: image.height,
      thumbnailSrc: image.src,
      thumbnailSrcSet: image.srcSet.webp,
      thumbnailWidth: image.width,
      thumbnailHeight: image.height,
      title: gallery.posterSource
        ? (translatedPosterAlt ?? image.alt)
        : `Fotografía ${image.order}`,
      tag: eventTitle,
      alt: gallery.posterSource
        ? (translatedPosterAlt ?? image.alt)
        : `Fotografía ${image.order} del evento ${eventTitle}`,
    }));
  }, [eventId, eventTitle, translatedPosterAlt]);
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
      aria-label={`${posterSource ? copy.event.officialImage : "Fotografías del evento"} ${eventTitle}`}
      className={`-mx-3 grid min-w-0 w-[calc(100%_+_1.5rem)] content-start gap-2.5 sm:mx-0 sm:w-full xl:[&_[role=group]]:h-[var(--event-thumbnail-height)] ${!posterSource && images.length === 1 ? "xl:self-center" : ""} ${images.length > 6 ? "sm:[&_[role=group]]:justify-start" : ""}`}
    >
      <figure
        className={`group relative cursor-pointer overflow-hidden rounded-xl bg-site-media ${posterSource ? "h-[min(75svh,48rem)] xl:h-[var(--event-poster-height)]" : "aspect-video xl:aspect-auto xl:h-[var(--event-featured-height)]"}`}
      >
        <picture>
          <img
            src={featured.src}
            srcSet={featured.srcSet}
            sizes={featured.sizes}
            alt={featured.alt}
            width={featured.width}
            height={featured.height}
            loading="lazy"
            decoding="async"
            className={`h-full w-full ${posterSource ? "object-contain bg-white" : "object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:transform-none"}`}
          />
        </picture>
        <button
          type="button"
          aria-label={`${copy.event.openImage} ${featured.alt}`}
          onClick={openFeatured}
          className={`absolute inset-0 touch-pan-y cursor-pointer ${focusRingClass}`}
          {...swipeHandlers}
        >
          <span className="sr-only">
            {posterSource ? copy.event.enlargeFlyer : "Abrir fotografía"}
          </span>
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
            total={images.length}
            containImage={Boolean(posterSource)}
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
