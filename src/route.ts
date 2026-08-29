import { applyStoredLanguage, installLanguageControls } from "./core/language.js";
import { applyStoredTheme, installThemeControls } from "./core/theme.js";
import { renderPreferenceControls } from "./render/preferences.js";
import { applyExperienceSettings } from "./core/experienceSettings.js";
import { projectPresentationMetaById } from "./data/projectPresentation.js";
import type { NodeId } from "./domain/types.js";

applyStoredTheme();
applyStoredLanguage();
applyExperienceSettings();


const routeNodeByPath: Readonly<Record<string, NodeId>> = {
  "/work/haia/": "haia",
  "/work/haia/ilac/": "ilac",
  "/experience/axians/": "axians",
  "/projects/networked/": "networked",
  "/projects/embedded-lab/": "embedded-lab",
  "/projects/applications-lab/": "applications-lab",
  "/projects/vision-ml/": "vision-ml",
  "/projects/quant-research/": "quant-research",
};

const normalizeRoutePath = (pathname: string): string => pathname.endsWith("/") ? pathname : `${pathname}/`;
const routeNodeId = routeNodeByPath[normalizeRoutePath(window.location.pathname)];
const routeMeta = routeNodeId ? projectPresentationMetaById[routeNodeId] : undefined;

if (routeMeta) {
  const routeHero = document.querySelector<HTMLElement>(".route-hero");
  routeHero?.querySelector<HTMLElement>(".route-meta")?.remove();
  routeHero?.classList.add("route-hero-single");
  const heroPrimary = routeHero?.querySelector<HTMLElement>(":scope > div:first-child");
  const summary = heroPrimary?.querySelector<HTMLElement>(".route-summary");
  if (heroPrimary && summary) {
    const badges = document.createElement("div");
    badges.className = "route-role-badges";
    badges.setAttribute("aria-label", "Project role badges");
    for (const label of routeMeta.badges) {
      const badge = document.createElement("span");
      badge.textContent = label;
      badges.append(badge);
    }

    const strip = document.createElement("section");
    strip.className = "route-impact-strip";
    strip.setAttribute("aria-label", "Project impact summary");
    const fields = [
      ["ROLE", routeMeta.role],
      ["TEAM", routeMeta.team],
      ["PERIOD", routeMeta.period],
      ["STATUS", routeMeta.status],
      ["IMPACT", routeMeta.impact],
    ] as const;
    for (const [label, value] of fields) {
      const cell = document.createElement("div");
      const key = document.createElement("span");
      key.textContent = label;
      const content = document.createElement("b");
      content.textContent = value;
      cell.append(key, content);
      strip.append(cell);
    }
    summary.after(badges, strip);
  }
}

if (normalizeRoutePath(window.location.pathname) === "/contact/") {
  const heroPrimary = document.querySelector<HTMLElement>(".route-hero > div:first-child");
  const actions = heroPrimary?.querySelector<HTMLElement>(".route-actions");
  if (heroPrimary && actions) {
    const availability = document.createElement("section");
    availability.className = "route-availability-card";
    availability.setAttribute("aria-label", "Current availability");
    availability.innerHTML = `
      <div><span>CURRENTLY</span><b>Embedded Software Engineer · Rotterdam, Netherlands</b></div>
      <div><span>INTERESTED IN</span><b>Remote positions · Part-time · Full-stack development · Web development · Frontend/backend development · Cloud engineering · Embedded · Systems · IoT · Networking · Platform Engineering</b></div>`;
    actions.before(availability);
  }
}

document.querySelectorAll<HTMLElement>("[data-route-preferences]").forEach((target) => {
  target.innerHTML = renderPreferenceControls(`route-${target.dataset["routePreferences"] ?? "preferences"}`);
});

const themeCleanup = installThemeControls();
const languageCleanup = installLanguageControls();

window.addEventListener("pagehide", () => {
  themeCleanup();
  languageCleanup();
}, { once: true });
