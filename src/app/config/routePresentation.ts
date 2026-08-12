import type { RouteComponent } from "./routeTypes";

type TabletPresentation = "contained" | "flow";
type DesktopPresentation = "contained" | "flow";

interface RoutePresentation {
  tabletMode: TabletPresentation;
  desktopMode: DesktopPresentation;
}

const ROUTE_PRESENTATION = {
  home: { tabletMode: "contained", desktopMode: "contained" },
  calendar: { tabletMode: "contained", desktopMode: "contained" },
  gallery: { tabletMode: "contained", desktopMode: "contained" },
  affiliates: { tabletMode: "flow", desktopMode: "contained" },
  event: { tabletMode: "flow", desktopMode: "flow" },
  pastEvents: { tabletMode: "contained", desktopMode: "contained" },
  notFound: { tabletMode: "contained", desktopMode: "contained" },
} satisfies Record<RouteComponent, RoutePresentation>;

export function getRoutePresentation(component: RouteComponent) {
  return ROUTE_PRESENTATION[component];
}
