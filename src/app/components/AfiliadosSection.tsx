import { useState } from "react";
import { DOJOS } from "../data/dojos";
import { DojoList } from "./affiliates/DojoList";
import { MediaPageBanner } from "./ui/MediaPageBanner";
import { NavigationArrowButton } from "./ui/ModalControls";

const DOJOS_PER_PAGE = 2;

function AffiliatePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginación de dojos afiliados"
      className="mb-4 flex min-h-11 items-center justify-center gap-2 xl:absolute xl:right-6 xl:top-2 xl:z-20 xl:mb-0"
    >
      <NavigationArrowButton
        direction="previous"
        label="Página anterior de dojos"
        aria-controls="affiliate-dojo-list"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      />

      <p className="min-w-20 text-center text-sm font-bold text-site-text" aria-live="polite">
        {page + 1} de {totalPages}
      </p>

      <NavigationArrowButton
        direction="next"
        label="Página siguiente de dojos"
        aria-controls="affiliate-dojo-list"
        disabled={page === totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      />
    </nav>
  );
}

export function AfiliadosSection() {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(DOJOS.length / DOJOS_PER_PAGE));
  const startIndex = page * DOJOS_PER_PAGE;
  const visibleDojos = DOJOS.slice(startIndex, startIndex + DOJOS_PER_PAGE);

  return (
    <section
      aria-labelledby="affiliates-title"
      className="relative mt-2 flex flex-col overflow-hidden rounded-xl bg-site-canvas md:h-full md:overflow-y-auto xl:overflow-hidden tall-md:h-[calc(100%_-_0.5rem)] land-compact:overflow-y-auto"
    >
      <MediaPageBanner
        className="absolute inset-x-0 top-0 z-10 h-28 overflow-hidden land-compact:h-20"
        titleId="affiliates-title"
        title="Dojos afiliados"
        description="Encuentra una comunidad donde practicar kendo."
        image={{
          src: "/images/affiliates/kendo-affiliates.jpg",
          sources: [
            {
              srcSet:
                "/images/affiliates/kendo-affiliates-768.avif 768w, /images/affiliates/kendo-affiliates-1200.avif 1200w",
              sizes: "(min-width: 1024px) 1200px, 100vw",
              type: "image/avif",
            },
            {
              srcSet:
                "/images/affiliates/kendo-affiliates-768.webp 768w, /images/affiliates/kendo-affiliates-1200.webp 1200w",
              sizes: "(min-width: 1024px) 1200px, 100vw",
              type: "image/webp",
            },
          ],
          width: 1500,
          height: 1001,
          className: "object-[center_33%]",
        }}
      />
      <div className="relative flex min-h-[530px] flex-1 items-start justify-center overflow-hidden pt-20 md:overflow-visible xl:overflow-hidden land-compact:min-h-[calc(100dvh-4rem-10px)] land-compact:items-start land-compact:overflow-y-auto land-compact:py-14">
        <div className="relative z-20 w-full max-w-4xl px-4 sm:px-6 md:max-w-5xl lg:max-w-6xl xl:flex xl:h-full xl:items-start xl:px-0 land-compact:max-w-none land-compact:px-2">
          <AffiliatePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
          <DojoList dojos={visibleDojos} startIndex={startIndex} />
        </div>
      </div>
    </section>
  );
}
