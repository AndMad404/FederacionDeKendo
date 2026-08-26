import { forwardRef, type ButtonHTMLAttributes } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  focusRingClass,
  modalCloseButtonClass,
  navigationArrowButtonClass,
} from "../../styles/shared";

interface ModalCloseButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type"
> {
  label: string;
}

export const ModalCloseButton = forwardRef<
  HTMLButtonElement,
  ModalCloseButtonProps
>(function ModalCloseButton({ label, className = "", ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={`${modalCloseButtonClass} ${focusRingClass} ${className}`}
      {...props}
    >
      <X className="size-5" aria-hidden="true" />
    </button>
  );
});

interface NavigationArrowButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type"
> {
  direction: "previous" | "next" | "down";
  label: string;
  isActive?: boolean;
}

export const NavigationArrowButton = forwardRef<
  HTMLButtonElement,
  NavigationArrowButtonProps
>(function NavigationArrowButton(
  { direction, label, isActive = false, className = "", ...props },
  ref,
) {
  const Icon =
    direction === "previous"
      ? ChevronLeft
      : direction === "next"
        ? ChevronRight
        : ChevronDown;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      data-active={isActive}
      className={`${navigationArrowButtonClass} ${focusRingClass} ${className}`}
      {...props}
    >
      <Icon
        className={`size-5 transition-transform motion-reduce:transition-none md:size-6 ${
          direction === "down" && isActive ? "rotate-180" : ""
        }`}
        aria-hidden="true"
      />
    </button>
  );
});
