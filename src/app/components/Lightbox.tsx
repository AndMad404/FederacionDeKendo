import { useCallback, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { GalleryImage } from "../types";
import { useModalBehavior } from "../hooks/useModalBehavior";
import { usePinchZoom } from "../hooks/usePinchZoom";
import { useSwipeNavigation } from "../hooks/useSwipeNavigation";
import { useTransientDirectionFeedback } from "../hooks/useTransientDirectionFeedback";
import {
  ModalCloseButton,
  NavigationArrowButton,
} from "./ui/ModalControls";
import { useLanguage } from "../config/i18n";

const LIGHTBOX_IMAGE_SIZES = "(max-width: 640px) 92vw, 75vw";

interface LightboxProps {
  image: GalleryImage;
  triggerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox({
  image,
  triggerRef,
  onClose,
  onPrev,
  onNext,
}: LightboxProps) {
  const { copy } = useLanguage();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const {
    activeDirection: activeArrow,
    showDirection: showArrowFeedback,
  } = useTransientDirectionFeedback();

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
  const { scale, transformOrigin, handlers: pinchZoomHandlers } = usePinchZoom(image.id);

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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex touch-manipulation items-center justify-center bg-site-navy/90 p-4 land-sm:p-2"
      onPointerDown={onBackdropInteraction}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={image.alt}
        className="relative flex max-h-[calc(100svh-2rem)] w-full max-w-5xl touch-pan-y flex-col items-center text-site-on-dark land-sm:h-[calc(100svh-1rem)] land-sm:max-h-none land-sm:max-w-[calc(100vw-2rem)]"
        onPointerDown={(event) => {
          event.stopPropagation();
          const startedPinch = pinchZoomHandlers.onPointerDown(event);
          if (startedPinch) swipeHandlers.onPointerCancel(event);
          else swipeHandlers.onPointerDown(event);
        }}
        onPointerMove={pinchZoomHandlers.onPointerMove}
        onPointerUp={(event) => {
          const didPinch = pinchZoomHandlers.onPointerUp(event);
          if (didPinch) swipeHandlers.onPointerCancel(event);
          else swipeHandlers.onPointerUp(event);
        }}
        onPointerCancel={(event) => {
          pinchZoomHandlers.onPointerCancel(event);
          swipeHandlers.onPointerCancel(event);
        }}
      >
        <ModalCloseButton ref={closeBtnRef} label={copy.gallery.close} onClick={onClose} />

        <div data-lightbox-image className="flex h-[min(54svh,32rem)] min-h-0 w-full touch-none items-end justify-center overflow-hidden rounded-xl bg-site-navy sm:h-[min(68svh,36rem)] land-sm:h-full land-sm:flex-none">
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes={LIGHTBOX_IMAGE_SIZES}
            alt={image.alt}
            width={image.width}
            height={image.height}
            decoding="async"
            className="block h-auto max-h-full w-auto max-w-full rounded-xl object-contain lg:h-full lg:w-full lg:max-w-none lg:object-cover land-sm:h-full land-sm:max-h-none land-sm:w-full land-sm:max-w-none land-sm:object-cover"
            style={{ transform: `scale(${scale})`, transformOrigin }}
          />
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-3">
          <NavigationArrowButton direction="previous" label={copy.gallery.previousImage} isActive={activeArrow === "left"} onClick={(event) => { event.stopPropagation(); handlePrev(); }} className="pointer-events-auto" />
          <NavigationArrowButton direction="next" label={copy.gallery.nextImage} isActive={activeArrow === "right"} onClick={(event) => { event.stopPropagation(); handleNext(); }} className="pointer-events-auto" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
