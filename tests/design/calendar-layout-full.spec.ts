import { generatedPages } from "../helpers/generated-pages";
import { registerCalendarLayoutTests } from "../helpers/calendar-layout-suite";

registerCalendarLayoutTests(
  generatedPages({ spanishOnly: true }).filter((page) =>
    ["calendar", "pastEvents", "event"].includes(page.design),
  ),
);
