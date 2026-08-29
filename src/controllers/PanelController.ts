import { gsap } from "../animations/gsap.js";
import { revealElements } from "../animations/motion.js";
import { clearElement, createElement, queryRequired, setInertVisibility } from "../core/dom.js";
import { prefersReducedMotion } from "../core/media.js";
import { connectedCategoryRouteIds, connectedRouteIds, nodeById } from "../data/portfolio.js";
import { caseStudies } from "../data/experience.js";
import { nodeEvidenceMetaById, resumeRouteByNodeId, resumeRouteLabelByNodeId } from "../data/routes.js";
import { projectPresentationMetaById } from "../data/projectPresentation.js";
import type { MissionGroup, NodeId } from "../domain/types.js";
import { renderDetailBlock } from "../render/detailBlocks.js";
import type { ExpeditionStore } from "../state/ExpeditionStore.js";

export class PanelController {
  readonly #abort = new AbortController();
  readonly #panel = queryRequired<HTMLElement>("#detail-panel");
  readonly #content = queryRequired<HTMLElement>("#panel-content");
  readonly #progress = queryRequired<HTMLElement>("#panel-progress");
  #transitionGeneration = 0;

  constructor(
    private readonly store: ExpeditionStore,
    private readonly onOpenLayers: () => void,
    private readonly onRestoreWorldControl: () => void,
    private readonly onTraceSignal?: (nodeId: NodeId) => void,
    private readonly onCaseStudy?: (nodeId: NodeId) => void,
    private readonly onReadingStateChange?: (open: boolean) => void,
    private readonly onResumeNavigate?: () => void,
  ) {
    queryRequired<HTMLButtonElement>("#panel-close").addEventListener("click", () => this.close(), { signal: this.#abort.signal });
    this.#content.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-action]") : null;
      if (target?.dataset["action"] === "open-layers") this.onOpenLayers();
      if (target?.dataset["action"] === "trace-signal") {
        const nodeId = this.store.state.openNode;
        if (nodeId) this.onTraceSignal?.(nodeId);
      }
      if (target?.dataset["action"] === "case-study") {
        const nodeId = this.store.state.openNode;
        if (nodeId) this.onCaseStudy?.(nodeId);
      }
    }, { signal: this.#abort.signal });
  }

  open(nodeId: NodeId, focusClose = true, onTypingComplete?: () => void): void {
    this.#transitionGeneration += 1;
    this.#renderOpen(nodeId, focusClose, onTypingComplete);
  }

  switchTo(nodeId: NodeId, focusClose = true, onTypingComplete?: () => void): void {
    const currentNode = this.store.state.openNode;
    if (!currentNode || currentNode === nodeId) {
      this.open(nodeId, focusClose, onTypingComplete);
      return;
    }

    const generation = ++this.#transitionGeneration;
    this.store.state.openNode = null;
    delete this.#panel.dataset["nodeId"];
    gsap.killTweensOf(this.#panel);
    gsap.killTweensOf(this.#progress);
    gsap.to(this.#progress, { width: 0, duration: 0.16, overwrite: true });

    const openReplacement = (): void => {
      if (generation !== this.#transitionGeneration) return;
      this.#renderOpen(nodeId, focusClose, onTypingComplete);
    };

    if (prefersReducedMotion()) {
      gsap.set(this.#panel, { xPercent: 105 });
      openReplacement();
      return;
    }

    gsap.to(this.#panel, {
      xPercent: 105,
      duration: 0.24,
      ease: "power2.in",
      overwrite: true,
      onComplete: openReplacement,
    });
  }

  #renderOpen(nodeId: NodeId, focusClose = true, onTypingComplete?: () => void): void {
    const node = nodeById[nodeId];
    this.store.state.openNode = nodeId;
    document.body.classList.add("panel-reading");
    this.onReadingStateChange?.(true);
    this.#panel.dataset["nodeId"] = nodeId;
    this.#panel.classList.add("is-open");
    setInertVisibility(this.#panel, true);
    this.#panel.style.pointerEvents = "auto";
    this.#panel.scrollTop = 0;
    clearElement(this.#content);

    this.#content.append(
      createElement("span", "panel-kicker", node.detail.kicker),
      createElement("h2", undefined, node.detail.title),
      createElement("p", "panel-lede", node.detail.lede),
    );

    const presentationMeta = projectPresentationMetaById[nodeId];
    if (presentationMeta) {
      const roleBadges = createElement("div", "panel-role-badges");
      for (const badge of presentationMeta.badges) roleBadges.append(createElement("span", undefined, badge));

      const impactStrip = createElement("div", "panel-impact-strip");
      for (const [label, value] of [
        ["ROLE", presentationMeta.role],
        ["TEAM", presentationMeta.team],
        ["PERIOD", presentationMeta.period],
        ["STATUS", presentationMeta.status],
        ["IMPACT", presentationMeta.impact],
      ] as const) {
        const item = createElement("div");
        item.append(createElement("span", undefined, label), createElement("b", undefined, value));
        impactStrip.append(item);
      }
      this.#content.append(roleBadges, impactStrip);
    }

    if (!presentationMeta) {
      const evidenceMeta = nodeEvidenceMetaById[nodeId];
      const evidenceStrip = createElement("div", "panel-evidence-meta");
      for (const [label, value] of [["CONTEXT", evidenceMeta.context], ["OWNERSHIP", evidenceMeta.ownership], ["STATUS", evidenceMeta.status], ["SOURCE", evidenceMeta.source]] as const) {
        const item = createElement("div");
        item.append(createElement("span", undefined, label), createElement("b", undefined, value));
        evidenceStrip.append(item);
      }
      this.#content.append(evidenceStrip);
    }

    const duplicatePresentationLabels = new Set(["ROLE", "CURRENT ROLE", "TEAM", "PERIOD", "STATUS", "STATE", "IMPACT"]);
    const visibleStats = presentationMeta
      ? node.detail.stats.filter((stat) => !duplicatePresentationLabels.has(stat.label.trim().toUpperCase()))
      : node.detail.stats;
    if (visibleStats.length > 0) {
      const stats = createElement("div", "panel-stats");
      for (const stat of visibleStats) {
        const card = createElement("div");
        card.append(createElement("span", undefined, stat.label), createElement("b", undefined, stat.value));
        stats.append(card);
      }
      this.#content.append(stats);
    }

    const hasTrace = nodeId === "ilac";
    const hasCaseStudy = caseStudies[nodeId] !== undefined;
    const actions = createElement("div", "panel-v11-actions");

    if (hasCaseStudy) {
      const caseButton = createElement("button", "panel-v11-action", "OPEN ENGINEERING STUDY");
      caseButton.dataset["action"] = "case-study";
      caseButton.dataset["cursor"] = "case";
      caseButton.setAttribute("type", "button");
      actions.append(caseButton);
    }

    const resumeLink = createElement("a", "panel-v11-action primary-link panel-resume-link", resumeRouteLabelByNodeId[nodeId]);
    resumeLink.href = resumeRouteByNodeId[nodeId];
    resumeLink.addEventListener("click", () => this.onResumeNavigate?.(), { signal: this.#abort.signal });
    actions.append(resumeLink);

    if (hasTrace) {
      const traceButton = createElement("button", `panel-v11-action${hasCaseStudy ? " secondary" : ""}`, "TRACE SIGNAL");
      traceButton.dataset["action"] = "trace-signal";
      traceButton.dataset["cursor"] = "trace";
      traceButton.setAttribute("type", "button");
      actions.append(traceButton);
    }

    this.#content.append(actions);

    for (const block of node.detail.blocks) this.#content.append(renderDetailBlock(block));

    this.#setActiveMission(nodeId);
    this.highlightRoutes(nodeId);
    gsap.killTweensOf(this.#panel);
    if (prefersReducedMotion()) gsap.set(this.#panel, { xPercent: 0 });
    else gsap.to(this.#panel, { xPercent: 0, duration: 0.62, ease: "power4.out" });
    gsap.fromTo(this.#progress, { width: 0 }, { width: "100%", duration: 0.85, ease: "power2.out" });

    const revealTargets = Array.from(
      this.#content.querySelectorAll<HTMLElement>(".panel-kicker, h2, .panel-lede, .panel-role-badges span, .panel-impact-strip > div, .panel-stats > div, .panel-section, .tags span, .panel-link"),
    );
    revealElements(revealTargets);
    // Mission content is intentionally rendered in full. Do not progressively generate
    // text or auto-scroll the panel as content appears.
    this.#content.classList.remove("is-typing");
    this.#content.removeAttribute("aria-busy");
    queueMicrotask(() => onTypingComplete?.());
    if (focusClose) requestAnimationFrame(() => queryRequired<HTMLButtonElement>("#panel-close").focus({ preventScroll: true }));
  }

  close(restoreWorldControl = true): void {
    this.#transitionGeneration += 1;
    this.store.state.openNode = null;
    document.body.classList.remove("panel-reading");
    this.onReadingStateChange?.(false);
    delete this.#panel.dataset["nodeId"];
    this.#panel.classList.remove("is-open");
    setInertVisibility(this.#panel, false);
    this.#panel.style.pointerEvents = "none";
    gsap.to(this.#progress, { width: 0, duration: 0.2, overwrite: true });
    if (prefersReducedMotion()) gsap.set(this.#panel, { xPercent: 105 });
    else gsap.to(this.#panel, { xPercent: 105, duration: 0.42, ease: "power3.inOut" });
    if (restoreWorldControl) this.onRestoreWorldControl();
  }

  highlightRoutes(nodeId: NodeId): void {
    const activeRouteIds = new Set(connectedRouteIds(nodeId));
    document.querySelectorAll<SVGPathElement>(".route").forEach((route) => {
      route.classList.toggle("active", activeRouteIds.has(route.dataset["route"] ?? ""));
    });
  }

  highlightCategoryRoutes(group: MissionGroup): void {
    const activeRouteIds = new Set(connectedCategoryRouteIds(group));
    document.querySelectorAll<SVGPathElement>(".route").forEach((route) => {
      route.classList.toggle("active", activeRouteIds.has(route.dataset["route"] ?? ""));
    });
  }

  destroy(): void {
    this.#abort.abort();
    gsap.killTweensOf(this.#panel);
    gsap.killTweensOf(this.#progress);
  }

  #setActiveMission(nodeId: NodeId): void {
    document.querySelectorAll<HTMLButtonElement>(".mission-button").forEach((button) => {
      const isActive = button.dataset["missionId"] === nodeId;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
  }
}
