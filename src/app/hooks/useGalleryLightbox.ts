import { useCallback, useRef, useState, type MouseEvent } from "react";
import type { GalleryImage } from "../types";

export function useGalleryLightbox(images: GalleryImage[]) {
  const [lightboxId, setLightboxId] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const lightboxIndex =
    lightboxId === null
      ? -1
      : images.findIndex((image) => image.id === lightboxId);
  const lightboxImage =
    lightboxIndex >= 0 ? images[lightboxIndex] : null;

  const openLightbox = useCallback(
    (imageId: number, event: MouseEvent<HTMLButtonElement>) => {
      triggerRef.current = event.currentTarget;
      setLightboxId(imageId);
    },
    [],
  );

  const closeLightbox = useCallback(() => {
    setLightboxId(null);
  }, []);

  const showByOffset = useCallback(
    (offset: number) => {
      if (images.length === 0) return;

      setLightboxId((currentId) => {
        const currentIndex =
          currentId === null
            ? 0
            : images.findIndex((image) => image.id === currentId);
        const safeIndex = currentIndex >= 0 ? currentIndex : 0;
        const nextIndex = (safeIndex + offset + images.length) % images.length;

        return images[nextIndex].id;
      });
    },
    [images],
  );

  const showPrev = useCallback(() => {
    showByOffset(-1);
  }, [showByOffset]);

  const showNext = useCallback(() => {
    showByOffset(1);
  }, [showByOffset]);

  return {
    closeLightbox,
    lightboxIndex,
    lightboxImage,
    openLightbox,
    showNext,
    showPrev,
    triggerRef,
  };
}
