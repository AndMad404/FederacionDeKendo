import { useState, useCallback } from "react";

export function useLikes() {
  const [liked, setLiked] = useState<Set<number>>(new Set());

  const toggle = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const isLiked = useCallback((id: number) => liked.has(id), [liked]);
  const count = useCallback((id: number, base: number) => liked.has(id) ? base + 1 : base, [liked]);

  return { toggle, isLiked, count };
}
