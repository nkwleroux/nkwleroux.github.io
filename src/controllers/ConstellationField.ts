import { queryRequired } from "../core/dom.js";
import { finePointerQuery, mobileNavigationQuery, responsiveMode, supportsFinePointer } from "../core/media.js";

interface ViewportBounds {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Controls the low-cost brightness state for the static, map-owned constellation.
 *
 * Device emulation can change both viewport dimensions and primary-pointer
 * capabilities without reloading the page. The controller therefore keeps the
 * capability query live, refreshes its viewport bounds whenever layout changes,
 * and never caches a one-time "mobile" or "desktop" decision.
 */
export class ConstellationField {
  readonly #viewport = queryRequired<HTMLElement>("#viewport");
  readonly #world = queryRequired<HTMLElement>("#world");
  readonly #abort = new AbortController();
  readonly #resizeObserver: ResizeObserver | null;
  #interactive = supportsFinePointer();
  #paused = false;
  #pointerInside = false;
  #refreshFrameId = 0;
  #bounds: ViewportBounds = { left: 0, top: 0, width: 0, height: 0 };

  constructor() {
    this.#viewport.addEventListener("pointerenter", this.#handlePointerEnter, {
      signal: this.#abort.signal,
      passive: true,
    });
    this.#viewport.addEventListener("pointerleave", this.#handlePointerExit, {
      signal: this.#abort.signal,
      passive: true,
    });
    this.#viewport.addEventListener("pointercancel", this.#handlePointerExit, {
      signal: this.#abort.signal,
      passive: true,
    });
    finePointerQuery.addEventListener("change", this.#handlePointerCapabilityChange, {
      signal: this.#abort.signal,
    });
    mobileNavigationQuery.addEventListener("change", this.#handlePointerCapabilityChange, {
      signal: this.#abort.signal,
    });

    this.#resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => this.scheduleLayoutRefresh());
    this.#resizeObserver?.observe(this.#viewport);
  }

  start(): void {
    this.refreshViewportBounds();
  }

  pause(): void {
    this.#paused = true;
    this.#world.classList.add("constellation-field-calm");
    this.#syncHoverState();
  }

  resume(): void {
    this.#paused = false;
    this.#world.classList.remove("constellation-field-calm");
    this.#syncHoverState();
  }

  /** Recalculate the live constellation viewport after a mode or viewport change. */
  refreshViewportBounds(): void {
    if (this.#refreshFrameId !== 0) {
      cancelAnimationFrame(this.#refreshFrameId);
      this.#refreshFrameId = 0;
    }

    let attempt = 0;
    const measure = (): void => {
      this.#refreshFrameId = 0;
      const mobile = responsiveMode() === "mobile";
      this.#interactive = supportsFinePointer();
      if (!this.#interactive) this.#pointerInside = false;

      const rect = this.#viewport.getBoundingClientRect();
      const width = Math.max(0, rect.width);
      const height = Math.max(0, rect.height);

      // Chrome may report stale or zero geometry for one or two frames while
      // Device Toolbar changes metrics. The same world is visible in both modes,
      // so retry any zero-sized measurement before committing its bounds.
      if ((width <= 0 || height <= 0) && attempt < 6) {
        attempt += 1;
        this.#refreshFrameId = requestAnimationFrame(measure);
        return;
      }

      this.#bounds = {
        left: rect.left,
        top: rect.top,
        width,
        height,
      };

      // These values keep CSS diagnostics and world-space effects synchronized
      // with the current viewport after any live capability or size change.
      this.#world.style.setProperty("--constellation-viewport-width", `${this.#bounds.width.toFixed(2)}px`);
      this.#world.style.setProperty("--constellation-viewport-height", `${this.#bounds.height.toFixed(2)}px`);
      this.#world.style.setProperty("--constellation-viewport-left", `${this.#bounds.left.toFixed(2)}px`);
      this.#world.style.setProperty("--constellation-viewport-top", `${this.#bounds.top.toFixed(2)}px`);
      this.#world.dataset["constellationViewport"] = `${Math.round(this.#bounds.width)}x${Math.round(this.#bounds.height)}`;
      this.#world.dataset["constellationMode"] = mobile ? "mobile" : "desktop";

      this.#syncHoverState();
    };

    measure();
  }

  scheduleLayoutRefresh(): void {
    if (this.#refreshFrameId !== 0) cancelAnimationFrame(this.#refreshFrameId);
    this.#refreshFrameId = requestAnimationFrame(() => {
      this.#refreshFrameId = 0;
      this.refreshViewportBounds();
    });
  }

  destroy(): void {
    this.#abort.abort();
    this.#resizeObserver?.disconnect();
    if (this.#refreshFrameId !== 0) cancelAnimationFrame(this.#refreshFrameId);
    this.#refreshFrameId = 0;
    this.#world.classList.remove("constellation-hover-active", "constellation-field-calm");
    delete this.#world.dataset["constellationViewport"];
    delete this.#world.dataset["constellationMode"];
  }

  readonly #handlePointerEnter = (): void => {
    this.#pointerInside = true;
    this.#syncHoverState();
  };

  readonly #handlePointerExit = (): void => {
    this.#pointerInside = false;
    this.#syncHoverState();
  };

  readonly #handlePointerCapabilityChange = (): void => {
    this.refreshViewportBounds();
  };

  #syncHoverState(): void {
    this.#world.classList.toggle(
      "constellation-hover-active",
      this.#interactive && this.#pointerInside && !this.#paused,
    );
  }
}
