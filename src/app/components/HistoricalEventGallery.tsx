import { lazy, Suspense, useMemo } from "react";
import type { MouseEvent } from "react";
import { EVENT_GALLERIES } from "../data/eventGalleries";
import { useCarousel } from "../hooks/useCarousel";
import { useGalleryLightbox } from "../hooks/useGalleryLightbox";
import { focusRingClass } from "../styles/shared";
import type { GalleryImage } from "../types";
import { NavigationArrowButton } from "./ui/ModalControls";

const Lightbox = lazy(() =>
  import("./Lightbox").then((module) => ({ default: module.Lightbox })),
);

interface HistoricalEventGalleryProps {
  eventId: string;
  eventTitle: string;
}

export function HistoricalEventGallery({ eventId, eventTitle }: HistoricalEventGalleryProps) {
  const images = useMemo<GalleryImage[]>(() => {
    const gallery = EVENT_GALLERIES[eventId];
    return (gallery?.images ?? []).slice(0, 5).map((image) => ({
      id: image.order,
      src: image.src,
      srcSet: image.srcSet.webp,
      sizes: image.sizes,
      width: image.width,
      height: image.height,
      thumbnailSrc: image.src,
      thumbnailSrcSet: image.srcSet.webp,
      thumbnailWidth: image.width,
      thumbnailHeight: image.height,
      title: `Fotografía ${image.order}`,
      tag: eventTitle,
      alt: `Fotografía ${image.order} del evento ${eventTitle}`,
    }));
  }, [eventId, eventTitle]);
  const { index, prev, next, goTo } = useCarousel(images.length);
  const { closeLightbox, lightboxIndex, lightboxImage, openLightbox, showNext, showPrev, triggerRef } = useGalleryLightbox(images);

  if (!images.length) return null;
  const featured = images[index];
  const openFeatured = (event: MouseEvent<HTMLButtonElement>) => openLightbox(featured.id, event);

  return (
    <section aria-label={`Fotografías del evento ${eventTitle}`} className="mt-4 grid gap-2">
      <figure className="relative h-[clamp(11rem,28vw,12.5rem)] overflow-hidden rounded-xl bg-site-media">
        <picture>
          <source srcSet={EVENT_GALLERIES[eventId].images[index].srcSet.avif} sizes={featured.sizes} type="image/avif" />
          <img src={featured.src} srcSet={featured.srcSet} sizes={featured.sizes} alt={featured.alt} width={featured.width} height={featured.height} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </picture>
        <button type="button" aria-label={`Abrir ${featured.alt}`} onClick={openFeatured} className={`absolute inset-0 ${focusRingClass}`}>
          <span className="sr-only">Abrir fotografía</span>
        </button>
        {images.length > 1 ? <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2"><NavigationArrowButton direction="previous" label="Fotografía anterior" onClick={(event) => { event.stopPropagation(); prev(); }} className="pointer-events-auto" /><NavigationArrowButton direction="next" label="Fotografía siguiente" onClick={(event) => { event.stopPropagation(); next(); }} className="pointer-events-auto" /></div> : null}
      </figure>
      {images.length > 1 ? <div role="group" aria-label="Seleccionar fotografía" className="grid h-14 grid-flow-col auto-cols-[17%] gap-2 overflow-x-auto sm:h-16 md:h-20">
        {images.map((image, imageIndex) => <button key={image.id} type="button" aria-label={`Ver ${image.alt}`} aria-current={imageIndex === index ? "true" : undefined} onClick={() => goTo(imageIndex)} className={`overflow-hidden rounded-lg border-2 ${imageIndex === index ? "border-site-accent" : "border-transparent"} ${focusRingClass}`}><img src={image.thumbnailSrc} srcSet={image.thumbnailSrcSet} sizes="80px" alt="" width={image.thumbnailWidth} height={image.thumbnailHeight} loading="lazy" decoding="async" className="h-full w-full object-cover" /></button>)}
      </div> : null}
      {lightboxImage ? <Suspense fallback={null}><Lightbox image={lightboxImage} index={lightboxIndex} total={images.length} triggerRef={triggerRef} onClose={closeLightbox} onPrev={showPrev} onNext={showNext} /></Suspense> : null}
    </section>
  );
}
