import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

interface Point {
  x: number;
  y: number;
}

interface PinchStart {
  distance: number;
  scale: number;
}

interface ZoomState {
  resetKey: number;
  scale: number;
  transformOrigin: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 3;

function getDistance([first, second]: Point[]) {
  return Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
}

export function usePinchZoom(resetKey: number) {
  const pointersRef = useRef(new Map<number, Point>());
  const pinchStartRef = useRef<PinchStart | null>(null);
  const scaleRef = useRef(MIN_SCALE);
  const didPinchRef = useRef(false);
  const resetKeyRef = useRef(resetKey);
  const [zoom, setZoom] = useState<ZoomState>({
    resetKey,
    scale: MIN_SCALE,
    transformOrigin: "50% 50%",
  });

  const ensureCurrentResetKey = useCallback(() => {
    if (resetKeyRef.current === resetKey) return;

    resetKeyRef.current = resetKey;
    pointersRef.current.clear();
    pinchStartRef.current = null;
    scaleRef.current = MIN_SCALE;
    didPinchRef.current = false;
  }, [resetKey]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      ensureCurrentResetKey();
      if (event.pointerType !== "touch") return false;

      const target = event.target as HTMLElement;
      const startedOnImage = Boolean(target.closest("[data-lightbox-image]"));
      if (!startedOnImage) return false;

      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      if (pointersRef.current.size !== 2) return false;

      const points = [...pointersRef.current.values()];
      const imageFrame = target
        .closest("[data-lightbox-image]")
        ?.getBoundingClientRect();

      if (imageFrame) {
        const midpointX = (points[0].x + points[1].x) / 2;
        const midpointY = (points[0].y + points[1].y) / 2;
        const originX =
          ((midpointX - imageFrame.left) / imageFrame.width) * 100;
        const originY =
          ((midpointY - imageFrame.top) / imageFrame.height) * 100;
        setZoom((current) => ({
          resetKey,
          scale: current.resetKey === resetKey ? current.scale : MIN_SCALE,
          transformOrigin: `${originX}% ${originY}%`,
        }));
      }

      pinchStartRef.current = {
        distance: getDistance(points),
        scale: scaleRef.current,
      };
      didPinchRef.current = true;
      event.preventDefault();
      return true;
    },
    [ensureCurrentResetKey, resetKey],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      ensureCurrentResetKey();
      if (!pointersRef.current.has(event.pointerId)) return false;

      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      const pinchStart = pinchStartRef.current;
      if (!pinchStart || pointersRef.current.size !== 2) return false;

      const distance = getDistance([...pointersRef.current.values()]);
      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(
          MIN_SCALE,
          pinchStart.scale * (distance / pinchStart.distance),
        ),
      );

      scaleRef.current = nextScale;
      setZoom((current) => ({
        resetKey,
        scale: nextScale,
        transformOrigin:
          current.resetKey === resetKey ? current.transformOrigin : "50% 50%",
      }));
      event.preventDefault();
      return true;
    },
    [ensureCurrentResetKey, resetKey],
  );

  const finishPointer = useCallback(
    (pointerId: number) => {
      ensureCurrentResetKey();
      const didPinch = didPinchRef.current;
      pointersRef.current.delete(pointerId);
      pinchStartRef.current = null;

      if (pointersRef.current.size === 0) {
        didPinchRef.current = false;
      }

      return didPinch;
    },
    [ensureCurrentResetKey],
  );

  const currentZoom =
    zoom.resetKey === resetKey
      ? zoom
      : { resetKey, scale: MIN_SCALE, transformOrigin: "50% 50%" };

  return {
    scale: currentZoom.scale,
    transformOrigin: currentZoom.transformOrigin,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) =>
        finishPointer(event.pointerId),
      onPointerCancel: (event: ReactPointerEvent<HTMLElement>) =>
        finishPointer(event.pointerId),
    },
  };
}
