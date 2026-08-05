import { useState } from "react";
import { getDojos } from "../data/dojos";
import { useLanguage } from "../config/i18n";
import { DojoList } from "./affiliates/DojoList";
import { MediaPageBanner } from "./ui/MediaPageBanner";
import { NavigationArrowButton } from "./ui/ModalControls";

const DOJOS_PER_PAGE = 2;

function AffiliatePagination({
  page,
  totalPages,
  onPageChange,
  copy,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  copy: ReturnType<typeof useLanguage>["copy"];
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={copy.affiliates.pagination}
      className="mb-4 flex min-h-11 items-center justify-center gap-2 xl:absolute xl:right-6 xl:top-2 xl:z-20 xl:mb-0"
    >
      <NavigationArrowButton
        direction="previous"
        label={copy.affiliates.previousPage}
        aria-controls="affiliate-dojo-list"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      />

      <p className="min-w-20 text-center text-sm font-bold" aria-live="polite">
        {page + 1} {copy.affiliates.of} {totalPages}
      </p>

      <NavigationArrowButton
        direction="next"
        label={copy.affiliates.nextPage}
        aria-controls="affiliate-dojo-list"
        disabled={page === totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      />
    </nav>
  );
}

export function AfiliadosSection() {
  const { language, copy } = useLanguage();
  const dojos = getDojos(language);
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(dojos.length / DOJOS_PER_PAGE));
  const startIndex = page * DOJOS_PER_PAGE;
  const visibleDojos = dojos.slice(startIndex, startIndex + DOJOS_PER_PAGE);

  return (
    <section
      aria-labelledby="affiliates-title"
      className="relative my-2 flex w-full flex-col overflow-hidden rounded-xl bg-site-canvas tall-md:h-[calc(100%_-_1rem)] tall-md:min-h-0"
    >
      <MediaPageBanner
        className="relative z-10 h-28 shrink-0 overflow-hidden land-compact:h-20"
        titleId="affiliates-title"
        title={copy.affiliates.title}
        description={copy.affiliates.description}
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
      <div className="relative z-20 -mt-11 flex min-h-0 flex-1 items-start justify-center px-3 pb-0 pt-3 sm:-mt-13 sm:px-4 sm:pb-0 sm:pt-4 tall-md:p-4 xl:absolute xl:inset-0 xl:mt-0 xl:items-start xl:px-4 xl:pb-4 xl:pt-20 tall-md:xl:pt-20 land-sm:px-2 land-sm:pb-0 land-sm:pt-2 land-compact:-mt-8">
        <div className="relative w-full md:max-w-6xl xl:flex xl:h-full xl:items-start">
          <AffiliatePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            copy={copy}
          />
          <DojoList dojos={visibleDojos} startIndex={startIndex} language={language} />
        </div>
      </div>
    </section>
  );
}
