import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "../../../src/app/App";
import { CLIENT_ROUTE_COMPONENTS } from "../../../src/app/routeRegistry.client";
import "../../../src/styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App routeComponents={CLIENT_ROUTE_COMPONENTS} />
  </BrowserRouter>,
);
