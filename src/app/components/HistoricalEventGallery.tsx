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
  const gallery = EVENT_GALLERIES[eventId];
  const isFlyer = (order: number) =>
    gallery?.images.some(
      (image) => image.order === order && image.kind === "flyer",
    ) || Boolean(gallery?.posterSource && !gallery.driveOrdered);
  const flyerOnly =
    gallery?.images.length === 1 && isFlyer(gallery.images[0].order);
  const labels = copy.event;
  const images = useMemo<GalleryImage[]>(() => {
    return (gallery?.images ?? []).map((image) => {
      const flyer =
        image.kind === "flyer" ||
        Boolean(gallery.posterSource && !gallery.driveOrdered);
      const title = flyer
        ? language === "es" && gallery.posterSource
          ? image.alt
          : `${labels.officialFlyer} ${eventTitle}`
        : `${labels.photograph} ${image.order}`;
      return {
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
        title,
        tag: eventTitle,
        alt: flyer
          ? title
          : language === "es"
            ? `${title} del evento ${eventTitle}`
            : `${title} of the event ${eventTitle}`,
      };
    });
  }, [gallery, eventTitle, labels, language]);
  const firstLandscapeIndex = images.findIndex(
    (image) => image.width >= image.height,
  );
  const { index, prev, next, goTo } = useCarousel(
    images.length,
    !gallery?.driveOrdered && firstLandscapeIndex >= 0
      ? firstLandscapeIndex
      : 0,
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
  const featuredFlyer = isFlyer(featured.id);
  const openFeatured = (event: MouseEvent<HTMLButtonElement>) => {
    if (consumeSwipe()) {
      event.preventDefault();
      return;
    }
    openLightbox(featured.id, event);
  };

  return (
    <section
      aria-label={`${flyerOnly ? labels.officialImage : labels.eventPhotos} ${eventTitle}`}
      className={`-mx-3 grid min-w-0 w-[calc(100%_+_1.5rem)] content-start gap-2.5 sm:mx-0 sm:w-full xl:[&_[role=group]]:h-[var(--event-thumbnail-height)] ${!flyerOnly && images.length === 1 ? "xl:self-stretch xl:content-stretch" : ""} ${images.length > 6 ? "sm:[&_[role=group]]:justify-start" : ""}`}
    >
      <figure
        className={`group relative cursor-pointer overflow-hidden rounded-xl bg-site-media ${flyerOnly ? "h-[min(75svh,48rem)] xl:h-[var(--event-poster-height)]" : images.length === 1 ? "aspect-video xl:aspect-auto xl:h-full" : "aspect-video xl:aspect-auto xl:h-[var(--event-featured-height)]"}`}
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
            className={`h-full w-full ${images.length === 1 ? "pt-(--event-page-bottom-padding)" : ""} ${featuredFlyer ? "object-contain bg-white" : "object-contain transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:transform-none"}`}
          />
        </picture>
        <button
          type="button"
          aria-label={`${copy.event.openImage} ${featured.alt}`}
          onClick={openFeatured}
          className={`control-image-open absolute inset-0 touch-pan-y cursor-pointer ${focusRingClass}`}
          {...swipeHandlers}
        >
          <span className="sr-only">
            {featuredFlyer ? labels.enlargeFlyer : labels.openPhoto}
          </span>
        </button>
        {images.length > 1 ? (
          <div className="pointer-events-none absolute inset-y-0 left-5 right-5 flex items-center justify-between">
            <NavigationArrowButton
              direction="previous"
              label={labels.previousImage}
              onClick={(event) => {
                event.stopPropagation();
                prev();
              }}
              className="pointer-events-auto"
            />
            <NavigationArrowButton
              direction="next"
              label={labels.nextImage}
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
          ariaLabel={labels.selectImage}
          centerWhenContained
          onSelect={goTo}
        />
      ) : null}
      {lightboxImage ? (
        <Suspense fallback={null}>
          <Lightbox
            image={lightboxImage}
            total={images.length}
            containImage={isFlyer(lightboxImage.id)}
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
