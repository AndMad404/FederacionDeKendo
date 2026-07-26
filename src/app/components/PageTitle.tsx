import type { ReactNode } from "react";

export function PageTitle({
  id,
  children,
  className = "",
  allowWrap = false,
  placement = "default",
  tone = "light",
}: {
  id: string;
  children: ReactNode;
  className?: string;
  allowWrap?: boolean;
  placement?: "default" | "floating";
  tone?: "light" | "media";
}) {
  const whitespaceClass = allowWrap ? "whitespace-normal" : "whitespace-nowrap";
  const placementClass =
    placement === "floating"
      ? "pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2"
      : "relative";
  const toneClass =
    tone === "media"
      ? "text-site-on-dark drop-shadow-md after:bg-site-accent"
      : "text-site-navy after:bg-site-accent";

  return (
    <h1
      id={id}
      className={`w-fit px-3 py-2 text-center text-xl font-bold uppercase leading-tight tracking-wide after:absolute after:-bottom-px after:left-1/2 after:h-0.5 after:w-full after:-translate-x-1/2 ${toneClass} ${whitespaceClass} ${placementClass} ${className}`}
    >
      {children}
    </h1>
  );
}
