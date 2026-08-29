import { queryRequired, setInertVisibility } from "../core/dom.js";
import { loadExperienceSettings, updateExperienceSettings, type ExperienceSettings } from "../core/experienceSettings.js";
import { translateText } from "../core/language.js";

export class SettingsController {
  readonly #abort = new AbortController();
  readonly #modal = queryRequired<HTMLElement>("#settings-modal");
  readonly #performance = queryRequired<HTMLInputElement>("#performance-mode-toggle");
  readonly #accessibility = queryRequired<HTMLInputElement>("#accessibility-mode-toggle");
  readonly #status = queryRequired<HTMLElement>("#settings-status");
  #previousFocus: HTMLElement | null = null;

  constructor(
    private readonly onChange?: (settings: ExperienceSettings) => void,
    private readonly onClose?: () => void,
  ) {
    this.#modal.inert = true;
    this.#sync(loadExperienceSettings());
    queryRequired<HTMLButtonElement>("#settings-close").addEventListener("click", () => this.close(), { signal: this.#abort.signal });
    this.#performance.addEventListener("change", () => this.#save({ performanceMode: this.#performance.checked }), { signal: this.#abort.signal });
    this.#accessibility.addEventListener("change", () => this.#save({ accessibilityMode: this.#accessibility.checked }), { signal: this.#abort.signal });
    this.#modal.addEventListener("pointerdown", (event) => {
      if (event.target === this.#modal) this.close();
    }, { signal: this.#abort.signal });
  }

  isOpen(): boolean {
    return this.#modal.getAttribute("aria-hidden") === "false";
  }

  open(): void {
    if (this.isOpen()) return;
    this.#previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.#sync(loadExperienceSettings());
    setInertVisibility(this.#modal, true);
    this.#modal.style.pointerEvents = "auto";
    requestAnimationFrame(() => this.#performance.focus({ preventScroll: true }));
  }

  close(restoreFocus = true, notify = true): void {
    if (!this.isOpen()) return;
    const focusTarget = restoreFocus ? this.#previousFocus : null;
    setInertVisibility(this.#modal, false, focusTarget);
    this.#modal.style.pointerEvents = "none";
    this.#previousFocus = null;
    if (notify) this.onClose?.();
  }

  destroy(): void {
    this.#abort.abort();
  }

  #save(patch: Partial<ExperienceSettings>): void {
    const settings = updateExperienceSettings(patch);
    this.#sync(settings);
    this.onChange?.(settings);
  }

  #sync(settings: ExperienceSettings): void {
    this.#performance.checked = settings.performanceMode;
    this.#accessibility.checked = settings.accessibilityMode;
    const modes: string[] = [];
    if (settings.performanceMode) modes.push(translateText("Performance mode on"));
    if (settings.accessibilityMode) modes.push(translateText("Accessibility mode on"));
    this.#status.textContent = modes.length > 0 ? modes.join(" · ") : translateText("Standard presentation active");
  }
}
