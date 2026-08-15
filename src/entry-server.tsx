import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App, { type RouteComponentRegistry } from "./app/App";
import { AfiliadosSection } from "./app/components/AfiliadosSection";
import { CalendarSection } from "./app/components/CalendarSection";
import { GallerySection } from "./app/components/GallerySection";
import { HeroSection } from "./app/components/HeroSection";
import { NotFoundSection } from "./app/components/NotFoundSection";
import { EventPage } from "./app/components/EventPage";
import { PastEventsSection } from "./app/components/PastEventsSection";

export {
  getRouteHeadDescriptors,
  getEventRedirects,
  getRouteManifest,
  getRouteMeta,
  getRouteSeoPayload,
  getRouteSitemapImageUrls,
} from "./app/config/seo";

const SERVER_ROUTE_COMPONENTS: RouteComponentRegistry = {
  routes: {
    home: HeroSection,
    calendar: CalendarSection,
    gallery: GallerySection,
    affiliates: AfiliadosSection,
    event: EventPage,
    pastEvents: PastEventsSection,
    notFound: NotFoundSection,
  },
};

export function render(url: string, prerenderedAt: string) {
  return renderToString(
    <StaticRouter location={url}>
      <App
        routeComponents={SERVER_ROUTE_COMPONENTS}
        prerenderedAt={prerenderedAt}
      />
    </StaticRouter>,
  );
}
