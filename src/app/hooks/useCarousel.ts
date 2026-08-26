import { useState, useCallback } from "react";

export function useCarousel(length: number, initialIndex = 0) {
  const [index, setIndex] = useState(() =>
    Math.max(0, Math.min(initialIndex, length - 1)),
  );

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + length) % length),
    [length],
  );
  const next = useCallback(() => setIndex((i) => (i + 1) % length), [length]);
  const goTo = useCallback(
    (i: number) => setIndex(Math.max(0, Math.min(i, length - 1))),
    [length],
  );

  return { index, prev, next, goTo };
}
