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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-site-overlay/80 p-4 land-sm:p-2"
      onMouseDown={onBackdropInteraction}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={`relative w-full max-w-2xl ${focusRingClass}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <ModalCloseButton
          label={closeLabel}
          onClick={onClose}
        />
        <div className="max-h-[calc(100svh-2rem)] overflow-y-auto rounded-3xl border border-site-action/70 bg-site-canvas p-5 text-site-on-dark shadow-2xl shadow-site-overlay/60 sm:p-7 land-sm:max-h-[calc(100svh-1rem)] land-sm:p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
