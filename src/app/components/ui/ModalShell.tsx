import {
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { X } from "lucide-react";
import { focusRingClass } from "../../styles/shared";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

interface ModalShellProps {
  children: ReactNode;
  titleId: string;
  descriptionId?: string;
  closeLabel: string;
  triggerRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
}

export function ModalShell({
  children,
  titleId,
  descriptionId,
  closeLabel,
  triggerRef,
  onClose,
}: ModalShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      triggerRef?.current?.focus();
    };
  }, [triggerRef]);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const dialogElement = dialog;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        dialogElement.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hidden);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogElement.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (
        event.shiftKey &&
        (activeElement === first || activeElement === dialogElement)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (activeElement === last || activeElement === dialogElement)
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-site-overlay/80 p-4 land-sm:p-2"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={`relative max-h-[calc(100svh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-site-canvas p-5 text-site-on-dark shadow-2xl shadow-site-overlay/60 sm:p-7 land-sm:max-h-[calc(100svh-1rem)] land-sm:p-4 ${focusRingClass}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className={`absolute right-3 top-3 flex size-11 items-center justify-center rounded-full bg-site-accent-strong text-site-on-dark transition-colors hover:bg-site-accent-hover ${focusRingClass}`}
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}
