import { X, Heart } from "lucide-react";
import type { GalleryImage } from "../types";

interface LightboxProps {
  image: GalleryImage;
  liked: boolean;
  likeCount: number;
  onClose: () => void;
  onToggleLike: (e: React.MouseEvent) => void;
}

export function Lightbox({ image, liked, likeCount, onClose, onToggleLike }: LightboxProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors"
        onClick={onClose}
      >
        <X size={28} />
      </button>

      <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={image.src}
          alt={image.title}
          className="w-full max-h-[75vh] object-contain rounded-xl"
        />
        <div className="flex items-center justify-between mt-4 text-white">
          <div>
            <p className="text-xs text-red-400 uppercase tracking-widest">{image.tag}</p>
            <p className="font-semibold mt-0.5">{image.title}</p>
          </div>
          <button onClick={onToggleLike} className="flex items-center gap-2 text-sm">
            <Heart size={18} className={liked ? "fill-red-500 text-red-500" : "text-gray-400"} />
            <span>{likeCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
