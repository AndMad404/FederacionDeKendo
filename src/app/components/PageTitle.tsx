import type { ReactNode } from "react";
import { panelSurfaceClass } from "../styles/shared";

export function PageTitle({
  id,
  children,
  className = "",
  allowWrap = false,
  placement = "default",
}: {
  id: string;
  children: ReactNode;
  className?: string;
  allowWrap?: boolean;
  placement?: "default" | "floating";
}) {
  const whitespaceClass = allowWrap ? "whitespace-normal" : "whitespace-nowrap";
  const placementClass =
    placement === "floating"
      ? "pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 land-compact:top-2"
      : "";

  return (
    <h1
      id={id}
      className={`rounded-lg px-3 py-2 text-center text-xl font-bold uppercase leading-tight tracking-wide text-site-on-dark ${panelSurfaceClass} ${whitespaceClass} ${placementClass} ${className}`}
    >
      {children}
    </h1>
  );
}
