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
      className="flex h-4 items-center justify-center gap-3 land-sm:hidden"
    >
      {images.map((image, index) => (
        <button
          type="button"
          aria-label={`Ver imagen ${index + 1} de ${images.length}`}
          aria-current={index === activeIndex ? "true" : undefined}
          key={image.id}
          onClick={() => onSelect(index)}
          className={`rounded-full transition-all duration-300 ${focusRingClass} ${
            index === activeIndex
              ? "h-3 w-5 bg-red-400 sm:h-4 sm:w-6 land-sm:h-2.5"
              : "h-3 w-3 bg-blue-500/70 hover:bg-blue-400/80 sm:h-4 sm:w-4 land-sm:h-2.5 land-sm:w-2.5"
          }`}
        />
      ))}
    </div>
  );
}
