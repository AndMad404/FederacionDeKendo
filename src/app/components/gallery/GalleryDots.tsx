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
    <div className="flex justify-center gap-4">
      {images.map((image, index) => (
        <button
          type="button"
          aria-label={`Ver imagen ${index + 1} de ${images.length}`}
          aria-current={index === activeIndex ? "true" : undefined}
          key={image.id}
          onClick={() => onSelect(index)}
          className={`rounded-full transition-all duration-300 ${
            index === activeIndex
              ? "h-4 w-6 bg-red-400"
              : "h-4 w-4 bg-blue-500/70 hover:bg-blue-400/80"
          }`}
        />
      ))}
    </div>
  );
}
