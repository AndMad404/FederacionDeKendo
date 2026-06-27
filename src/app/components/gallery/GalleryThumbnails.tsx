import type { GalleryImage } from "../../types";

const THUMBNAIL_SIZES = "(min-width: 768px) 168px, 17vw";

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
      className="group relative aspect-[4/3] h-full w-full cursor-pointer overflow-hidden rounded-lg bg-stone-800"
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
    <div className="grid h-16 grid-cols-6 gap-2 md:h-20">
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
