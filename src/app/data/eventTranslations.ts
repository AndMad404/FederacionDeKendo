export interface EventTranslation {
  source: {
    title: string;
    summary?: string;
  };
  translation: {
    title: string;
    summary?: string;
  };
}

// Editorial English translations keyed by the stable calendar event ID.
// The source fields deliberately make a Calendar update invalidate copy until
// the translation is reviewed and updated.
import translations from "./eventTranslations.json";

export const EVENT_TRANSLATIONS: Record<string, EventTranslation> =
  translations;
