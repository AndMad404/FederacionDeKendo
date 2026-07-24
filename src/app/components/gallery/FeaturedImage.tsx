import {
  useCallback,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImage } from "../../types";
import { useSwipeNavigation } from "../../hooks/useSwipeNavigation";
import { useTransientDirectionFeedback } from "../../hooks/useTransientDirectionFeedback";
import {
  getGalleryDisplayText,
  getMobileDescriptionPreview,
  SEE_MORE_LABEL,
} from "./galleryText";
import { focusRingClass, panelSurfaceClass } from "../../styles/shared";

const defaultFeaturedObjectPosition = "center 0%";
const activeArrowClass = "border-site-accent bg-site-accent-strong";

interface NavArrowProps {
  direction: "left" | "right";
  isActive: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

function NavArrow({ direction, isActive, onClick }: NavArrowProps) {
  return (
    <button
      type="button"
      aria-label={direction === "left" ? "Imagen anterior" : "Imagen siguiente"}
      onClick={onClick}
      className={`pointer-events-auto flex size-11 items-center justify-center rounded-full border border-site-action/70 bg-site-overlay/70 transition-colors hover:bg-site-accent-strong ${
        isActive ? activeArrowClass : ""
      } ${focusRingClass}`}
    >
      {direction === "left" ? (
        <ChevronLeft size={20} aria-hidden="true" className="text-site-on-dark" />
      ) : (
        <ChevronRight size={20} aria-hidden="true" className="text-site-on-dark" />
      )}
    </button>
  );
}

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
      ? descriptionPreview.preview.slice(0, -SEE_MORE_LABEL.length).trimEnd()
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
    <figure className="gallery-featured-frame group relative h-[clamp(420px,62svh,620px)] w-full flex-none cursor-pointer overflow-hidden rounded-3xl bg-site-media tall-md:min-h-0 tall-md:flex-1 land-sm:h-[calc(100svh_-_3rem_-_6px)] land-sm:flex-none">
      <img
        key={image.id}
        src={featuredSrc}
        srcSet={featuredSrcSet}
        sizes={image.sizes}
        alt={image.title}
        width={featuredWidth}
        height={featuredHeight}
        loading="eager"
        decoding="async"
        fetchpriority="high"
        style={imageStyle}
        className={`gallery-featured-image ${objectPositionClass} h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105`}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-site-overlay/70 via-site-overlay/10 to-transparent"
        aria-hidden="true"
      />

      <figcaption className="absolute inset-x-0 bottom-0 flex justify-center p-3 sm:block sm:p-6 land-sm:flex land-sm:justify-center land-sm:px-16 land-sm:py-2">
        <div className={`grid w-full max-w-[28rem] items-center rounded-3xl px-4 py-3 text-center text-site-on-dark shadow-xl backdrop-blur-sm sm:items-start sm:px-5 sm:py-4 sm:text-left land-sm:max-w-[28rem] land-sm:grid-cols-[minmax(0,1fr)_auto] land-sm:grid-rows-[auto_auto] land-sm:gap-x-6 land-sm:px-4 land-sm:py-2 ${panelSurfaceClass}`}>
          <h2 className="text-xl font-bold leading-tight sm:text-2xl land-sm:text-base">
            {displayTitle}
          </h2>
          <p className="truncate pt-1 text-base font-bold uppercase tracking-widest text-site-accent land-sm:text-[10px]">
            {displayTag}
          </p>
          {previewText && (
            <p className="text-sm leading-snug text-site-subtle land-sm:hidden">
              {previewText}
              {descriptionPreview?.isTruncated && (
                <span
                  aria-hidden="true"
                  className="block font-bold text-site-action-text underline underline-offset-2 transition-colors group-hover:text-site-accent"
                >
                  {SEE_MORE_LABEL}
                </span>
              )}
            </p>
          )}
          <p className="hidden font-bold text-site-action-text underline underline-offset-2 transition-colors group-hover:text-site-accent land-sm:col-start-2 land-sm:row-start-1 land-sm:block land-sm:self-end land-sm:text-sm">
            {SEE_MORE_LABEL}
          </p>
          <p className="text-xs land-sm:col-start-2 land-sm:row-start-2 land-sm:self-start land-sm:text-right land-sm:text-[10px]">
            {positionLabel}
          </p>
        </div>
      </figcaption>

      <button
        type="button"
        aria-label={`${displayTitle}. ${displayTag}. ${positionLabel}. Abrir imagen para ver mas detalles`}
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
        <span className="sr-only">Abrir imagen</span>
      </button>

      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-3">
        <NavArrow
          direction="left"
          isActive={activeArrow === "left"}
          onClick={(event) => {
            showArrowFeedback("left");
            onPrev(event);
          }}
        />
        <NavArrow
          direction="right"
          isActive={activeArrow === "right"}
          onClick={(event) => {
            showArrowFeedback("right");
            onNext(event);
          }}
        />
      </div>
    </figure>
  );
}
