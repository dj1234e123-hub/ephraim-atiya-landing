import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./journal/index.css";
import { initAnalytics } from "./analytics";
import App from "./journal/App.tsx";

initAnalytics("journal");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
