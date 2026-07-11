import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./app/App.tsx";
import "./styles/index.css";

hydrateRoot(
  document.getElementById("root")!,
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
