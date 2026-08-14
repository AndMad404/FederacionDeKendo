import { useCallback, useEffect, useRef, useState } from "react";
import type { Language } from "../config/i18n";
import type { CalendarEvent } from "../types";
import { getEventPath } from "../utils/eventRoutes";

const shareFeedbackDurationMs = 2200;

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.className = "fixed -left-[9999px] top-0 opacity-0";
  document.body.append(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();

  if (!copied) throw new Error("The event URL could not be copied.");
}

export function useCalendarEventSharing(language: Language) {
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const shareEvent = useCallback(
    async (event: CalendarEvent) => {
      const eventUrl = new URL(
        getEventPath(event, language),
        window.location.origin,
      );

      if (navigator.share) {
        try {
          await navigator.share({
            title: event.title,
            url: eventUrl.toString(),
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError")
            return;
        }
      }

      try {
        await copyToClipboard(eventUrl.toString());
      } catch {
        const whatsappText = `${event.title}\n${eventUrl.toString()}`;
        window.open(
          `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }

      setCopiedEventId(event.id);
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }

      feedbackTimeoutRef.current = window.setTimeout(() => {
        setCopiedEventId(null);
        feedbackTimeoutRef.current = null;
      }, shareFeedbackDurationMs);
    },
    [language],
  );

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  return { copiedEventId, shareEvent };
}
