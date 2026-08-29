import { translate } from "./language.js";
import { prefersReducedMotion } from "./media.js";

export type PenTheme = "dark" | "light";

const STORAGE_KEY = "pen:theme:v1";
const DEFAULT_THEME: PenTheme = "dark";
let themeTransitionGeneration = 0;
let themeTransitionTimer: number | null = null;

const isTheme = (value: string | null): value is PenTheme =>
  value === "dark" || value === "light";

export const currentTheme = (): PenTheme => {
  const fromDom = document.documentElement.dataset["theme"] ?? null;
  if (isTheme(fromDom)) return fromDom;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    // Storage can be unavailable in privacy-restricted contexts.
  }

  return DEFAULT_THEME;
};

const syncThemeColorMeta = (theme: PenTheme): void => {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = theme === "light" ? "#edf2ee" : "#050f12";
};

export const syncThemeControls = (): void => {
  const theme = currentTheme();
  document.querySelectorAll<HTMLElement>("[data-theme-switch]").forEach((control) => {
    control.dataset["activeTheme"] = theme;
    control.setAttribute(
      "aria-label",
      translate(theme === "light" ? "theme.currentLight" : "theme.currentDark"),
    );
  });
  document.querySelectorAll<HTMLButtonElement>("[data-theme-option]").forEach((button) => {
    const option = button.dataset["themeOption"];
    const active = option === theme;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
};

const commitTheme = (theme: PenTheme): void => {
  document.documentElement.dataset["theme"] = theme;
  document.documentElement.style.colorScheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Theme still applies for the current page even if persistence is unavailable.
  }
  syncThemeColorMeta(theme);
  syncThemeControls();
  window.dispatchEvent(new CustomEvent("pen:themechange", { detail: { theme } }));
};

export const applyTheme = (theme: PenTheme): void => commitTheme(theme);

/**
 * Applies the requested palette while the existing page remains visible.
 * Only the major interface surfaces receive a short colour transition; the
 * large expedition world is never covered, captured, or cross-faded.
 */
export const transitionTheme = (theme: PenTheme, _trigger?: HTMLElement): void => {
  if (theme === currentTheme()) return;

  const root = document.documentElement;
  const generation = ++themeTransitionGeneration;
  if (themeTransitionTimer !== null) {
    window.clearTimeout(themeTransitionTimer);
    themeTransitionTimer = null;
  }

  root.classList.remove("theme-switching");
  // Restart the transition class when visitors change direction quickly.
  void root.offsetWidth;
  root.classList.add("theme-switching");
  commitTheme(theme);

  if (prefersReducedMotion()) {
    requestAnimationFrame(() => {
      if (generation === themeTransitionGeneration) root.classList.remove("theme-switching");
    });
    return;
  }

  themeTransitionTimer = window.setTimeout(() => {
    themeTransitionTimer = null;
    if (generation === themeTransitionGeneration) root.classList.remove("theme-switching");
  }, 680);
};

export const applyStoredTheme = (): void => {
  commitTheme(currentTheme());
};

export const installThemeControls = (): (() => void) => {
  const abort = new AbortController();
  syncThemeControls();

  document.querySelectorAll<HTMLButtonElement>("[data-theme-option]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = button.dataset["themeOption"];
      if (next === "light" || next === "dark") transitionTheme(next, button);
    }, { signal: abort.signal });
  });

  const languageHandler = (): void => syncThemeControls();
  window.addEventListener("pen:languagechange", languageHandler, { signal: abort.signal });

  return () => abort.abort();
};
