import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImage } from "../../types";
import { useSwipeNavigation } from "../../hooks/useSwipeNavigation";
import {
  getGalleryDisplayText,
  getMobileDescriptionPreview,
  SEE_MORE_LABEL,
} from "./galleryText";
import { focusRingClass } from "../../styles/shared";

const highPriorityImageProps = { fetchpriority: "high" } as const;
const defaultFeaturedObjectPosition = "center 0%";
const activeArrowClass = "border-red-400 bg-red-700";
type ArrowDirection = "left" | "right";

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
      className={`pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-blue-500 bg-black/80 transition-colors hover:bg-red-700 ${
        isActive ? activeArrowClass : ""
      } ${focusRingClass}`}
    >
      {direction === "left" ? (
        <ChevronLeft size={20} aria-hidden="true" className="text-white" />
      ) : (
        <ChevronRight size={20} aria-hidden="true" className="text-white" />
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
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [activeArrow, setActiveArrow] = useState<ArrowDirection | null>(null);
  const positionLabel = `${index + 1} / ${total}`;
  const { displayTitle, displayTag, displayDescription } = getGalleryDisplayText(image);
  const descriptionPreview = displayDescription
    ? getMobileDescriptionPreview(displayDescription)
    : null;
  const previewText =
    descriptionPreview?.isTruncated
      ? descriptionPreview.preview.slice(0, -SEE_MORE_LABEL.length).trimEnd()
      : descriptionPreview?.preview;
  const showArrowFeedback = useCallback((direction: ArrowDirection) => {
    setActiveArrow(direction);

    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setActiveArrow(null);
      feedbackTimeoutRef.current = null;
    }, 220);
  }, []);

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

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  return (
    <figure className="gallery-featured-frame group relative h-[clamp(420px,62svh,620px)] w-full flex-none cursor-pointer overflow-hidden rounded-2xl bg-stone-800 sm:rounded-3xl tall-md:min-h-0 tall-md:flex-1 land-sm:h-[calc(100svh_-_3rem_-_6px)] land-sm:flex-none">
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
        {...highPriorityImageProps}
        style={imageStyle}
        className={`gallery-featured-image ${objectPositionClass} h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105`}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
        aria-hidden="true"
      />

      <figcaption className="absolute bottom-0 left-0 right-0 flex justify-center p-3 sm:block sm:p-6 land-sm:justify-start land-sm:p-2">
        <div className="grid min-h-[9.5rem] w-full max-w-[22rem] grid-rows-[auto_auto_minmax(0,1fr)_auto] items-center rounded-2xl border border-blue-500 bg-black/75 px-4 py-3 text-center text-white shadow-xl backdrop-blur-sm sm:items-start sm:rounded-3xl sm:px-5 sm:py-4 sm:text-left land-sm:min-h-0 land-sm:max-w-[16rem] land-sm:rounded-xl land-sm:px-3 land-sm:py-1.5">
          <p className="text-xl font-bold leading-tight sm:text-2xl land-sm:text-base">
            {displayTitle}
          </p>
          <p className="pt-1 truncate text-base font-bold uppercase tracking-widest text-red-400 sm:text-base land-sm:text-[10px]">
            {displayTag}
          </p>
          {previewText && (
            <p className="text-sm leading-snug text-stone-200 land-sm:text-[10px] land-sm:leading-tight">
              {previewText}
              {descriptionPreview?.isTruncated && (
                <span
                  aria-hidden="true"
                  className="block font-bold text-blue-100 underline underline-offset-2 transition-colors group-hover:text-red-400"
                >
                  {SEE_MORE_LABEL}
                </span>
              )}
            </p>
          )}
          <p className="text-xs land-sm:text-[10px]">
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

      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-3">
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
