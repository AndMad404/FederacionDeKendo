// Shared Tailwind class groups reused across components.

export const focusRingClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-site-focus";

export const surfaceClass =
  "border border-site-border bg-site-surface shadow-sm";

export const panelSurfaceClass = `rounded-xl text-site-text ${surfaceClass}`;

export const mediaCaptionSurfaceClass =
  "bg-gradient-to-r from-site-navy via-site-navy/95 to-site-navy/75 text-site-on-dark";

export const galleryThumbnailActiveClass = "border-b-4 border-b-site-accent";

// One interaction policy for text actions and icon-only controls.
export const buttonInteractionClass =
  "control-motion touch-manipulation transition-[color,background-color,border-color,box-shadow,scale,translate] duration-200 ease-out motion-reduce:transition-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-35 disabled:transition-none disabled:duration-0 aria-disabled:pointer-events-none aria-disabled:opacity-35 aria-disabled:transition-none aria-disabled:duration-0";

export const textButtonInteractionClass = `control-text ${buttonInteractionClass} active:scale-[0.98] motion-reduce:active:scale-100 disabled:scale-100 aria-disabled:scale-100`;

export const iconButtonInteractionClass = `control-icon ${buttonInteractionClass} active:scale-95 motion-reduce:active:scale-100 disabled:scale-100 aria-disabled:scale-100`;

export const primaryButtonClass = `control-primary inline-flex min-h-11 items-center justify-center rounded-full border border-site-action bg-site-action px-5 py-2 font-bold text-site-on-dark shadow-sm hover:bg-site-surface hover:text-site-action hover:[&_svg]:text-site-action ${textButtonInteractionClass}`;

export const secondaryButtonClass = `control-secondary inline-flex min-h-11 items-center justify-center rounded-full border border-site-action bg-site-surface px-5 py-2 font-bold text-site-action hover:bg-site-action hover:text-site-on-dark hover:[&_svg]:text-site-on-dark ${textButtonInteractionClass}`;

export const actionControlSurfaceClass =
  "border border-site-action bg-site-surface text-site-action";

export const navigationArrowButtonClass = `group control-sequence flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-site-action bg-site-action text-site-on-dark shadow-sm enabled:hover:bg-site-surface enabled:hover:text-site-action data-[active=true]:bg-site-surface data-[active=true]:text-site-action data-[active=true]:enabled:hover:bg-site-surface data-[active=true]:enabled:hover:text-site-action md:size-12 ${iconButtonInteractionClass}`;

export const modalCloseButtonClass = `control-dismiss absolute right-3 top-3 z-20 flex size-11 items-center justify-center rounded-full bg-site-accent-strong text-site-on-dark shadow-sm hover:bg-site-accent-hover ${iconButtonInteractionClass}`;
