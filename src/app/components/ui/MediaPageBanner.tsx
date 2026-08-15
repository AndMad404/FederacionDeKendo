import type { ReactNode } from "react";
import { PageTitle } from "../PageTitle";

interface MediaPageBannerSource {
  srcSet: string;
  sizes: string;
  type: string;
}

interface MediaPageBannerImage {
  src: string;
  sources: MediaPageBannerSource[];
  width: number;
  height: number;
  className?: string;
}

interface MediaPageBannerProps {
  className: string;
  titleId: string;
  title: ReactNode;
  allowTitleWrap?: boolean;
  adaptiveHeight?: boolean;
  description: ReactNode;
  image: MediaPageBannerImage;
}

export function MediaPageBanner({
  className,
  titleId,
  title,
  allowTitleWrap = false,
  adaptiveHeight = false,
  description,
  image,
}: MediaPageBannerProps) {
  return (
    <header className={className}>
      <picture className="absolute inset-0" aria-hidden="true">
        {image.sources.map((source) => (
          <source
            key={`${source.type}-${source.srcSet}`}
            srcSet={source.srcSet}
            sizes={source.sizes}
            type={source.type}
          />
        ))}
        <img
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          loading="eager"
          decoding="async"
          fetchpriority="high"
          className={`h-full w-full object-cover ${image.className ?? ""}`}
        />
      </picture>
      <div
        className="absolute inset-0 bg-gradient-to-r from-site-navy/85 via-site-navy/70 to-site-navy/50"
        aria-hidden="true"
      />
      <div
        className={`relative z-10 flex flex-col items-center justify-start px-4 pt-4 text-center text-site-on-dark ${
          adaptiveHeight ? "min-h-28 pb-8 land-compact:min-h-20" : "h-full"
        }`}
      >
        <PageTitle
          id={titleId}
          className={
            allowTitleWrap ? "max-w-full break-words line-clamp-2" : ""
          }
          allowWrap={allowTitleWrap}
          tone="media"
          density="flush"
        >
          {title}
        </PageTitle>
        <p className="mt-1 text-sm text-site-subtle land-compact:hidden">
          {description}
        </p>
      </div>
    </header>
  );
}
