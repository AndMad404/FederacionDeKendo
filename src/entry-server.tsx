import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "./app/App";

export { getRouteMeta, getRouteSeoPayload } from "./app/config/seo";

export function render(url: string) {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  );
}
