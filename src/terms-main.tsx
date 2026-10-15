import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { TermsPage } from "./TermsPage.tsx";

document.documentElement.classList.add("js");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TermsPage />
  </StrictMode>,
);
