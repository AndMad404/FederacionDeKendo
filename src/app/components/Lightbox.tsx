import { useEffect, useRef, type RefObject } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryImage } from "../types";

const LIGHTBOX_IMAGE_SIZES = "(max-width: 640px) 92vw, 75vw";
const focusRingClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300";

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
  const positionLabel = `${index + 1} / ${total}`;

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 [@media_(orientation:landscape)_and_(max-height:640px)]:p-2"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lightbox-title"
        className="relative flex max-h-[calc(100svh-2rem)] w-full max-w-3xl flex-col items-center [@media_(orientation:landscape)_and_(max-height:640px)]:flex-row [@media_(orientation:landscape)_and_(max-height:640px)]:max-w-[calc(100vw-2rem)] [@media_(orientation:landscape)_and_(max-height:640px)]:justify-center [@media_(orientation:landscape)_and_(max-height:640px)]:gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeBtnRef}
          type="button"
          aria-label="Cerrar galería"
          onClick={onClose}
          className={`fixed right-4 top-4 z-[60] flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-red-700 text-white transition-colors hover:bg-red-600 [@media_(orientation:landscape)_and_(max-height:640px)]:right-2 [@media_(orientation:landscape)_and_(max-height:640px)]:top-2 [@media_(orientation:landscape)_and_(max-height:640px)]:h-9 [@media_(orientation:landscape)_and_(max-height:640px)]:w-9 ${focusRingClass}`}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="mx-auto min-h-0 w-fit max-w-full overflow-hidden rounded-3xl [@media_(orientation:landscape)_and_(max-height:640px)]:mx-0 [@media_(orientation:landscape)_and_(max-height:640px)]:min-w-0 [@media_(orientation:landscape)_and_(max-height:640px)]:max-w-[60vw] [@media_(orientation:landscape)_and_(max-height:640px)]:rounded-2xl">
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes={LIGHTBOX_IMAGE_SIZES}
            alt={image.title}
            width={image.width}
            height={image.height}
            decoding="async"
            className="block w-auto max-w-full max-h-[calc(100svh-11rem)] object-contain sm:max-h-[calc(100svh-12rem)] [@media_(orientation:landscape)_and_(max-height:640px)]:max-h-[calc(100svh-1rem)]"
          />
        </div>

        <div className="mt-4 flex w-full shrink-0 items-center justify-center gap-3 text-white [@media_(orientation:landscape)_and_(max-height:640px)]:mt-0 [@media_(orientation:landscape)_and_(max-height:640px)]:w-60 [@media_(orientation:landscape)_and_(max-height:640px)]:gap-2">
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={(event) => {
              event.stopPropagation();
              onPrev();
            }}
            className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-blue-400 bg-black/85 shadow-xl shadow-black/40 transition-colors hover:bg-blue-950/90 md:h-12 md:w-12 ${focusRingClass}`}
          >
            <ChevronLeft size={24} aria-hidden="true" />
          </button>

          <div className="min-w-0 max-w-[calc(100vw-8rem)] flex-1 rounded-3xl border border-blue-500 bg-black/85 px-5 py-3 text-center shadow-xl shadow-black/40 backdrop-blur-sm [@media_(orientation:landscape)_and_(max-height:640px)]:max-w-none [@media_(orientation:landscape)_and_(max-height:640px)]:rounded-2xl [@media_(orientation:landscape)_and_(max-height:640px)]:px-3 [@media_(orientation:landscape)_and_(max-height:640px)]:py-2">
            <p id="lightbox-title" className="text-xl font-bold sm:text-2xl [@media_(orientation:landscape)_and_(max-height:640px)]:text-base">
              {image.title}
            </p>
            <p className="text-sm font-bold uppercase tracking-widest text-red-400 sm:text-base [@media_(orientation:landscape)_and_(max-height:640px)]:text-[10px]">
              {image.tag}
            </p>
            <p className="text-sm sm:text-base [@media_(orientation:landscape)_and_(max-height:640px)]:text-[10px]">
              {positionLabel}
            </p>
          </div>

          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={(event) => {
              event.stopPropagation();
              onNext();
            }}
            className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-blue-400 bg-black/85 shadow-xl shadow-black/40 transition-colors hover:bg-blue-950/90 md:h-12 md:w-12 ${focusRingClass}`}
          >
            <ChevronRight size={24} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
