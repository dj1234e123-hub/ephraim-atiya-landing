import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AccessibilityPage } from "./AccessibilityPage.tsx";

document.documentElement.classList.add("js");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AccessibilityPage />
  </StrictMode>,
);
