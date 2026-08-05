import type { ReactNode } from "react";

export function PageTitle({
  id,
  children,
  className = "",
  allowWrap = false,
  placement = "default",
  tone = "light",
  density = "default",
  decoration = "underline",
  casing = "uppercase",
}: {
  id: string;
  children: ReactNode;
  className?: string;
  allowWrap?: boolean;
  placement?: "default" | "floating";
  tone?: "light" | "media";
  density?: "default" | "flush";
  decoration?: "underline" | "none";
  casing?: "uppercase" | "normal";
}) {
  const whitespaceClass = allowWrap ? "whitespace-normal" : "whitespace-nowrap";
  const placementClass =
    placement === "floating"
      ? "pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2"
      : "relative";
  const toneClass =
    tone === "media"
      ? "text-site-on-dark drop-shadow-md"
      : "text-site-navy";
  const densityClass = density === "flush" ? "p-0" : "px-3 py-2";
  const decorationClass =
    decoration === "underline"
      ? "after:absolute after:-bottom-0.5 after:left-1/2 after:h-0.5 after:w-full after:-translate-x-1/2 after:bg-site-accent"
      : "";
  const casingClass = casing === "uppercase" ? "uppercase" : "normal-case";

  return (
    <h1
      id={id}
      className={`w-fit text-center text-xl font-bold leading-tight tracking-wide ${toneClass} ${densityClass} ${decorationClass} ${casingClass} ${whitespaceClass} ${placementClass} ${className}`}
    >
      {children}
    </h1>
  );
}
