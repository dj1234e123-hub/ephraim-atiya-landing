import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { initAnalytics } from "./analytics";
import { TermsPage } from "./TermsPage.tsx";

document.documentElement.classList.add("js");
initAnalytics("terms");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TermsPage />
  </StrictMode>,
);
