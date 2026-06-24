import { useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { LikeButton } from "./LikeButton";
import type { GalleryImage } from "../types";

interface LightboxProps {
  image: GalleryImage;
  liked: boolean;
  likeCount: number;
  /** Ref al elemento que abrió el lightbox — se le restaura el foco al cerrar */
  triggerRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleLike: (e: React.MouseEvent) => void;
}

export function Lightbox({
  image,
  liked,
  likeCount,
  triggerRef,
  onClose,
  onPrev,
  onNext,
  onToggleLike,
}: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Foco inicial en botón de cierre
  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  // Restaurar foco al elemento que abrió el modal
  useEffect(() => {
    return () => {
      triggerRef.current?.focus();
    };
  }, [triggerRef]);

  // Bloquear scroll del body
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Teclado: Escape, flechas y focus trap
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
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
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
          break;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    // Backdrop — click fuera cierra
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Dialog accesible */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lightbox-title"
        className="relative max-w-3xl w-full "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cierre — 44×44px área táctil mínima */}
        <button
          ref={closeBtnRef}
          type="button"
          aria-label="Cerrar galería"
          onClick={onClose}
          className="absolute -top-14 right-0 flex items-center justify-center w-11 h-11 rounded-full bg-red-700 hover:bg-red-600 text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Imagen principal */}
        <img
          src={image.src}
          alt={image.title}
          className="w-full max-h-[75vh] object-contain rounded-3xl"
        />

        {/* Footer: nav + info + like */}
        <div className="flex items-center justify-between mt-4 text-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Imagen anterior"
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="fixed left-3 md:left-6 top-1/2 -translate-y-1/2 z-50 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              aria-label="Imagen siguiente"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="fixed right-3 md:right-6 top-1/2 -translate-y-1/2 z-50 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          <div className="text-center flex-1 px-4">
            <p id="lightbox-title" className="font-semibold text-lg">  
              {image.title}
            </p>
            <p className="text-md text-red-400 uppercase tracking-widest">    
              {image.tag}
            </p>
          </div>

          <LikeButton
            liked={liked}
            count={likeCount}
            onClick={onToggleLike}
            size="md"
            className="cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
