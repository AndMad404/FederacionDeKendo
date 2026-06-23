import { Heart } from "lucide-react";

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onClick: (e: React.MouseEvent) => void;
  size?: "sm" | "md";
  className?: string;
}

export function LikeButton({ liked, count, onClick, size = "sm", className = "" }: LikeButtonProps) {
  const iconSize = size === "sm" ? 12 : 18;
  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "Quitar me gusta" : "Dar me gusta"}
      onClick={onClick}
      className={`flex items-center gap-1.5 bg-white/90 rounded-full text-xs ${
        size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5"
      } ${className}`}
    >
      <Heart
        size={iconSize}
        className={liked ? "fill-red-500 text-red-400" : "text-gray-600"}
      />
      <span className="text-gray-700">{count}</span>
    </button>
  );
}
