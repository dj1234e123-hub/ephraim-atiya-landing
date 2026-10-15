import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { initAnalytics } from "./analytics";
import { AccessibilityPage } from "./AccessibilityPage.tsx";

document.documentElement.classList.add("js");
initAnalytics("accessibility");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AccessibilityPage />
  </StrictMode>,
);
