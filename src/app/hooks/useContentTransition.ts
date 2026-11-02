import { useEffect, useRef, type RefObject } from "react";

export type ContentTransition =
  "section" | "event" | "back" | "next" | "previous" | "fade";

// Animate existing content only: no delayed navigation, layout wrappers or retained styles.
export function animateContent(
  element: HTMLElement | null,
  kind: ContentTransition,
) {
  if (!element) return;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (preference.matches) return;
  const compact = window.matchMedia("(max-width: 767px)").matches;
  const distance = compact ? 8 : kind === "section" ? 12 : 16;
  const offset =
    kind === "section"
      ? `translateY(${distance}px)`
      : kind === "fade"
        ? "none"
        : `translateX(${kind === "back" || kind === "previous" ? -distance : distance}px)`;
  const animation = element.animate(
    [
      { opacity: 0, transform: offset },
      { opacity: 1, transform: "none" },
    ],
    {
      id: `content-${kind}`,
      duration:
        kind === "fade"
          ? 180
          : kind === "next" || kind === "previous"
            ? 220
            : 280,
      easing: "cubic-bezier(0.2, 0.75, 0.25, 1)",
    },
  );
  const cancelForPreference = () => {
    if (preference.matches) animation.cancel();
  };
  preference.addEventListener("change", cancelForPreference);
  const removeListener = () =>
    preference.removeEventListener("change", cancelForPreference);
  void animation.finished.then(removeListener, removeListener);
  return () => {
    removeListener();
    animation.cancel();
  };
}

export function useSequenceTransition(
  target: RefObject<HTMLElement>,
  position: number,
  scope: string,
) {
  const previous = useRef({ position, scope });
  useEffect(() => {
    const last = previous.current;
    previous.current = { position, scope };
    // Scope changes (filters/language/month) are handled by their parent transition.
    if (last.scope !== scope || last.position === position) return;
    return animateContent(
      target.current,
      position > last.position ? "next" : "previous",
    );
  }, [target, position, scope]);
}
