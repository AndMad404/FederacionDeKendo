export function createIcs(events) {
  return [
    "BEGIN:VCALENDAR",
    ...events.flatMap(({ uid, date = "20260808", title = "Examen" }) => [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${date}`,
      `SUMMARY:${title}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].join("\n");
}
