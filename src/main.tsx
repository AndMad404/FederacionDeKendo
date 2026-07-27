import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./app/App.tsx";
import { CLIENT_ROUTE_COMPONENTS } from "./app/routeRegistry.client.tsx";
import "./styles/index.css";

const rootElement = document.getElementById("root")!;
const app = (
  <BrowserRouter>
    <App routeComponents={CLIENT_ROUTE_COMPONENTS} />
  </BrowserRouter>
);

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
