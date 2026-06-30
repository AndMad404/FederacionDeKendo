import type { MouseEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImage } from "../../types";

const highPriorityImageProps = { fetchpriority: "high" } as const;

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
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-blue-500 bg-black/80 transition-colors hover:bg-red-700"
    >
      {direction === "left" ? (
        <ChevronLeft size={20} className="text-white" />
      ) : (
        <ChevronRight size={20} className="text-white" />
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

  return (
    <div className="group relative min-h-0 w-full flex-1 cursor-pointer overflow-hidden rounded-3xl bg-stone-800">
      <button
        type="button"
        aria-label={`${image.title}. ${image.tag}. ${positionLabel}. Abrir imagen`}
        className="block h-full w-full cursor-pointer text-left"
        onClick={onOpen}
      >
        <img
          key={image.id}
          src={image.src}
          srcSet={image.srcSet}
          sizes={image.sizes}
          alt={image.title}
          width={image.width}
          height={image.height}
          loading="eager"
          decoding="async"
          {...highPriorityImageProps}
          style={{ objectPosition: image.objectPosition }}
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4 sm:block sm:p-6">
          <div className="inline-flex max-w-full flex-col rounded-3xl border border-blue-500 bg-black/70 px-5 py-4 text-center text-white shadow-xl backdrop-blur-sm sm:text-left">
            <p className="text-2xl font-bold">
              {image.title}
            </p>
            <p className="text-base font-bold uppercase tracking-widest text-red-400">
              {image.tag}
            </p>
            <p className="text-base">
              {positionLabel}
            </p>
          </div>
        </div>
      </button>

      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3">
        <NavArrow direction="left" onClick={onPrev} />
        <NavArrow direction="right" onClick={onNext} />
      </div>
    </div>
  );
}
