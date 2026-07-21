import { useEffect, useRef } from "react";
import type { GalleryImage } from "../../types";
import { focusRingClass } from "../../styles/shared";

const THUMBNAIL_SIZES = "(min-width: 768px) 168px, 17vw";

interface ThumbnailProps {
  image: GalleryImage;
  isActive: boolean;
  buttonRef: (node: HTMLButtonElement | null) => void;
  onClick: () => void;
}

function Thumbnail({ image, isActive, buttonRef, onClick }: ThumbnailProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={`Ver imagen: ${image.title}`}
      aria-current={isActive ? "true" : undefined}
      onClick={onClick}
      className={`group relative aspect-[4/3] h-full w-full cursor-pointer overflow-hidden rounded-lg border-b-4 bg-site-media transition-colors duration-300 hover:border-site-accent ${
        isActive ? "border-site-action" : "border-transparent"
      } ${focusRingClass}`}
    >
      <img
        src={image.thumbnailSrc}
        srcSet={image.thumbnailSrcSet}
        alt=""
        width={image.thumbnailWidth}
        height={image.thumbnailHeight}
        loading="lazy"
        decoding="async"
        sizes={THUMBNAIL_SIZES}
        style={{ objectPosition: image.objectPosition }}
        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
      />
    </button>
  );
}

interface GalleryThumbnailsProps {
  images: GalleryImage[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function GalleryThumbnails({
  images,
  activeIndex,
  onSelect,
}: GalleryThumbnailsProps) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const previousActiveIndexRef = useRef(activeIndex);

  useEffect(() => {
    const strip = stripRef.current;
    const activeButton = buttonRefs.current[activeIndex];
    if (!strip || !activeButton) return;

    const previousIndex = previousActiveIndexRef.current;
    previousActiveIndexRef.current = activeIndex;
    if (previousIndex === activeIndex) return;

    const lastIndex = images.length - 1;
    if (previousIndex === lastIndex && activeIndex === 0) {
      strip.scrollTo({ left: 0 });
      return;
    }

    if (previousIndex === 0 && activeIndex === lastIndex) {
      strip.scrollTo({ left: strip.scrollWidth - strip.clientWidth });
      return;
    }

    const columnGap = Number.parseFloat(getComputedStyle(strip).columnGap) || 0;
    const step = activeButton.getBoundingClientRect().width + columnGap;
    const direction = activeIndex > previousIndex ? 1 : -1;

    strip.scrollBy({ left: direction * step });
  }, [activeIndex, images.length]);

  return (
    <div
      ref={stripRef}
      role="group"
      aria-label="Miniaturas de galería"
      className="grid h-14 scroll-smooth grid-flow-col auto-cols-[17%] gap-1.5 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden motion-reduce:scroll-auto sm:h-16 sm:auto-cols-[calc((100%_-_2.5rem)_/_6)] sm:gap-2 md:h-20 land-sm:hidden"
    >
      {images.map((image, index) => (
        <Thumbnail
          key={image.id}
          image={image}
          isActive={index === activeIndex}
          buttonRef={(node) => {
            buttonRefs.current[index] = node;
          }}
          onClick={() => onSelect(index)}
        />
      ))}
    </div>
  );
}
