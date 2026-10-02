import type { CalendarEvent } from "../../../src/app/types";
import calibration from "../calendar-layout-calibration.json" with { type: "json" };

export const CONTENT_LOADS = [
  { paragraphs: 1, sentences: 1, listItems: 0 },
  { paragraphs: 2, sentences: 3, listItems: 3 },
  { paragraphs: 4, sentences: 5, listItems: 8 },
  { paragraphs: 8, sentences: 8, listItems: 16 },
];
function summary(load: (typeof CONTENT_LOADS)[number]) {
  const paragraph = "Información del encuentro y sus actividades. ".repeat(
    load.sentences,
  );
  return [
    ...Array.from({ length: load.paragraphs }, () => paragraph),
    Array.from(
      { length: load.listItems },
      (_, index) => `- Actividad de prueba ${index + 1}`,
    ).join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");
}
const base: CalendarEvent = {
  id: "fixture",
  title: "Encuentro de prueba",
  date: "2026-09-12",
  archiveEligibleAt: "2026-09-14T06:00:00.000Z",
  location: "Sede de prueba",
  eventType: "seminario",
  timeZone: "America/Costa_Rica",
};
export const IMAGE_SCENARIOS = [
  { count: 0, dimensions: [] },
  { count: 1, dimensions: [[480, 320]] },
  {
    count: 5,
    dimensions: [
      [320, 640],
      [640, 480],
    ],
  },
  { count: 6, dimensions: [[4000, 1000]] },
  { count: 7, dimensions: [[600, 600]] },
  {
    count: 20,
    dimensions: [
      [400, 800],
      [800, 1200],
      [480, 320],
    ],
  },
  { count: 32, dimensions: [[160, 90]] },
  {
    count: 3,
    dimensions: [
      [320, 640],
      [600, 1200],
    ],
  },
];
export const CALENDAR_EVENTS: CalendarEvent[] = [
  ...IMAGE_SCENARIOS.map((_, index) => ({
    ...base,
    id: `layout-${index}`,
    summary: summary(
      CONTENT_LOADS[index === 0 ? 3 : index % CONTENT_LOADS.length],
    ),
  })),
  ...CONTENT_LOADS.map((load, index) => ({
    ...base,
    id: `content-${index}`,
    summary: summary(load),
  })),
  {
    ...base,
    id: "long-word",
    location: "Ubicacion".repeat(30),
    summary: summary(CONTENT_LOADS[0]),
  },
  calibration.event as CalendarEvent,
];
export function neutralImages(count: number, dimensions: number[][]) {
  return Array.from({ length: count }, (_, index) => {
    const [width, height] = dimensions[index % dimensions.length];
    const src = `/fixture-image/${width}x${height}.jpg`;
    return {
      order: index + 1,
      alt: `Imagen neutra ${index + 1}`,
      width,
      height,
      src,
      srcSet: { webp: `${src} ${width}w`, avif: `${src} ${width}w` },
      sizes: "100vw",
    };
  });
}
export const EVENT_GALLERIES = Object.fromEntries([
  ...IMAGE_SCENARIOS.filter((scenario) => scenario.count > 0).map(
    (scenario) => {
      const index = IMAGE_SCENARIOS.indexOf(scenario);
      return [
        `layout-${index}`,
        {
          fingerprint: `fixture-${index}`,
          images: neutralImages(scenario.count, scenario.dimensions),
        },
      ];
    },
  ),
  ...CONTENT_LOADS.map((_, index) => [
    `content-${index}`,
    { fingerprint: `content-${index}`, images: neutralImages(8, [[640, 480]]) },
  ]),
  [
    "calibration-dense",
    {
      fingerprint: "calibration",
      images: neutralImages(calibration.photoCount, [[1600, 1066]]),
    },
  ],
]);
export const EVENT_TRANSLATIONS = Object.fromEntries(
  CALENDAR_EVENTS.map((event) => [
    event.id,
    {
      source: { title: event.title, summary: event.summary },
      translation: { title: `Test event ${event.id}`, summary: event.summary },
    },
  ]),
);
