import { PortfolioApp } from "./app/PortfolioApp.js";
import { queryRequired } from "./core/dom.js";
import { consumeReturnMarker } from "./state/ExpeditionSession.js";
import { applyStoredTheme } from "./core/theme.js";
import { applyStoredLanguage } from "./core/language.js";
import { applyExperienceSettings } from "./core/experienceSettings.js";

applyStoredTheme();
applyStoredLanguage();
applyExperienceSettings();

const root = queryRequired<HTMLElement>("#app");
const app = new PortfolioApp(root);

window.addEventListener("pagehide", (event) => {
  app.persistSession();
  if (!event.persisted) app.destroy();
});

window.addEventListener("pageshow", (event) => {
  if (event.persisted) consumeReturnMarker();
});
