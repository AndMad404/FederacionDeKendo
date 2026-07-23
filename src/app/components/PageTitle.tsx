import type { ReactNode } from "react";
import { panelSurfaceClass } from "../styles/shared";

export function PageTitle({
  id,
  children,
  className = "",
  allowWrap = false,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  allowWrap?: boolean;
}) {
  const whitespaceClass = allowWrap ? "whitespace-normal" : "whitespace-nowrap";

  return (
    <h1
      id={id}
      className={`rounded-lg px-3 py-2 text-center text-xl font-bold uppercase leading-tight tracking-wide text-site-on-dark ${panelSurfaceClass} ${whitespaceClass} ${className}`}
    >
      {children}
    </h1>
  );
}
