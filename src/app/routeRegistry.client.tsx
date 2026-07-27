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
  },
  notFound: lazy(() =>
    import("./components/NotFoundSection").then((module) => ({
      default: module.NotFoundSection,
    })),
  ),
};
