export interface ExperienceSettings {
  readonly performanceMode: boolean;
  readonly accessibilityMode: boolean;
}

const STORAGE_KEY = "pen:experience-settings:v1";

const defaults: ExperienceSettings = {
  performanceMode: false,
  accessibilityMode: false,
};

const readBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

export const loadExperienceSettings = (): ExperienceSettings => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<ExperienceSettings> | null;
    if (!parsed || typeof parsed !== "object") return defaults;
    return {
      performanceMode: readBoolean(parsed.performanceMode, defaults.performanceMode),
      accessibilityMode: readBoolean(parsed.accessibilityMode, defaults.accessibilityMode),
    };
  } catch {
    return defaults;
  }
};

export const applyExperienceSettings = (settings: ExperienceSettings = loadExperienceSettings()): ExperienceSettings => {
  const root = document.documentElement;
  root.classList.toggle("performance-mode", settings.performanceMode);
  root.classList.toggle("accessibility-mode", settings.accessibilityMode);
  root.classList.toggle("simplified-map-mode", settings.accessibilityMode);
  root.dataset["performanceMode"] = settings.performanceMode ? "on" : "off";
  root.dataset["accessibilityMode"] = settings.accessibilityMode ? "on" : "off";
  return settings;
};

export const saveExperienceSettings = (settings: ExperienceSettings): ExperienceSettings => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage is optional. The active document still receives the setting.
  }
  applyExperienceSettings(settings);
  window.dispatchEvent(new CustomEvent<ExperienceSettings>("pen:settings-change", { detail: settings }));
  return settings;
};

export const updateExperienceSettings = (patch: Partial<ExperienceSettings>): ExperienceSettings => {
  const current = loadExperienceSettings();
  return saveExperienceSettings({ ...current, ...patch });
};

export const isPerformanceMode = (): boolean =>
  document.documentElement.classList.contains("performance-mode");

export const isAccessibilityMode = (): boolean =>
  document.documentElement.classList.contains("accessibility-mode");

export const isMotionReductionEnabled = (): boolean =>
  isPerformanceMode() || isAccessibilityMode();
