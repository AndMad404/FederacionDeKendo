import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

interface UseModalBehaviorOptions {
  initialFocusRef?: RefObject<HTMLElement | null>;
  triggerRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

export function useModalBehavior({
  initialFocusRef,
  triggerRef,
  onClose,
  onKeyDown,
}: UseModalBehaviorOptions) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const appRoot = document.querySelector<HTMLElement>("#root");
    if (!appRoot) return;

    const wasInert = appRoot.inert;
    appRoot.inert = true;

    return () => {
      appRoot.inert = wasInert;
    };
  }, []);

  useEffect(() => {
    (initialFocusRef?.current ?? dialogRef.current)?.focus();
  }, [initialFocusRef]);

  useEffect(() => {
    return () => {
      const trigger = triggerRef?.current;
      if (!trigger) return;

      requestAnimationFrame(() => {
        if (trigger.isConnected) trigger.focus();
      });
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

      if (event.key !== "Tab") {
        onKeyDown?.(event);
        return;
      }

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
  }, [onClose, onKeyDown]);

  const onBackdropInteraction = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (
        event.isPrimary &&
        event.button === 0 &&
        event.target === event.currentTarget
      ) {
        onClose();
      }
    },
    [onClose],
  );

  return { dialogRef, onBackdropInteraction };
}
