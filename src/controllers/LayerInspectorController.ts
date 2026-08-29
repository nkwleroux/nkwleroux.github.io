import { gsap } from "../animations/gsap.js";
import { revealElements } from "../animations/motion.js";
import { clamp } from "../core/math.js";
import { queryRequired, setInertVisibility } from "../core/dom.js";
import { translateText } from "../core/language.js";
import { prefersReducedMotion } from "../core/media.js";

interface SplitBounds {
  readonly width: number;
  readonly minX: number;
  readonly maxX: number;
}

export class LayerInspectorController {
  static readonly VIEW_STORAGE_KEY = "pen:layer-view:v1";

  readonly #abort = new AbortController();
  readonly #inspector = queryRequired<HTMLElement>("#layer-inspector");
  readonly #shell = queryRequired<HTMLElement>("#layer-shell");
  readonly #divider = queryRequired<HTMLElement>("#layer-divider");
  readonly #viewToggle = queryRequired<HTMLButtonElement>("#layer-view-toggle");
  #splitRatio = 0.5;
  #pointerId: number | null = null;
  #iconView = false;

  constructor() {
    try {
      this.#iconView = localStorage.getItem(LayerInspectorController.VIEW_STORAGE_KEY) === "icons";
    } catch {
      this.#iconView = false;
    }
    this.#applyViewMode();

    this.#viewToggle.addEventListener("click", () => {
      this.#iconView = !this.#iconView;
      this.#applyViewMode();
      try {
        localStorage.setItem(
          LayerInspectorController.VIEW_STORAGE_KEY,
          this.#iconView ? "icons" : "text",
        );
      } catch {
        // The view still switches for the current session if storage is unavailable.
      }
    }, { signal: this.#abort.signal });

    this.#divider.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.#setSplitRatio(this.#splitRatio - 0.035);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        this.#setSplitRatio(this.#splitRatio + 0.035);
      } else if (event.key === "Home") {
        event.preventDefault();
        this.#setSplitFromPixels(this.#getBounds().minX);
      } else if (event.key === "End") {
        event.preventDefault();
        this.#setSplitFromPixels(this.#getBounds().maxX);
      }
    }, { signal: this.#abort.signal });

    this.#divider.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      this.#pointerId = event.pointerId;
      this.#divider.setPointerCapture(event.pointerId);
      this.#divider.classList.add("dragging");
      this.#updateFromClientX(event.clientX);
    }, { signal: this.#abort.signal });

    this.#divider.addEventListener("pointermove", (event) => {
      if (this.#pointerId !== event.pointerId) return;
      event.preventDefault();
      this.#updateFromClientX(event.clientX);
    }, { signal: this.#abort.signal });

    const finishPointer = (event: PointerEvent): void => {
      if (this.#pointerId !== event.pointerId) return;
      this.#updateFromClientX(event.clientX);
      if (this.#divider.hasPointerCapture(event.pointerId)) this.#divider.releasePointerCapture(event.pointerId);
      this.#pointerId = null;
      this.#divider.classList.remove("dragging");
    };

    this.#divider.addEventListener("pointerup", finishPointer, { signal: this.#abort.signal });
    this.#divider.addEventListener("pointercancel", finishPointer, { signal: this.#abort.signal });

    window.addEventListener("pen:languagechange", () => {
      this.#applyViewMode();
      this.refreshBounds();
    }, { signal: this.#abort.signal });
  }

  open(): void {
    setInertVisibility(this.#inspector, true);
    this.#inspector.style.pointerEvents = "auto";
    if (prefersReducedMotion()) gsap.set(this.#inspector, { opacity: 1 });
    else gsap.to(this.#inspector, { opacity: 1, duration: 0.32 });
    revealElements(Array.from(this.#inspector.querySelectorAll<HTMLElement>(".layer-grid article")));
    requestAnimationFrame(() => this.refreshBounds());
  }

  close(): void {
    const finish = (): void => {
      this.#inspector.style.pointerEvents = "none";
      setInertVisibility(this.#inspector, false);
    };
    if (prefersReducedMotion()) {
      gsap.set(this.#inspector, { opacity: 0 });
      finish();
    } else {
      gsap.to(this.#inspector, { opacity: 0, duration: 0.26, onComplete: finish });
    }
  }

  isOpen(): boolean {
    return this.#inspector.getAttribute("aria-hidden") === "false";
  }

  refreshBounds(): void {
    const bounds = this.#getBounds();
    if (bounds.width === 0) return;
    const ratioMin = bounds.minX / bounds.width;
    const ratioMax = bounds.maxX / bounds.width;
    this.#splitRatio = clamp(this.#splitRatio, ratioMin, ratioMax);
    this.#applySplit(bounds.width * this.#splitRatio, bounds.width);
  }

  destroy(): void {
    this.#abort.abort();
    this.#pointerId = null;
  }

  #applyViewMode(): void {
    this.#shell.classList.toggle("layer-icon-mode", this.#iconView);
    this.#viewToggle.textContent = translateText(this.#iconView ? "VIEW: TEXT" : "VIEW: ICONS");
    this.#viewToggle.setAttribute("aria-pressed", String(this.#iconView));
    this.#viewToggle.setAttribute(
      "aria-label",
      translateText(this.#iconView ? "Show layer items as text" : "Show layer items as icons"),
    );
  }

  #getBounds(): SplitBounds {
    const width = this.#shell.clientWidth;
    if (width === 0) return { width: 0, minX: 0, maxX: 0 };

    const halfLimit = Math.max(96, width / 2 - 28);
    const desiredMinimum = width >= 900
      ? Math.max(250, width * 0.24)
      : Math.max(118, width * 0.28);
    const minimumPane = Math.min(desiredMinimum, halfLimit);
    return {
      width,
      minX: minimumPane,
      maxX: width - minimumPane,
    };
  }

  #updateFromClientX(clientX: number): void {
    const rect = this.#shell.getBoundingClientRect();
    const bounds = this.#getBounds();
    if (bounds.width === 0) return;
    this.#setSplitFromPixels(clientX - rect.left);
  }

  #setSplitFromPixels(rawX: number): void {
    const bounds = this.#getBounds();
    if (bounds.width === 0) return;
    const x = clamp(rawX, bounds.minX, bounds.maxX);
    this.#splitRatio = x / bounds.width;
    this.#applySplit(x, bounds.width);
  }

  #setSplitRatio(ratio: number): void {
    const bounds = this.#getBounds();
    if (bounds.width === 0) return;
    const minRatio = bounds.minX / bounds.width;
    const maxRatio = bounds.maxX / bounds.width;
    this.#splitRatio = clamp(ratio, minRatio, maxRatio);
    this.#applySplit(bounds.width * this.#splitRatio, bounds.width);
  }

  #applySplit(x: number, width: number): void {
    this.#shell.style.setProperty("--split-x", `${x}px`);
    this.#divider.style.left = `${x}px`;
    this.#divider.style.transform = "none";
    const physicalPercent = Math.round((x / width) * 100);
    this.#divider.setAttribute("aria-valuenow", physicalPercent.toString());
    this.#divider.setAttribute(
      "aria-valuetext",
      translateText(`Physical ${physicalPercent}%, application ${100 - physicalPercent}%`),
    );
  }
}
