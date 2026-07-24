import { useCallback, useEffect, useRef, useState } from "react";

export type NavigationDirection = "left" | "right";

const feedbackDurationMs = 220;

export function useTransientDirectionFeedback() {
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [activeDirection, setActiveDirection] =
    useState<NavigationDirection | null>(null);

  const showDirection = useCallback((direction: NavigationDirection) => {
    setActiveDirection(direction);

    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setActiveDirection(null);
      feedbackTimeoutRef.current = null;
    }, feedbackDurationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  return { activeDirection, showDirection };
}
