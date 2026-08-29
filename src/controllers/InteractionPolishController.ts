import { queryRequired } from "../core/dom.js";
import { translateText } from "../core/language.js";
import { finePointerQuery, mobileNavigationQuery, supportsFinePointer } from "../core/media.js";
import { categorySummaries, missionPreviews } from "../data/experience.js";
import { categoryHubById, nodeById } from "../data/portfolio.js";
import type { MissionGroup, NodeId } from "../domain/types.js";


export class InteractionPolishController {
  readonly #abort = new AbortController();
  readonly #preview = queryRequired<HTMLElement>("#mission-preview");
  readonly #cursor = queryRequired<HTMLElement>("#context-cursor");
  readonly #cursorLabel = queryRequired<HTMLElement>("#context-cursor-label");
  #cursorFrame = 0;
  #pendingPointer: { x: number; y: number; label: string } | null = null;
  #cursorVisible = false;
  #cursorEnabled = false;

  constructor() {
    this.#bindMissionPreviews();
    this.#bindCategoryHubPreviews();
    this.#bindMissionRailHighlights();
    this.#bindCursor();
    this.#syncCursorCapability();
    finePointerQuery.addEventListener("change", this.#syncCursorCapability, {
      signal: this.#abort.signal,
    });
    mobileNavigationQuery.addEventListener("change", this.#syncCursorCapability, {
      signal: this.#abort.signal,
    });
  }

  pulseNode(nodeId: NodeId): void {
    const node = document.querySelector<HTMLElement>(`.node[data-node-id="${nodeId}"]`);
    if (!node) return;
    node.classList.add("handoff");
    window.setTimeout(() => node.classList.remove("handoff"), 420);
  }

  destroy(): void {
    this.#abort.abort();
    cancelAnimationFrame(this.#cursorFrame);
    this.#cursorFrame = 0;
    this.#pendingPointer = null;
    document.documentElement.classList.remove("context-cursor-enabled");
  }

  #bindMissionPreviews(): void {
    document.querySelectorAll<HTMLElement>(".node[data-node-id]").forEach((nodeElement) => {
      const show = (): void => {
        const nodeId = nodeElement.dataset["nodeId"] as NodeId | undefined;
        if (!nodeId) return;
        const preview = missionPreviews[nodeId];
        if (!preview) return;
        const node = nodeById[nodeId];
        queryRequired<HTMLElement>("#preview-index").textContent = translateText(`MISSION ${node.index}`);
        queryRequired<HTMLElement>("#preview-title").textContent = translateText(node.detail.title);
        queryRequired<HTMLElement>("#preview-role").textContent = translateText(preview.role);
        const tech = queryRequired<HTMLElement>("#preview-tech");
        tech.hidden = false;
        tech.innerHTML = preview.technologies.map((technology) => `<span>${technology}</span>`).join("");
        queryRequired<HTMLElement>("#preview-outcome").textContent = translateText(preview.outcome);
        this.#preview.setAttribute("aria-hidden", "false");
      };
      const hide = (): void => this.#preview.setAttribute("aria-hidden", "true");
      nodeElement.addEventListener("pointerenter", show, { signal: this.#abort.signal });
      nodeElement.addEventListener("pointerleave", hide, { signal: this.#abort.signal });
      nodeElement.addEventListener("focus", show, { signal: this.#abort.signal });
      nodeElement.addEventListener("blur", hide, { signal: this.#abort.signal });
    });
  }

  #bindCategoryHubPreviews(): void {
    document.querySelectorAll<HTMLElement>(".category-hub[data-category-hub]").forEach((hubElement) => {
      const show = (): void => {
        const group = hubElement.dataset["categoryHub"] as MissionGroup | undefined;
        if (!group) return;
        const hub = categoryHubById[group];

        queryRequired<HTMLElement>("#preview-index").textContent = translateText("CATEGORY HUB");
        queryRequired<HTMLElement>("#preview-title").textContent = translateText(hub.label);
        queryRequired<HTMLElement>("#preview-role").textContent = translateText(`${hub.missionIds.length} MISSIONS`);
        const tech = queryRequired<HTMLElement>("#preview-tech");
        tech.replaceChildren();
        tech.hidden = true;
        queryRequired<HTMLElement>("#preview-outcome").textContent = translateText(categorySummaries[group]);
        this.#preview.setAttribute("aria-hidden", "false");
      };
      const hide = (): void => this.#preview.setAttribute("aria-hidden", "true");
      hubElement.addEventListener("pointerenter", show, { signal: this.#abort.signal });
      hubElement.addEventListener("pointerleave", hide, { signal: this.#abort.signal });
      hubElement.addEventListener("focus", show, { signal: this.#abort.signal });
      hubElement.addEventListener("blur", hide, { signal: this.#abort.signal });
    });
  }

  #bindMissionRailHighlights(): void {
    document.querySelectorAll<HTMLButtonElement>(".mission-button[data-mission-id]").forEach((button) => {
      const setHighlighted = (highlighted: boolean): void => {
        const nodeId = button.dataset["missionId"] as NodeId | undefined;
        if (!nodeId) return;

        button.classList.toggle("mission-hover", highlighted);
        const node = document.querySelector<HTMLElement>(`.node[data-node-id="${nodeId}"]`);
        node?.classList.toggle("mission-rail-hover", highlighted);
      };

      button.addEventListener("pointerenter", () => setHighlighted(true), { signal: this.#abort.signal });
      button.addEventListener("pointerleave", () => setHighlighted(false), { signal: this.#abort.signal });
      button.addEventListener("focus", () => setHighlighted(true), { signal: this.#abort.signal });
      button.addEventListener("blur", () => setHighlighted(false), { signal: this.#abort.signal });
    });
  }

  #bindCursor(): void {
    document.addEventListener("pointermove", (event) => {
      if (!this.#cursorEnabled) {
        this.#hideCursor();
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      const mission = target?.closest(".node[data-node-id]");
      const hub = target?.closest(".category-hub");
      const trace = target?.closest("[data-cursor='trace']");
      const caseStudy = target?.closest("[data-cursor='case']");
      const view = target?.closest("#view-toggle");
      const interactive = mission || hub || trace || caseStudy || view;

      if (!interactive) {
        this.#hideCursor();
        return;
      }

      const label = trace ? "TRACE" : caseStudy ? "OPEN" : view ? "MORPH" : hub ? "ENTER" : "VIEW";
      this.#pendingPointer = { x: event.clientX, y: event.clientY, label };
      if (this.#cursorFrame !== 0) return;
      this.#cursorFrame = requestAnimationFrame(() => {
        this.#cursorFrame = 0;
        const pending = this.#pendingPointer;
        if (!pending) return;

        this.#cursor.style.transform = `translate3d(${pending.x}px, ${pending.y}px, 0)`;
        if (!this.#cursorVisible) {
          this.#cursorVisible = true;
          this.#cursor.classList.add("visible");
        }
        this.#cursorLabel.textContent = translateText(pending.label);
      });
    }, { signal: this.#abort.signal, passive: true });
  }

  readonly #syncCursorCapability = (): void => {
    this.#cursorEnabled = supportsFinePointer();
    document.documentElement.classList.toggle("context-cursor-enabled", this.#cursorEnabled);
    if (!this.#cursorEnabled) this.#hideCursor();
  };

  #hideCursor(): void {
    this.#pendingPointer = null;
    if (!this.#cursorVisible) return;
    this.#cursorVisible = false;
    this.#cursor.classList.remove("visible");
  }

}
