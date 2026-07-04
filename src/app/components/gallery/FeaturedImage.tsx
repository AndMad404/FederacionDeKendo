import type { CSSProperties, MouseEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImage } from "../../types";

const highPriorityImageProps = { fetchpriority: "high" } as const;
const focusRingClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300";

interface NavArrowProps {
  direction: "left" | "right";
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

function NavArrow({ direction, onClick }: NavArrowProps) {
  return (
    <button
      type="button"
      aria-label={direction === "left" ? "Imagen anterior" : "Imagen siguiente"}
      onClick={onClick}
      className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-blue-500 bg-black/80 transition-colors hover:bg-red-700 [@media_(orientation:landscape)_and_(max-height:640px)]:h-8 [@media_(orientation:landscape)_and_(max-height:640px)]:w-8 ${focusRingClass}`}
    >
      {direction === "left" ? (
        <ChevronLeft size={20} aria-hidden="true" className="text-white" />
      ) : (
        <ChevronRight size={20} aria-hidden="true" className="text-white" />
      )}
    </button>
  );
}

interface FeaturedImageProps {
  image: GalleryImage;
  index: number;
  total: number;
  onOpen: (event: MouseEvent<HTMLButtonElement>) => void;
  onPrev: (event: MouseEvent<HTMLButtonElement>) => void;
  onNext: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function FeaturedImage({
  image,
  index,
  total,
  onOpen,
  onPrev,
  onNext,
}: FeaturedImageProps) {
  const positionLabel = `${index + 1} / ${total}`;
  const featuredSrc = image.featuredSrc ?? image.src;
  const featuredSrcSet = image.featuredSrcSet ?? image.srcSet;
  const featuredWidth = image.featuredWidth ?? image.width;
  const featuredHeight = image.featuredHeight ?? image.height;
  const imageStyle = image.disableObjectPosition
    ? undefined
    : ({
        "--gallery-featured-object-position":
          image.objectPosition ?? "center 0%",
      } as CSSProperties);
  const objectPositionClass = image.disableObjectPosition
    ? "gallery-featured-image--native-position"
    : "";

  return (
    <figure className="gallery-featured-frame group relative h-[clamp(420px,62svh,620px)] w-full flex-none cursor-pointer overflow-hidden rounded-2xl bg-stone-800 sm:rounded-3xl [@media_(min-width:768px)_and_(min-height:640px)]:min-h-0 [@media_(min-width:768px)_and_(min-height:640px)]:flex-1 [@media_(orientation:landscape)_and_(max-height:640px)]:h-[calc(100svh_-_3rem_-_6px)] [@media_(orientation:landscape)_and_(max-height:640px)]:flex-none">
      <img
        key={image.id}
        src={featuredSrc}
        srcSet={featuredSrcSet}
        sizes={image.sizes}
        alt={image.title}
        width={featuredWidth}
        height={featuredHeight}
        loading="eager"
        decoding="async"
        {...highPriorityImageProps}
        style={imageStyle}
        className={`gallery-featured-image ${objectPositionClass} h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105`}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
        aria-hidden="true"
      />

      <figcaption className="absolute bottom-0 left-0 right-0 flex justify-center p-3 sm:block sm:p-6 [@media_(orientation:landscape)_and_(max-height:640px)]:justify-start [@media_(orientation:landscape)_and_(max-height:640px)]:p-2">
        <div className="inline-flex max-w-full flex-col rounded-2xl border border-blue-500 bg-black/70 px-4 py-3 text-center text-white shadow-xl backdrop-blur-sm sm:rounded-3xl sm:px-5 sm:py-4 sm:text-left [@media_(orientation:landscape)_and_(max-height:640px)]:rounded-xl [@media_(orientation:landscape)_and_(max-height:640px)]:px-3 [@media_(orientation:landscape)_and_(max-height:640px)]:py-1.5">
          <p className="text-xl font-bold sm:text-2xl [@media_(orientation:landscape)_and_(max-height:640px)]:text-base">
            {image.title}
          </p>
          <p className="text-sm font-bold uppercase tracking-widest text-red-400 sm:text-base [@media_(orientation:landscape)_and_(max-height:640px)]:text-[10px]">
            {image.tag}
          </p>
          <p className="text-sm sm:text-base [@media_(orientation:landscape)_and_(max-height:640px)]:text-[10px]">
            {positionLabel}
          </p>
        </div>
      </figcaption>

      <button
        type="button"
        aria-label={`${image.title}. ${image.tag}. ${positionLabel}. Abrir imagen`}
        className={`absolute inset-0 z-10 block h-full w-full cursor-pointer ${focusRingClass}`}
        onClick={onOpen}
      >
        <span className="sr-only">Abrir imagen</span>
      </button>

      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-3">
        <NavArrow direction="left" onClick={onPrev} />
        <NavArrow direction="right" onClick={onNext} />
      </div>
    </figure>
  );
}
