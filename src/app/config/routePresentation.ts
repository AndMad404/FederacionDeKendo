import type { RouteComponent } from "./routeTypes";

type TabletPresentation = "contained" | "flow";

interface RoutePresentation {
  tabletMode: TabletPresentation;
}

const ROUTE_PRESENTATION = {
  home: { tabletMode: "contained" },
  calendar: { tabletMode: "contained" },
  gallery: { tabletMode: "contained" },
  affiliates: { tabletMode: "flow" },
  event: { tabletMode: "contained" },
  pastEvents: { tabletMode: "contained" },
  notFound: { tabletMode: "contained" },
} satisfies Record<RouteComponent, RoutePresentation>;

export function getRoutePresentation(component: RouteComponent) {
  return ROUTE_PRESENTATION[component];
}
