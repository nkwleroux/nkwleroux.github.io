import { queryRequired, setInertVisibility } from "../core/dom.js";
import { translateText } from "../core/language.js";
import { prefersReducedMotion } from "../core/media.js";
import { categoryHubById, portfolioNodes } from "../data/portfolio.js";
import { categorySummaries, timelinePositions, type WorldView } from "../data/experience.js";
import type { MissionGroup, NodeId, Point } from "../domain/types.js";
import type { WorldController } from "./WorldController.js";

const NETWORK_VIEW_STORAGE = "pen:world-view:v1";

export class WorldLayoutController {
  readonly #abort = new AbortController();
  readonly #viewToggle = queryRequired<HTMLButtonElement>("#view-toggle");
  readonly #mobileViewToggle = queryRequired<HTMLButtonElement>("#mobile-view-toggle");
  readonly #focusCard = queryRequired<HTMLElement>("#category-focus-card");
  readonly #focusTitle = queryRequired<HTMLElement>("#category-focus-title");
  readonly #focusCopy = queryRequired<HTMLElement>("#category-focus-copy");
  readonly #focusCount = queryRequired<HTMLElement>("#category-focus-count");
  #view: WorldView = "network";
  #focusedGroup: MissionGroup | null = null;

  constructor(private readonly world: WorldController) {
    const stored = window.localStorage.getItem(NETWORK_VIEW_STORAGE);
    if (stored === "timeline") this.#view = "timeline";
    this.#focusCard.inert = true;
    this.#bind();
    this.#applyView(false);
  }

  view(): WorldView {
    return this.#view;
  }

  refreshView(): void {
    document.documentElement.dataset["worldView"] = this.#view;
    this.#syncViewControls();
    document.documentElement.classList.add("world-layout-no-motion");
    if (this.#view === "timeline") {
      this.world.setNodePositions(timelinePositions);
      this.#applyNodePositions(timelinePositions);
    } else {
      this.world.setNodePositions({});
      this.#applyNetworkPositions();
    }
    this.world.renderPosition();
    requestAnimationFrame(() => document.documentElement.classList.remove("world-layout-no-motion"));
  }

  focusedGroup(): MissionGroup | null {
    return this.#focusedGroup;
  }

  toggleView(): void {
    this.setView(this.#view === "network" ? "timeline" : "network");
  }

  setView(view: WorldView): void {
    if (view === this.#view && !this.#focusedGroup) return;
    this.exitFocus(false);
    this.#view = view;
    window.localStorage.setItem(NETWORK_VIEW_STORAGE, view);
    this.#applyView(true);
  }

  focusCategory(group: MissionGroup, onFocused?: () => void): void {
    if (this.#focusedGroup && this.#focusedGroup !== group) this.exitFocus(false);
    const hub = categoryHubById[group];
    if (hub.missionIds.length <= 1) {
      this.world.autopilotCategory(group, onFocused);
      return;
    }

    if (this.#view !== "network") {
      this.#view = "network";
      window.localStorage.setItem(NETWORK_VIEW_STORAGE, "network");
      this.#applyView(false);
    }

    this.#focusedGroup = group;
    document.documentElement.dataset["focusGroup"] = group;
    document.documentElement.classList.add("category-focus-active");

    this.#focusTitle.textContent = translateText(hub.label);
    this.#focusCopy.textContent = translateText(categorySummaries[group]);
    this.#focusCount.textContent = translateText(`${hub.missionIds.length} MISSIONS`);
    setInertVisibility(this.#focusCard, true);

    this.world.autopilotCategory(group, () => {
      this.world.setViewScale(prefersReducedMotion() ? 1.04 : 1.12);
      onFocused?.();
    });
  }

  exitFocus(resumeScale = true): void {
    if (!this.#focusedGroup) return;
    this.#focusedGroup = null;
    delete document.documentElement.dataset["focusGroup"];
    document.documentElement.classList.remove("category-focus-active");
    setInertVisibility(this.#focusCard, false);
    if (resumeScale) this.world.setViewScale(1);
  }

  destroy(): void {
    this.#abort.abort();
    this.exitFocus();
  }

  #bind(): void {
    this.#viewToggle.addEventListener("click", () => this.toggleView(), { signal: this.#abort.signal });
    window.addEventListener("pen:languagechange", () => this.#syncViewControls(), { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#category-focus-back").addEventListener("click", () => {
      this.exitFocus();
      this.world.resumeManualControl();
    }, { signal: this.#abort.signal });
  }

  #applyView(animate: boolean): void {
    document.documentElement.dataset["worldView"] = this.#view;
    this.#syncViewControls();

    if (!animate || prefersReducedMotion()) document.documentElement.classList.add("world-layout-no-motion");

    if (this.#view === "timeline") {
      this.world.setNodePositions(timelinePositions);
      this.#applyNodePositions(timelinePositions);
      this.world.setViewScale(0.9);
    } else {
      this.world.setNodePositions({});
      this.#applyNetworkPositions();
      this.world.setViewScale(1);
    }

    if (!animate || prefersReducedMotion()) requestAnimationFrame(() => document.documentElement.classList.remove("world-layout-no-motion"));
  }

  #syncViewControls(): void {
    const label = translateText(this.#view === "network" ? "TIMELINE / EXPEDITION LOG" : "NETWORK / CAREER MAP");
    const pressed = String(this.#view === "timeline");
    const ariaLabel = translateText(`Switch to ${this.#view === "network" ? "timeline / expedition log" : "network / career map"} view`);
    for (const control of [this.#viewToggle, this.#mobileViewToggle]) {
      control.textContent = label;
      control.setAttribute("aria-pressed", pressed);
      control.setAttribute("aria-label", ariaLabel);
    }
  }

  #applyNetworkPositions(): void {
    for (const node of portfolioNodes) {
      const element = document.querySelector<HTMLElement>(`.node[data-node-id="${node.id}"]`);
      element?.style.setProperty("--node-x", `${node.position.x}px`);
      element?.style.setProperty("--node-y", `${node.position.y}px`);
    }
  }

  #applyNodePositions(positions: Readonly<Partial<Record<NodeId, Point>>>): void {
    for (const node of portfolioNodes) {
      const position = positions[node.id] ?? node.position;
      const element = document.querySelector<HTMLElement>(`.node[data-node-id="${node.id}"]`);
      element?.style.setProperty("--node-x", `${position.x}px`);
      element?.style.setProperty("--node-y", `${position.y}px`);
    }
  }
}
