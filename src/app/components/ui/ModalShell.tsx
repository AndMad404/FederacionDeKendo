import type { ReactNode, RefObject } from "react";
import { useModalBehavior } from "../../hooks/useModalBehavior";
import { focusRingClass } from "../../styles/shared";
import { ModalCloseButton } from "./ModalControls";

interface ModalShellProps {
  children: ReactNode;
  titleId: string;
  descriptionId?: string;
  closeLabel: string;
  triggerRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

export function ModalShell({
  children,
  titleId,
  descriptionId,
  closeLabel,
  triggerRef,
  onClose,
  onKeyDown,
}: ModalShellProps) {
  const { dialogRef, onBackdropInteraction } = useModalBehavior({
    triggerRef,
    onClose,
    onKeyDown,
  });

  return (
    <div
      className="fixed inset-0 z-[70] flex touch-manipulation items-center justify-center bg-site-navy/85 p-4 land-sm:p-2"
      onPointerDown={onBackdropInteraction}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={`relative w-full max-w-2xl ${focusRingClass}`}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <ModalCloseButton
          label={closeLabel}
          onClick={onClose}
        />
        <div className="h-[min(25.5rem,calc(100svh-2rem))] touch-pan-y overflow-y-auto overscroll-y-contain rounded-xl border border-site-border bg-site-surface p-5 text-site-text shadow-2xl shadow-site-navy/40 sm:h-[min(27.5rem,calc(100svh-2rem))] sm:p-7 land-sm:h-auto land-sm:max-h-[calc(100svh-1rem)] land-sm:p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
