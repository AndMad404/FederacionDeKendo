import { useCallback, useRef, type RefObject } from "react";
import type { GalleryImage } from "../types";
import { useModalBehavior } from "../hooks/useModalBehavior";
import { useSwipeNavigation } from "../hooks/useSwipeNavigation";
import { useTransientDirectionFeedback } from "../hooks/useTransientDirectionFeedback";
import { getGalleryDisplayText } from "./gallery/galleryText";
import { panelSurfaceClass } from "../styles/shared";
import {
  ModalCloseButton,
  NavigationArrowButton,
} from "./ui/ModalControls";

const LIGHTBOX_IMAGE_SIZES = "(max-width: 640px) 92vw, 75vw";
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
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const {
    activeDirection: activeArrow,
    showDirection: showArrowFeedback,
  } = useTransientDirectionFeedback();
  const positionLabel = `${index + 1} / ${total}`;
  const { displayTitle, displayTag, displayDescription } = getGalleryDisplayText(image);

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

  const handleDialogKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNext();
      }
    },
    [handleNext, handlePrev],
  );

  const { dialogRef, onBackdropInteraction } = useModalBehavior({
    initialFocusRef: closeBtnRef,
    triggerRef,
    onClose,
    onKeyDown: handleDialogKeyDown,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex touch-manipulation items-center justify-center bg-site-navy/90 p-4 land-sm:p-2"
      onPointerDown={onBackdropInteraction}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lightbox-title"
        aria-describedby={displayDescription ? "lightbox-description" : undefined}
        className="relative flex max-h-[calc(100svh-2rem)] w-full max-w-5xl touch-pan-y flex-col items-center gap-[10px] text-site-on-dark sm:gap-3 land-sm:h-[calc(100svh-1rem)] land-sm:max-h-none land-sm:max-w-[calc(100vw-2rem)] land-sm:gap-0"
        onPointerDown={(event) => {
          event.stopPropagation();
          swipeHandlers.onPointerDown(event);
        }}
        onPointerUp={swipeHandlers.onPointerUp}
        onPointerCancel={swipeHandlers.onPointerCancel}
      >
        <ModalCloseButton
          ref={closeBtnRef}
          label="Cerrar galería"
          onClick={onClose}
        />

        <div className="flex h-[min(54svh,32rem)] min-h-0 w-full items-end justify-center overflow-hidden rounded-xl bg-site-navy sm:h-[min(68svh,36rem)] land-sm:h-full land-sm:flex-none">
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes={LIGHTBOX_IMAGE_SIZES}
            alt={image.title}
            width={image.width}
            height={image.height}
            decoding="async"
            className="block h-auto max-h-full w-auto max-w-full rounded-xl object-contain lg:h-full lg:w-full lg:max-w-none lg:object-cover land-sm:h-full land-sm:max-h-none land-sm:w-full land-sm:max-w-none land-sm:object-cover"
          />
        </div>

        <div className="grid w-full max-w-[22rem] grid-cols-[auto_auto] items-center justify-between gap-x-[min(75%,calc(100%_-_5.5rem))] gap-y-[10px] sm:max-w-[calc(100vw-4rem)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:justify-around sm:gap-x-4 sm:gap-y-3 lg:absolute lg:inset-0 lg:z-10 lg:block lg:max-w-none land-sm:absolute land-sm:inset-0 land-sm:z-10 land-sm:block land-sm:max-w-none">
          <NavigationArrowButton
            direction="previous"
            label="Imagen anterior"
            isActive={activeArrow === "left"}
            onClick={(event) => {
              event.stopPropagation();
              handlePrev();
            }}
            className="justify-self-end sm:justify-self-center lg:absolute lg:left-3 lg:top-1/2 lg:-translate-y-1/2 land-sm:absolute land-sm:left-3 land-sm:top-1/2 land-sm:-translate-y-1/2"
          />

          <div className={`col-span-2 row-start-2 grid h-[9.5rem] w-full min-w-0 max-w-full grid-rows-[auto_auto_minmax(0,1fr)_auto] items-center overflow-hidden px-4 py-3 text-center sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:max-w-none sm:items-center sm:px-5 sm:py-4 lg:absolute lg:bottom-3 lg:left-1/2 lg:h-24 lg:w-[min(30rem,calc(100%_-_6rem))] lg:-translate-x-1/2 lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[auto_auto] lg:gap-x-4 lg:gap-y-1 lg:px-3 lg:py-2 lg:text-left land-sm:absolute land-sm:bottom-3 land-sm:left-1/2 land-sm:h-24 land-sm:w-[min(30rem,calc(100%_-_6rem))] land-sm:-translate-x-1/2 land-sm:grid-cols-[minmax(0,1fr)_auto] land-sm:grid-rows-[auto_auto] land-sm:gap-x-4 land-sm:gap-y-1 land-sm:px-3 land-sm:py-2 land-sm:text-left ${panelSurfaceClass}`}>
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
                <p className="line-clamp-3 text-sm leading-snug text-site-muted lg:line-clamp-2 land-sm:line-clamp-2 land-sm:text-[10px] land-sm:leading-tight">
                  {displayDescription}
                </p>
              </div>
            )}
            <p className="text-xs land-sm:col-start-2 land-sm:row-start-2 land-sm:justify-self-end land-sm:self-end land-sm:text-right land-sm:text-[10px]">
              {positionLabel}
            </p>
          </div>

          <NavigationArrowButton
            direction="next"
            label="Imagen siguiente"
            isActive={activeArrow === "right"}
            onClick={(event) => {
              event.stopPropagation();
              handleNext();
            }}
            className="justify-self-start sm:col-start-3 sm:justify-self-center lg:absolute lg:right-3 lg:top-1/2 lg:-translate-y-1/2 land-sm:absolute land-sm:right-3 land-sm:top-1/2 land-sm:-translate-y-1/2"
          />
        </div>
      </div>
    </div>
  );
}
