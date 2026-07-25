// Shared Tailwind class groups reused across components.

export const focusRingClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-site-focus";

export const panelSurfaceClass =
  "border border-site-action/70 bg-site-overlay/70";

export const actionControlSurfaceClass =
  "border border-site-action-soft/70 bg-site-overlay/70 text-site-action-text";

export const modalNavigationButtonClass =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-site-action-soft bg-site-overlay/70 shadow-xl shadow-site-overlay/40 transition-[color,background-color,border-color,transform] hover:bg-site-action-hover/90 active:scale-95 active:bg-site-action-hover/90 md:size-12";

export const modalCloseButtonClass =
  "absolute right-3 top-3 z-20 flex size-11 cursor-pointer items-center justify-center rounded-full bg-site-accent-strong text-site-on-dark transition-[color,background-color,transform] hover:bg-site-accent-hover active:scale-95 active:bg-site-accent-hover";
