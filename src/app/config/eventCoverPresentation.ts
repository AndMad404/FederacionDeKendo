interface CoverVariant {
  src: string;
  width: number;
  height: number;
}

interface EventCoverPresentation {
  officialFlyer?: { portraitTablet?: CoverVariant };
  generatedCalendarDesktop?: CoverVariant;
}

export const eventCoverPresentation: Readonly<
  Partial<Record<string, EventCoverPresentation>>
> = {
  "panama-5ta-copa-shogun-torneo-por-equipos-y-seminario": {
    officialFlyer: {
      portraitTablet: {
        src: "/images/events/panama-5ta-copa-shogun-torneo-por-equipos-y-seminario/copa-shogun-2026-panama-kendo-tablet-960.webp",
        width: 960,
        height: 720,
      },
    },
  },
  "seminario-noviembre-2026": {
    generatedCalendarDesktop: {
      src: "/images/calendar/seminario-noviembre-2026-desktop.webp",
      width: 1280,
      height: 800,
    },
  },
};
