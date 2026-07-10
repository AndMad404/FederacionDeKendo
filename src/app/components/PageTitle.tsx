import type { ReactNode } from "react";

export function PageTitle({
  id,
  children,
  className = "",
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      id={id}
      className={`rounded-lg border border-blue-500/70 bg-black/70 px-3 py-2 text-center text-xl font-bold uppercase tracking-wide text-white shadow-xl whitespace-nowrap ${className}`}
    >
      {children}
    </h1>
  );
}
