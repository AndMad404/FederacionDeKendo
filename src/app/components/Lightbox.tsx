import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryImage } from "../types";
import { useSwipeNavigation } from "../hooks/useSwipeNavigation";
import { getGalleryDisplayText } from "./gallery/galleryText";
import {
  focusRingClass,
  modalNavigationButtonClass,
  panelSurfaceClass,
} from "../styles/shared";

const LIGHTBOX_IMAGE_SIZES = "(max-width: 640px) 92vw, 75vw";
const activeArrowClass = "border-site-accent bg-site-accent-strong text-site-on-dark";
type ArrowDirection = "left" | "right";

interface LightboxProps {
  image: GalleryImage;
  index: number;
  total: number;
  triggerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox({
  image,
  index,
  total,
  triggerRef,
  onClose,
  onPrev,
  onNext,
}: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [activeArrow, setActiveArrow] = useState<ArrowDirection | null>(null);
  const positionLabel = `${index + 1} / ${total}`;
  const { displayTitle, displayTag, displayDescription } = getGalleryDisplayText(image);

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

  const handlePrev = useCallback(() => {
    showArrowFeedback("left");
    onPrev();
  }, [onPrev, showArrowFeedback]);

  const handleNext = useCallback(() => {
    showArrowFeedback("right");
    onNext();
  }, [onNext, showArrowFeedback]);

  const { swipeHandlers } = useSwipeNavigation({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
  });

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      triggerRef.current?.focus();
    };
  }, [triggerRef]);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          handlePrev();
          break;
        case "ArrowRight":
          handleNext();
          break;
        case "Tab": {
          const focusable = dialog!.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          if (focusable.length === 0) break;

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
          break;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handlePrev, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-site-overlay/70 p-4 land-sm:p-2"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lightbox-title"
        aria-describedby={displayDescription ? "lightbox-description" : undefined}
        className="relative flex max-h-[calc(100svh-2rem)] w-full max-w-5xl touch-pan-y flex-col items-center gap-3 text-site-on-dark land-sm:h-[calc(100svh-1rem)] land-sm:max-h-none land-sm:max-w-[calc(100vw-2rem)] land-sm:gap-0"
        onClick={(event) => event.stopPropagation()}
        {...swipeHandlers}
      >
        <button
          ref={closeBtnRef}
          type="button"
          aria-label="Cerrar galería"
          onClick={onClose}
          className={`fixed right-4 top-4 z-[60] flex size-11 cursor-pointer items-center justify-center rounded-full bg-site-accent-strong text-site-on-dark transition-colors hover:bg-site-accent-hover land-sm:right-2 land-sm:top-2 ${focusRingClass}`}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="flex h-[min(54svh,32rem)] min-h-0 w-full items-center justify-center overflow-hidden rounded-3xl bg-site-overlay/70 sm:h-[min(68svh,36rem)] land-sm:h-full land-sm:flex-none">
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes={LIGHTBOX_IMAGE_SIZES}
            alt={image.title}
            width={image.width}
            height={image.height}
            decoding="async"
            className="block h-auto max-h-full w-auto max-w-full rounded-3xl object-contain land-sm:h-full land-sm:max-h-none land-sm:w-full land-sm:max-w-none"
          />
        </div>

        <div className="grid w-full max-w-[22rem] grid-cols-[auto_auto] items-center justify-between gap-x-[min(75%,calc(100%_-_5.5rem))] gap-y-[clamp(1.5rem,5vw,2.25rem)] sm:max-w-[calc(100vw-4rem)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:justify-around sm:gap-x-4 sm:gap-y-3 land-sm:absolute land-sm:inset-0 land-sm:z-10 land-sm:block land-sm:max-w-none">
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={(event) => {
              event.stopPropagation();
              handlePrev();
            }}
            className={`${modalNavigationButtonClass} ${
              activeArrow === "left" ? activeArrowClass : ""
            } justify-self-end sm:justify-self-center land-sm:absolute land-sm:left-3 land-sm:top-1/2 land-sm:-translate-y-1/2 ${focusRingClass}`}
          >
            <ChevronLeft size={24} aria-hidden="true" />
          </button>

          <div className={`col-span-2 row-start-2 grid min-h-[9.5rem] w-full min-w-0 max-w-full grid-rows-[auto_auto_minmax(0,1fr)_auto] items-center rounded-2xl px-4 py-3 text-center shadow-xl shadow-site-overlay/40 backdrop-blur-sm sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:max-w-none sm:items-center sm:rounded-3xl sm:px-5 sm:py-4 land-sm:absolute land-sm:bottom-3 land-sm:left-1/2 land-sm:w-[min(28rem,calc(100%_-_6rem))] land-sm:-translate-x-1/2 land-sm:min-h-0 land-sm:grid-cols-[minmax(0,1fr)_auto] land-sm:grid-rows-[auto_auto] land-sm:gap-x-4 land-sm:gap-y-1 land-sm:rounded-2xl land-sm:px-3 land-sm:py-2 land-sm:text-left ${panelSurfaceClass}`}>
            <h2
              id="lightbox-title"
              className="line-clamp-2 text-xl font-bold leading-tight land-sm:col-start-1 land-sm:row-start-1 land-sm:text-base"
            >
              {displayTitle}
            </h2>
            <p className="truncate pt-1 text-sm font-bold uppercase tracking-widest text-site-accent land-sm:col-start-2 land-sm:row-start-1 land-sm:justify-self-end land-sm:pt-0 land-sm:text-right land-sm:text-[10px]">
              {displayTag}
            </p>
            {displayDescription && (
              <div id="lightbox-description" className="min-h-0 land-sm:col-start-1 land-sm:row-start-2">
                <p className="text-sm leading-snug text-site-subtle land-sm:line-clamp-2 land-sm:text-[10px] land-sm:leading-tight">
                  {displayDescription}
                </p>
              </div>
            )}
            <p className="text-xs land-sm:col-start-2 land-sm:row-start-2 land-sm:justify-self-end land-sm:self-end land-sm:text-right land-sm:text-[10px]">
              {positionLabel}
            </p>
          </div>

          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={(event) => {
              event.stopPropagation();
              handleNext();
            }}
            className={`${modalNavigationButtonClass} ${
              activeArrow === "right" ? activeArrowClass : ""
            } justify-self-start sm:col-start-3 sm:justify-self-center land-sm:absolute land-sm:right-3 land-sm:top-1/2 land-sm:-translate-y-1/2 ${focusRingClass}`}
          >
            <ChevronRight size={24} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
