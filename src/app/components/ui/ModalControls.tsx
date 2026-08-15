import { forwardRef, type ButtonHTMLAttributes } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  focusRingClass,
  modalCloseButtonClass,
  navigationArrowActiveClass,
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
  direction: "previous" | "next";
  label: string;
  isActive?: boolean;
}

export function NavigationArrowButton({
  direction,
  label,
  isActive = false,
  className = "",
  ...props
}: NavigationArrowButtonProps) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={label}
      className={`${navigationArrowButtonClass} ${
        isActive ? navigationArrowActiveClass : ""
      } ${focusRingClass} ${className}`}
      {...props}
    >
      <Icon className="size-5 md:size-6" aria-hidden="true" />
    </button>
  );
}
