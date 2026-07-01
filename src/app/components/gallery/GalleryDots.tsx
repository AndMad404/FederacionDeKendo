import type { GalleryImage } from "../../types";

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
    <nav
      aria-label="Selector de imágenes de galería"
      className="flex h-4 items-center justify-center gap-3 [@media_(orientation:landscape)_and_(max-height:480px)]:h-3 [@media_(orientation:landscape)_and_(max-height:480px)]:gap-2"
    >
      {images.map((image, index) => (
        <button
          type="button"
          aria-label={`Ver imagen ${index + 1} de ${images.length}`}
          aria-current={index === activeIndex ? "true" : undefined}
          key={image.id}
          onClick={() => onSelect(index)}
          className={`rounded-full transition-all duration-300 ${
            index === activeIndex
              ? "h-3 w-5 bg-red-400 sm:h-4 sm:w-6 [@media_(orientation:landscape)_and_(max-height:480px)]:h-2.5"
              : "h-3 w-3 bg-blue-500/70 hover:bg-blue-400/80 sm:h-4 sm:w-4 [@media_(orientation:landscape)_and_(max-height:480px)]:h-2.5 [@media_(orientation:landscape)_and_(max-height:480px)]:w-2.5"
          }`}
        />
      ))}
    </nav>
  );
}
