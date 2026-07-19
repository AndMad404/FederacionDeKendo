import type { GalleryImage } from "../../types";
import { focusRingClass } from "../../styles/shared";

interface GalleryDotsProps {
  images: GalleryImage[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function GalleryDots({
  images,
  activeIndex,
  onSelect,
}: GalleryDotsProps) {
  return (
    <div
      role="group"
      aria-label="Selector de imágenes de galería"
      className="min-h-11 overflow-x-auto land-sm:hidden"
    >
      <div className="mx-auto flex w-max items-center justify-center">
        {images.map((image, index) => (
          <button
            type="button"
            aria-label={`Ver imagen ${index + 1} de ${images.length}`}
            aria-current={index === activeIndex ? "true" : undefined}
            key={image.id}
            onClick={() => onSelect(index)}
            className={`group grid size-11 shrink-0 place-items-center rounded-full ${focusRingClass}`}
          >
            <span
              aria-hidden="true"
              className={`rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? "h-3 w-5 bg-site-accent sm:h-4 sm:w-6"
                  : "size-3 bg-site-action/70 group-hover:bg-site-action-soft/80 sm:size-4"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
