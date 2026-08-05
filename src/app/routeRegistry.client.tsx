import { lazy } from "react";
import type { RouteComponentRegistry } from "./App";

export const CLIENT_ROUTE_COMPONENTS: RouteComponentRegistry = {
  routes: {
    home: lazy(() =>
      import("./components/HeroSection").then((module) => ({
        default: module.HeroSection,
      })),
    ),
    calendar: lazy(() =>
      import("./components/CalendarSection").then((module) => ({
        default: module.CalendarSection,
      })),
    ),
    gallery: lazy(() =>
      import("./components/GallerySection").then((module) => ({
        default: module.GallerySection,
      })),
    ),
    affiliates: lazy(() =>
      import("./components/AfiliadosSection").then((module) => ({
        default: module.AfiliadosSection,
      })),
    ),
    event: lazy(() =>
      import("./components/EventPage").then((module) => ({
        default: module.EventPage,
      })),
    ),
    pastEvents: lazy(() =>
      import("./components/PastEventsSection").then((module) => ({
        default: module.PastEventsSection,
      })),
    ),
    notFound: lazy(() =>
      import("./components/NotFoundSection").then((module) => ({
        default: module.NotFoundSection,
      })),
    ),
  },
};
