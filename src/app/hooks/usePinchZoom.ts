import {
  useCallback,
  useEffect,
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
  const [scale, setScale] = useState(MIN_SCALE);
  const [transformOrigin, setTransformOrigin] = useState("50% 50%");

  const resetZoom = useCallback(() => {
    pointersRef.current.clear();
    pinchStartRef.current = null;
    scaleRef.current = MIN_SCALE;
    didPinchRef.current = false;
    setScale(MIN_SCALE);
    setTransformOrigin("50% 50%");
  }, []);

  useEffect(() => {
    resetZoom();
  }, [resetKey, resetZoom]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
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
    const imageFrame = target.closest("[data-lightbox-image]")?.getBoundingClientRect();

    if (imageFrame) {
      const midpointX = (points[0].x + points[1].x) / 2;
      const midpointY = (points[0].y + points[1].y) / 2;
      const originX = ((midpointX - imageFrame.left) / imageFrame.width) * 100;
      const originY = ((midpointY - imageFrame.top) / imageFrame.height) * 100;
      setTransformOrigin(`${originX}% ${originY}%`);
    }

    pinchStartRef.current = {
      distance: getDistance(points),
      scale: scaleRef.current,
    };
    didPinchRef.current = true;
    event.preventDefault();
    return true;
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
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
      Math.max(MIN_SCALE, pinchStart.scale * (distance / pinchStart.distance)),
    );

    scaleRef.current = nextScale;
    setScale(nextScale);
    event.preventDefault();
    return true;
  }, []);

  const finishPointer = useCallback((pointerId: number) => {
    const didPinch = didPinchRef.current;
    pointersRef.current.delete(pointerId);
    pinchStartRef.current = null;

    if (pointersRef.current.size === 0) {
      didPinchRef.current = false;
    }

    return didPinch;
  }, []);

  return {
    scale,
    transformOrigin,
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
