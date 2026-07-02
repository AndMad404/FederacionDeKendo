import type { GalleryImage } from "../../types";

const THUMBNAIL_SIZES = "(min-width: 768px) 168px, 17vw";
const focusRingClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300";

interface ThumbnailProps {
  image: GalleryImage;
  onClick: () => void;
}

function Thumbnail({ image, onClick }: ThumbnailProps) {
  return (
    <button
      type="button"
      aria-label={`Ver imagen: ${image.title}`}
      onClick={onClick}
      className={`group relative aspect-[4/3] h-full w-full cursor-pointer overflow-hidden rounded-lg bg-stone-800 ${focusRingClass}`}
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
  onSelect: (index: number) => void;
}

export function GalleryThumbnails({
  images,
  onSelect,
}: GalleryThumbnailsProps) {
  return (
    <div
      role="group"
      aria-label="Miniaturas de galería"
      className="grid h-14 grid-cols-6 gap-1.5 sm:h-16 sm:gap-2 md:h-20 [@media_(orientation:landscape)_and_(max-height:480px)]:hidden"
    >
      {images.map((image, index) => (
        <Thumbnail
          key={image.id}
          image={image}
          onClick={() => onSelect(index)}
        />
      ))}
    </div>
  );
}
