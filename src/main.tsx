import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { initAnalytics } from "./analytics";
import App from "./App.tsx";

// מסמן שיש JavaScript: רק אז אלמנטים של "כניסה בגלילה" מתחילים שקופים (ר' index.css).
document.documentElement.classList.add("js");
initAnalytics("landing");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
