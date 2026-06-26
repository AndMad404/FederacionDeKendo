import { useEffect, useRef, type RefObject } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryImage } from "../types";

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      triggerRef.current?.focus();
    };
  }, [triggerRef]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
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
          onPrev();
          break;
        case "ArrowRight":
          onNext();
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
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lightbox-title"
        className="relative w-full max-w-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeBtnRef}
          type="button"
          aria-label="Cerrar galería"
          onClick={onClose}
          className="absolute -top-14 right-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-red-700 text-white transition-colors hover:bg-red-600"
        >
          <X size={20} />
        </button>

        <div className="mx-auto w-fit max-w-full overflow-hidden rounded-3xl">
          <img
            src={image.src}
            alt={image.title}
            width={image.width}
            height={image.height}
            className="block max-h-[58dvh] max-w-full w-auto object-contain sm:max-h-[75vh]"
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Imagen anterior"
              onClick={(event) => {
                event.stopPropagation();
                onPrev();
              }}
              className="fixed left-3 top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 md:left-6 md:h-12 md:w-12"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              aria-label="Imagen siguiente"
              onClick={(event) => {
                event.stopPropagation();
                onNext();
              }}
              className="fixed right-3 top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 md:right-6 md:h-12 md:w-12"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          <div className="flex-1 px-4 text-center">
            <p id="lightbox-title" className="text-lg font-semibold">
              {image.title}
            </p>
            <p className="text-md uppercase tracking-widest text-red-400">
              {image.tag}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
