import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GALLERY_IMAGES } from "../data/gallery";
import { useCarousel } from "../hooks/useCarousel";
import { useLikes } from "../hooks/useLikes";
import { LikeButton } from "./LikeButton";
import { Lightbox } from "./Lightbox";
import type { GalleryImage } from "../types";

const THUMBS_COUNT = 6;

// ── Sub-components ────────────────────────────────────────────────────────────

interface NavArrowProps {
  direction: "left" | "right";
  onClick: (e: React.MouseEvent) => void;
}

function NavArrow({ direction, onClick }: NavArrowProps) {
  return (
    <button
      type="button"
      aria-label={direction === "left" ? "Imagen anterior" : "Imagen siguiente"}
      onClick={onClick}
      className="pointer-events-auto w-10 h-10 rounded-full bg-black/70 hover:bg-red-700 border border-white/10 flex items-center justify-center transition-colors"
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
  liked: boolean;
  likeCount: number;
  onOpen: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onPrev: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  onLike: (e: React.MouseEvent) => void;
}

function FeaturedImage({
  image,
  index,
  total,
  liked,
  likeCount,
  onOpen,
  onPrev,
  onNext,
  onLike,
}: FeaturedImageProps) {
  return (
    <div
      className="group relative aspect-[3/2] min-h-[320px] w-full overflow-hidden rounded-3xl bg-stone-800 cursor-pointer md:min-h-0 md:flex-1"
    >
      <button
        type="button"
        aria-label={`Abrir imagen: ${image.title}`}
        className="block h-full w-full cursor-pointer text-left"
        onClick={onOpen}
      >
        <img
          key={image.id}
          src={image.src}
          alt={image.title}
          width={image.width}
          height={image.height}
          style={{ objectPosition: image.objectPosition }}
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-2xl font-bold text-white">
            {image.title}
          </p>
          <p className="text-base font-bold uppercase tracking-widest text-red-400">
            {image.tag}
          </p>
          <p className="text-base text-white">
            {index + 1} / {total}
          </p>
        </div>
      </button>

      <LikeButton
        liked={liked}
        count={likeCount}
        onClick={onLike}
        size="md"
        className="absolute top-4 right-4 shadow"
      />

      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 pointer-events-none">
        <NavArrow direction="left" onClick={onPrev} />
        <NavArrow direction="right" onClick={onNext} />
      </div>
    </div>
  );
}

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
      className="group relative h-full w-full overflow-hidden rounded-lg bg-stone-800 cursor-pointer"
    >
      <img
        src={image.src}
        alt=""
        width={image.width}
        height={image.height}
        loading="lazy"
        style={{ objectPosition: image.objectPosition }}
        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
      />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function GallerySection() {
  const { index, prev, next, goTo } = useCarousel(GALLERY_IMAGES.length);
  const { toggle, isLiked, count } = useLikes();
  const [lightboxId, setLightboxId] = useState<number | null>(null);
  // Ref para restaurar foco al cerrar el Lightbox
  const lightboxTriggerRef = useRef<HTMLButtonElement | null>(null);

  const featured = GALLERY_IMAGES[index];
  const thumbs = Array.from(
    { length: THUMBS_COUNT },
    (_, k) => GALLERY_IMAGES[(index + 1 + k) % GALLERY_IMAGES.length],
  );
  const lightboxImage = GALLERY_IMAGES.find(
    (img) => img.id === lightboxId,
  );
  const lightboxIndex = lightboxImage
    ? GALLERY_IMAGES.findIndex((img) => img.id === lightboxImage.id)
    : -1;

  return (
    <main className="bg-stone-950 md:h-full">
      <div className="mx-auto flex min-h-0 flex-col h-full min-h-[530px]">
        <div className="flex min-h-0 flex-col gap-4 md:flex-1">
          <div
            className="flex min-h-0 flex-col gap-2 md:flex-1 min-h-[530px]"
          >
            <FeaturedImage
              image={featured}
              index={index}
              total={GALLERY_IMAGES.length}
              liked={isLiked(featured.id)}
              likeCount={count(featured.id, featured.likes)}
              onOpen={(e) => {
                lightboxTriggerRef.current = e.currentTarget;
                setLightboxId(featured.id);
              }}
              onPrev={(e) => {
                e.stopPropagation();
                prev();
              }}
              onNext={(e) => {
                e.stopPropagation();
                next();
              }}
              onLike={(e) => toggle(featured.id, e)}
            />

          {/* Thumbnails — tira horizontal en mobile */}
          <div className="grid grid-cols-6 gap-2 h-16 md:h-20">
            {thumbs.map((img, k) => (
              <Thumbnail
                key={img.id}
                image={img}
                onClick={() => goTo((index + 1 + k) % GALLERY_IMAGES.length)}
              />
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-4">
            {GALLERY_IMAGES.map((img, i) => (
              <button
                type="button"
                aria-label={`Ver imagen ${i + 1} de ${GALLERY_IMAGES.length}`}
                aria-current={i === index ? "true" : undefined}
                key={img.id}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === index
                    ? "bg-red-400 w-6 h-4"
                    : "bg-blue-500/70 hover:bg-blue-400/80 w-4 h-4"
                }`}
              />
            ))}
          </div>
          </div>
        </div>
      </div>

      {lightboxImage && (
        <Lightbox
          image={lightboxImage}
          liked={isLiked(lightboxImage.id)}
          likeCount={count(lightboxImage.id, lightboxImage.likes)}
          triggerRef={lightboxTriggerRef}
          onClose={() => setLightboxId(null)}
          onPrev={() => {
            const newIndex = (lightboxIndex - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length;
            setLightboxId(GALLERY_IMAGES[newIndex].id);
          }}
          onNext={() => {
            const newIndex = (lightboxIndex + 1) % GALLERY_IMAGES.length;
            setLightboxId(GALLERY_IMAGES[newIndex].id);
          }}
          onToggleLike={(e) => toggle(lightboxImage.id, e)}
        />
      )}
    </main>
  );
}

