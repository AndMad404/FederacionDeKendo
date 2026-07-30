// Shared Tailwind class groups reused across components.

export const focusRingClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-site-focus";

export const panelSurfaceClass =
  "rounded-xl border border-site-border bg-site-surface text-site-text shadow-sm";

export const mediaCaptionSurfaceClass =
  "bg-gradient-to-r from-site-navy via-site-navy/95 to-site-navy/75 text-site-on-dark";

export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-site-action px-5 py-2 font-bold text-site-on-dark shadow-sm transition-colors hover:bg-site-accent";

export const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-site-action bg-site-surface px-5 py-2 font-bold text-site-action transition-colors hover:bg-site-media";

export const actionControlSurfaceClass =
  "border border-site-border bg-site-surface text-site-action";

export const navigationArrowActiveClass =
  "!border-site-accent !bg-site-accent !text-site-on-dark";

export const navigationArrowButtonClass =
  "flex size-11 shrink-0 touch-manipulation cursor-pointer items-center justify-center rounded-full border border-site-border bg-site-surface text-site-action shadow-sm transition-[color,background-color,border-color,transform] enabled:hover:border-site-accent enabled:hover:bg-site-accent enabled:hover:text-site-on-dark enabled:active:border-site-accent enabled:active:bg-site-accent enabled:active:text-site-on-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 md:size-12";

export const modalCloseButtonClass =
  "absolute right-3 top-3 z-20 flex size-11 touch-manipulation cursor-pointer items-center justify-center rounded-full bg-site-accent-strong text-site-on-dark transition-[color,background-color,transform] hover:bg-site-accent-hover active:scale-95 active:bg-site-accent-hover";
