import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";

interface SwipeNavigationOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
  allowInteractiveStart?: boolean;
  preventDefaultOnSwipe?: boolean;
}

interface SwipeStart {
  pointerId: number;
  x: number;
  y: number;
}

const defaultThreshold = 48;
const interactiveSelector = "button, a, input, select, textarea";

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = defaultThreshold,
  allowInteractiveStart = false,
  preventDefaultOnSwipe = false,
}: SwipeNavigationOptions) {
  const startRef = useRef<SwipeStart | null>(null);
  const didSwipeRef = useRef(false);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch" || !event.isPrimary) return;
    const target = event.target as HTMLElement;

    if (
      !allowInteractiveStart &&
      target !== event.currentTarget &&
      target.closest(interactiveSelector)
    ) {
      return;
    }

    startRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    didSwipeRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [allowInteractiveStart]);

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const start = startRef.current;
      if (!start || start.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;
      const isHorizontalSwipe =
        Math.abs(deltaX) >= threshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.25;

      if (isHorizontalSwipe) {
        if (preventDefaultOnSwipe) event.preventDefault();
        didSwipeRef.current = true;
        if (deltaX < 0) {
          onSwipeLeft();
        } else {
          onSwipeRight();
        }
      }

      startRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [
      onSwipeLeft,
      onSwipeRight,
      preventDefaultOnSwipe,
      threshold,
    ],
  );

  const onPointerCancel = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    startRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const consumeSwipe = useCallback(() => {
    if (!didSwipeRef.current) return false;

    didSwipeRef.current = false;
    return true;
  }, []);

  return {
    consumeSwipe,
    swipeHandlers: {
      onPointerDown,
      onPointerUp,
      onPointerCancel,
    },
  };
}
