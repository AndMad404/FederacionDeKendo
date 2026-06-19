import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCarousel } from "../hooks/useCarousel";
import { useLikes } from "../hooks/useLikes";
import { LikeButton } from "./LikeButton";
import { Lightbox } from "./Lightbox";
import type { GalleryImage } from "../types";

const IMAGES: GalleryImage[] = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1763905720991-0ce68f551743?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxrZW5kbyUyMG1hcnRpYWwlMjBhcnRzJTIwamFwYW5lc2UlMjBzd29yZHxlbnwxfHx8fDE3ODAxMDAzODB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Práctica en el Dojo",
    tag: "Entrenamiento",
    likes: 214,
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1765666738346-28ce4c332831?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxrZW5kbyUyMG1hcnRpYWwlMjBhcnRzJTIwamFwYW5lc2UlMjBzd29yZHxlbnwxfHx8fDE3ODAxMDAzODB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Armadura Bogu",
    tag: "Equipamiento",
    likes: 189,
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1713766056305-d33bb4d71e1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxrZW5kbyUyMG1hcnRpYWwlMjBhcnRzJTIwamFwYW5lc2UlMjBzd29yZHxlbnwxfHx8fDE3ODAxMDAzODB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "El Camino del Agua",
    tag: "Filosofía",
    likes: 342,
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1583684977172-528983104c31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxrZW5kbyUyMG1hcnRpYWwlMjBhcnRzJTIwamFwYW5lc2UlMjBzd29yZHxlbnwxfHx8fDE3ODAxMDAzODB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Cinturón y Disciplina",
    tag: "Grado",
    likes: 97,
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1731530283978-337f43a44ea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw4fHxrZW5kbyUyMG1hcnRpYWwlMjBhcnRzJTIwamFwYW5lc2UlMjBzd29yZHxlbnwxfHx8fDE3ODAxMDAzODB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Vestimenta Tradicional",
    tag: "Keikogi",
    likes: 156,
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1514050566906-8d077bae7046?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxqYXBhbmVzZSUyMGRvam8lMjB0cmFpbmluZyUyMG1hcnRpYWwlMjBhcnRzfGVufDF8fHx8MTc4MDEwMDM4MXww&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Kata y Forma",
    tag: "Técnica",
    likes: 278,
  },
  {
    id: 7,
    src: "https://images.unsplash.com/photo-1708409858781-30df7a234f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrZW5kbyUyMG1hcnRpYWwlMjBhcnRzJTIwamFwYW5lc2UlMjBzd29yZHxlbnwxfHx8fDE3ODAxMDAzODB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "El Shinai",
    tag: "Equipamiento",
    likes: 133,
  },
  {
    id: 8,
    src: "https://images.unsplash.com/photo-1529630218527-7df22fc2d4ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxqYXBhbmVzZSUyMGRvam8lMjB0cmFpbmluZyUyMG1hcnRpYWwlMjBhcnRzfGVufDF8fHx8MTc4MDEwMDM4MXww&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Shiai — Combate",
    tag: "Competición",
    likes: 401,
  },
];

const THUMBS_COUNT = 6;

// ── Sub-components ────────────────────────────────────────────────────────────

interface NavArrowProps {
  direction: "left" | "right";
  onClick: (e: React.MouseEvent) => void;
}

function NavArrow({ direction, onClick }: NavArrowProps) {
  return (
    <button
      onClick={onClick}
      className="pointer-events-auto w-10 h-10 rounded-full bg-black/50 hover:bg-red-700 border border-white/10 flex items-center justify-center transition-colors"
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
  onOpen: () => void;
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
      className="group relative overflow-hidden rounded-2xl bg-stone-800 flex-1 cursor-pointer min-h-[220px] md:min-h-0"
      onClick={onOpen}
    >
      <img
        key={image.id}
        src={image.src}
        alt={image.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      <LikeButton
        liked={liked}
        count={likeCount}
        onClick={onLike}
        size="md"
        className="absolute top-4 right-4 shadow"
      />

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <span className="text-xs text-red-400 uppercase tracking-widest">
          {image.tag}
        </span>
        <p
          className="text-white mt-1 mb-1"
          style={{ fontSize: "1.3rem", fontWeight: 700 }}
        >
          {image.title}
        </p>
        <p className="text-gray-400 text-xs">
          {index + 1} / {total}
        </p>
      </div>

      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 pointer-events-none">
        <NavArrow direction="left" onClick={onPrev} />
        <NavArrow direction="right" onClick={onNext} />
      </div>
    </div>
  );
}

interface ThumbnailProps {
  image: GalleryImage;
  liked: boolean;
  likeCount: number;
  onClick: () => void;
  onLike: (e: React.MouseEvent) => void;
}

function Thumbnail({
  image,
  liked,
  likeCount,
  onClick,
  onLike,
}: ThumbnailProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-stone-800 cursor-pointer"
      onClick={onClick}
    >
      <img
        src={image.src}
        alt={image.title}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex flex-col justify-end p-2">
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function GallerySection() {
  const { index, prev, next, goTo } = useCarousel(
    IMAGES.length,
  );
  const { toggle, isLiked, count } = useLikes();
  const [lightboxId, setLightboxId] = useState<number | null>(
    null,
  );

  const featured = IMAGES[index];
  const thumbs = Array.from(
    { length: THUMBS_COUNT },
    (_, k) => IMAGES[(index + 1 + k) % IMAGES.length],
  );
  const lightboxImage = IMAGES.find(
    (img) => img.id === lightboxId,
  );

  return (
    <main className="pt-16 bg-stone-950">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-4">
          <div
            className="flex flex-col md:flex-row gap-4"
            style={{ height: "clamp(380px, 72vh, 580px)" }}
          >
            <FeaturedImage
              image={featured}
              index={index}
              total={IMAGES.length}
              liked={isLiked(featured.id)}
              likeCount={count(featured.id, featured.likes)}
              onOpen={() => setLightboxId(featured.id)}
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
          </div>

          <div className="grid grid-cols-6 gap-2 md:w-64 lg:w-72 flex-shrink-0 mx-auto justify-items-center">
            {thumbs.map((img, k) => (
              <Thumbnail
                key={img.id}
                image={img}
                liked={isLiked(img.id)}
                likeCount={count(img.id, img.likes)}
                onClick={() =>
                  goTo((index + 1 + k) % IMAGES.length)
                }
                onLike={(e) => toggle(img.id, e)}
              />
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 pt-1">
            {IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === index
                    ? "bg-red-600 w-5 h-2"
                    : "bg-stone-600 hover:bg-stone-400 w-2 h-2"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {lightboxImage && (
        <Lightbox
          image={lightboxImage}
          liked={isLiked(lightboxImage.id)}
          likeCount={count(
            lightboxImage.id,
            lightboxImage.likes,
          )}
          onClose={() => setLightboxId(null)}
          onToggleLike={(e) => toggle(lightboxImage.id, e)}
        />
      )}
    </main>
  );
}