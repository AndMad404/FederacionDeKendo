import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App, { type RouteComponentRegistry } from "./app/App";
import { AfiliadosSection } from "./app/components/AfiliadosSection";
import { CalendarSection } from "./app/components/CalendarSection";
import { GallerySection } from "./app/components/GallerySection";
import { HeroSection } from "./app/components/HeroSection";
import { NotFoundSection } from "./app/components/NotFoundSection";

export {
  getRouteHeadDescriptors,
  getRouteManifest,
  getRouteMeta,
  getRouteSeoPayload,
} from "./app/config/seo";

const SERVER_ROUTE_COMPONENTS: RouteComponentRegistry = {
  routes: {
    home: HeroSection,
    calendar: CalendarSection,
    gallery: GallerySection,
    affiliates: AfiliadosSection,
  },
  notFound: NotFoundSection,
};

export function render(url: string) {
  return renderToString(
    <StaticRouter location={url}>
      <App routeComponents={SERVER_ROUTE_COMPONENTS} />
    </StaticRouter>,
  );
}
