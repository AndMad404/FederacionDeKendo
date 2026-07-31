import {
  useCallback,
  type CSSProperties,
  type MouseEvent,
} from "react";
import type { GalleryImage } from "../../types";
import { useSwipeNavigation } from "../../hooks/useSwipeNavigation";
import { useTransientDirectionFeedback } from "../../hooks/useTransientDirectionFeedback";
import {
  getGalleryDisplayText,
  getMobileDescriptionPreview,
  OPEN_DETAILS_LABEL,
} from "./galleryText";
import {
  focusRingClass,
  mediaCaptionSurfaceClass,
} from "../../styles/shared";
import { NavigationArrowButton } from "../ui/ModalControls";

const defaultFeaturedObjectPosition = "center 0%";

interface FeaturedImageProps {
  image: GalleryImage;
  index: number;
  total: number;
  onOpen: (event: MouseEvent<HTMLButtonElement>) => void;
  onPrev: (event: MouseEvent<HTMLButtonElement>) => void;
  onNext: (event: MouseEvent<HTMLButtonElement>) => void;
  onSwipePrev: () => void;
  onSwipeNext: () => void;
}

export function FeaturedImage({
  image,
  index,
  total,
  onOpen,
  onPrev,
  onNext,
  onSwipePrev,
  onSwipeNext,
}: FeaturedImageProps) {
  const {
    activeDirection: activeArrow,
    showDirection: showArrowFeedback,
  } = useTransientDirectionFeedback();
  const positionLabel = `${index + 1} / ${total}`;
  const { displayTitle, displayTag, displayDescription } = getGalleryDisplayText(image);
  const descriptionPreview = displayDescription
    ? getMobileDescriptionPreview(displayDescription)
    : null;
  const previewText =
    descriptionPreview?.isTruncated
      ? descriptionPreview.preview
          .slice(0, -OPEN_DETAILS_LABEL.length)
          .trimEnd()
      : descriptionPreview?.preview;
  const handleSwipePrev = useCallback(() => {
    showArrowFeedback("left");
    onSwipePrev();
  }, [onSwipePrev, showArrowFeedback]);

  const handleSwipeNext = useCallback(() => {
    showArrowFeedback("right");
    onSwipeNext();
  }, [onSwipeNext, showArrowFeedback]);

  const { consumeSwipe, swipeHandlers } = useSwipeNavigation({
    onSwipeLeft: handleSwipeNext,
    onSwipeRight: handleSwipePrev,
  });
  const featuredSrc = image.featuredSrc ?? image.src;
  const featuredSrcSet = image.featuredSrcSet ?? image.srcSet;
  const featuredWidth = image.featuredWidth ?? image.width;
  const featuredHeight = image.featuredHeight ?? image.height;
  const imageStyle = image.disableObjectPosition
    ? undefined
    : ({
        "--gallery-featured-object-position":
          image.objectPosition ?? defaultFeaturedObjectPosition,
        "--gallery-featured-mobile-object-position":
          image.mobileObjectPosition ??
          image.objectPosition ??
          defaultFeaturedObjectPosition,
      } as CSSProperties);
  const objectPositionClass = image.disableObjectPosition
    ? "gallery-featured-image--native-position"
    : "";

  return (
    <figure className="gallery-featured-frame group relative h-[clamp(420px,62svh,620px)] w-full flex-none cursor-pointer overflow-hidden rounded-xl bg-site-media tall-md:h-[calc(100%_-_5.5rem)] tall-md:min-h-0 tall-md:flex-none land-sm:h-[calc(100svh_-_3rem_-_17px)] land-sm:flex-none">
      <img
        key={image.id}
        src={featuredSrc}
        srcSet={featuredSrcSet}
        sizes={image.sizes}
        alt={image.alt}
        width={featuredWidth}
        height={featuredHeight}
        loading="eager"
        decoding="async"
        fetchpriority="high"
        style={imageStyle}
        className={`gallery-featured-image ${objectPositionClass} h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105`}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-site-navy/55 via-transparent to-site-navy/80"
        aria-hidden="true"
      />

      <figcaption className="absolute inset-x-0 bottom-0">
        <div className={`grid w-full items-center p-2.5 text-center sm:grid-cols-[minmax(0,1fr)_auto] sm:grid-rows-[auto_auto_auto] sm:items-start sm:px-20 sm:text-left land-sm:grid-rows-[auto_auto] land-sm:gap-x-6 land-sm:gap-y-0.5 land-sm:px-20 land-sm:py-2 ${mediaCaptionSurfaceClass}`}>
          <h2 className="text-xl font-bold leading-tight sm:col-start-1 sm:row-start-1 sm:self-baseline sm:text-2xl land-sm:text-base">
            {displayTitle}
          </h2>
          <p className="truncate text-xl font-bold uppercase leading-tight tracking-widest text-site-accent-soft sm:col-start-2 sm:row-start-1 sm:self-baseline sm:text-right sm:text-2xl land-sm:text-base">
            {displayTag}
          </p>
          {previewText && (
            <p className="text-sm leading-snug text-site-subtle sm:col-start-1 sm:row-start-2 land-sm:hidden">
              {previewText}
            </p>
          )}
          <p
            aria-hidden="true"
            className={`${descriptionPreview?.isTruncated ? "relative block" : "hidden"} font-bold text-site-on-dark underline underline-offset-2 transition-colors group-hover:text-site-accent-soft sm:col-start-1 sm:row-start-3 sm:mt-2.5 sm:self-baseline land-sm:row-start-2 land-sm:mt-0 land-sm:block land-sm:text-sm land-sm:leading-none`}
          >
            <span>{OPEN_DETAILS_LABEL}</span>
            {descriptionPreview?.isTruncated && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-normal text-site-on-dark no-underline sm:hidden">
                {positionLabel}
              </span>
            )}
          </p>
          <p className={`${descriptionPreview?.isTruncated ? "hidden sm:block" : ""} text-right text-xs sm:col-start-2 sm:row-start-3 sm:mt-2.5 sm:self-baseline land-sm:row-start-2 land-sm:mt-0 land-sm:text-[10px] land-sm:leading-none`}>
            {positionLabel}
          </p>
        </div>
      </figcaption>

      <button
        type="button"
        aria-label={`${displayTitle}. ${displayTag}. ${positionLabel}. ${OPEN_DETAILS_LABEL} en la galería`}
        className={`absolute inset-0 z-10 block h-full w-full touch-pan-y cursor-pointer ${focusRingClass}`}
        onClick={(event) => {
          if (consumeSwipe()) {
            event.preventDefault();
            return;
          }

          onOpen(event);
        }}
        {...swipeHandlers}
      >
        <span className="sr-only">{OPEN_DETAILS_LABEL}</span>
      </button>

      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-3">
        <NavigationArrowButton
          direction="previous"
          label="Imagen anterior"
          isActive={activeArrow === "left"}
          onClick={(event) => {
            showArrowFeedback("left");
            onPrev(event);
          }}
          className="pointer-events-auto"
        />
        <NavigationArrowButton
          direction="next"
          label="Imagen siguiente"
          isActive={activeArrow === "right"}
          onClick={(event) => {
            showArrowFeedback("right");
            onNext(event);
          }}
          className="pointer-events-auto"
        />
      </div>
    </figure>
  );
}
