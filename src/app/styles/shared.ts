// Shared Tailwind class groups reused across components.

export const focusRingClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-site-focus";

export const surfaceClass =
  "border border-site-border bg-site-surface shadow-sm";

export const panelSurfaceClass = `rounded-xl text-site-text ${surfaceClass}`;

export const mediaCaptionSurfaceClass =
  "bg-gradient-to-r from-site-navy via-site-navy/95 to-site-navy/75 text-site-on-dark";

export const galleryThumbnailActiveClass = "border-b-4 border-b-site-accent";

export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-site-action bg-site-action px-5 py-2 font-bold text-site-on-dark shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-site-surface hover:text-site-action hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100";

export const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-site-action bg-site-surface px-5 py-2 font-bold text-site-action transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-site-action hover:text-site-on-dark hover:shadow-sm active:translate-y-0 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100";

export const actionControlSurfaceClass =
  "border border-site-border bg-site-surface text-site-action";

export const navigationArrowButtonClass =
  "flex size-11 shrink-0 touch-manipulation cursor-pointer items-center justify-center rounded-full border border-site-border bg-site-surface text-site-action shadow-sm transition-[color,background-color,border-color,box-shadow,transform] duration-200 enabled:hover:-translate-y-0.5 enabled:hover:border-site-accent enabled:hover:bg-site-accent enabled:hover:text-site-on-dark enabled:hover:shadow-md enabled:active:translate-y-0 enabled:active:border-site-accent enabled:active:bg-site-accent enabled:active:text-site-on-dark data-[active=true]:border-site-accent data-[active=true]:bg-site-accent data-[active=true]:text-site-on-dark data-[active=true]:enabled:hover:border-site-accent data-[active=true]:enabled:hover:bg-site-accent data-[active=true]:enabled:hover:text-site-on-dark data-[active=true]:enabled:active:border-site-accent data-[active=true]:enabled:active:bg-site-accent data-[active=true]:enabled:active:text-site-on-dark active:scale-95 motion-reduce:transition-none motion-reduce:enabled:hover:translate-y-0 motion-reduce:active:transform-none disabled:cursor-not-allowed disabled:opacity-35 md:size-12";

export const modalCloseButtonClass =
  "absolute right-3 top-3 z-20 flex size-11 touch-manipulation cursor-pointer items-center justify-center rounded-full bg-site-accent-strong text-site-on-dark shadow-sm transition-[color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-site-accent-hover hover:shadow-md active:translate-y-0 active:scale-95 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:transform-none active:bg-site-accent-hover";
