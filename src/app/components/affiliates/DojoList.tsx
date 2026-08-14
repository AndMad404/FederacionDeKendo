import type { DojoData } from "../../types";
import { DojoCard } from "./DojoCard";

interface DojoListProps {
  dojos: DojoData[];
  startIndex: number;
  language: "es" | "en";
}

export function DojoList({ dojos, startIndex, language }: DojoListProps) {
  const desktopGridClass =
    dojos.length === 1 ? "xl:mx-auto xl:max-w-3xl" : "xl:grid-cols-2 xl:gap-8";

  return (
    <div
      id="affiliate-dojo-list"
      data-page-content-boundary
      className={`grid w-full grid-cols-1 gap-2.5 land-compact:grid-cols-2 land-compact:gap-3 xl:gap-8 ${desktopGridClass}`}
    >
      {dojos.map((dojo, index) => (
        <DojoCard
          key={dojo.title}
          headingId={`dojo-${startIndex + index + 1}-title`}
          language={language}
          {...dojo}
        />
      ))}
    </div>
  );
}
