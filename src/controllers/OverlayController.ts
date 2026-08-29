import { gsap } from "../animations/gsap.js";
import { revealElements } from "../animations/motion.js";
import { canReceiveProgrammaticFocus, queryRequired, setInertVisibility } from "../core/dom.js";
import { translateText } from "../core/language.js";
import { prefersReducedMotion } from "../core/media.js";

export class OverlayController {
  readonly #missionRail = queryRequired<HTMLElement>("#mission-rail");
  readonly #help = queryRequired<HTMLElement>("#help-modal");
  readonly #contact = queryRequired<HTMLElement>("#contact-modal");
  readonly #minimapDock = queryRequired<HTMLElement>("#minimap-dock");
  readonly #minimap = queryRequired<HTMLElement>("#minimap");
  readonly #minimapToggle = queryRequired<HTMLButtonElement>("#minimap-toggle");
  #missionsOpen = false;
  #minimapOpen = false;
  #missionsPreviousFocus: HTMLElement | null = null;
  #helpPreviousFocus: HTMLElement | null = null;
  #contactPreviousFocus: HTMLElement | null = null;

  constructor() {
    gsap.set(this.#missionRail, { xPercent: -105 });
    this.#missionRail.inert = true;
    this.#help.inert = true;
    this.#contact.inert = true;
    this.#minimap.inert = true;
    this.#missionRail.setAttribute("aria-hidden", "true");
    this.#missionRail.style.pointerEvents = "none";
  }

  toggleMissions(): void {
    if (this.#missionsOpen) this.closeMissions();
    else this.openMissions();
  }

  openMissions(): void {
    this.#missionsOpen = true;
    this.#missionsPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    gsap.killTweensOf(this.#missionRail);
    setInertVisibility(this.#missionRail, true);
    this.#missionRail.classList.add("is-open");
    this.#missionRail.style.pointerEvents = "auto";
    if (prefersReducedMotion()) gsap.set(this.#missionRail, { xPercent: 0, opacity: 1 });
    else gsap.to(this.#missionRail, { xPercent: 0, opacity: 1, duration: 0.48, ease: "power4.out", overwrite: true });
    revealElements(Array.from(this.#missionRail.querySelectorAll<HTMLElement>(".mission-button")));
    requestAnimationFrame(() => this.focusActiveMission());
  }

  closeMissions(restoreFocus = false): void {
    if (!this.#missionsOpen && this.#missionRail.getAttribute("aria-hidden") === "true") return;
    this.#missionsOpen = false;
    const fallback = restoreFocus && canReceiveProgrammaticFocus(this.#missionsPreviousFocus)
      ? this.#missionsPreviousFocus
      : queryRequired<HTMLButtonElement>("#missions-toggle");
    setInertVisibility(this.#missionRail, false, fallback);
    this.#missionRail.classList.remove("is-open");
    this.#missionRail.style.pointerEvents = "none";
    gsap.killTweensOf(this.#missionRail);
    if (prefersReducedMotion()) gsap.set(this.#missionRail, { xPercent: -105, opacity: 1 });
    else gsap.to(this.#missionRail, { xPercent: -105, opacity: 1, duration: 0.36, ease: "power3.inOut", overwrite: true });
    this.#missionsPreviousFocus = null;
  }

  isMissionsOpen(): boolean {
    return this.#missionsOpen;
  }

  focusActiveMission(): void {
    const buttons = this.#missionButtons();
    if (buttons.length === 0) return;
    const active = buttons.find((button) => button.classList.contains("active")) ?? buttons[0];
    active?.focus({ preventScroll: true });
    active?.scrollIntoView({ block: "nearest" });
  }

  moveMissionFocus(direction: 1 | -1): void {
    const buttons = this.#missionButtons();
    if (buttons.length === 0) return;
    const activeElement = document.activeElement;
    const currentIndex = buttons.findIndex((button) => button === activeElement);
    const fallbackIndex = buttons.findIndex((button) => button.classList.contains("active"));
    const startIndex = currentIndex >= 0 ? currentIndex : Math.max(fallbackIndex, 0);
    const nextIndex = (startIndex + direction + buttons.length) % buttons.length;
    const nextButton = buttons[nextIndex];
    nextButton?.focus({ preventScroll: true });
    nextButton?.scrollIntoView({ block: "nearest" });
  }

  focusMissionBoundary(boundary: "first" | "last"): void {
    const buttons = this.#missionButtons();
    const target = boundary === "first" ? buttons[0] : buttons[buttons.length - 1];
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "nearest" });
  }

  #missionButtons(): HTMLButtonElement[] {
    return Array.from(this.#missionRail.querySelectorAll<HTMLButtonElement>(".mission-button"));
  }

  toggleMinimap(): void {
    this.#minimapOpen = !this.#minimapOpen;
    this.#minimapDock.classList.toggle("expanded", this.#minimapOpen);
    setInertVisibility(this.#minimap, this.#minimapOpen, this.#minimapToggle);
    this.#minimapToggle.setAttribute("aria-expanded", String(this.#minimapOpen));
    this.#minimapToggle.setAttribute("aria-label", translateText(this.#minimapOpen ? "Minimize network map" : "Expand network map"));
  }

  collapseMinimap(): void {
    if (!this.#minimapOpen) return;
    this.#minimapOpen = false;
    this.#minimapDock.classList.remove("expanded");
    setInertVisibility(this.#minimap, false, this.#minimapToggle);
    this.#minimapToggle.setAttribute("aria-expanded", "false");
    this.#minimapToggle.setAttribute("aria-label", translateText("Expand network map"));
  }

  isContactOpen(): boolean {
    return this.#contact.getAttribute("aria-hidden") === "false";
  }

  openContact(): void {
    this.#contactPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setInertVisibility(this.#contact, true);
    this.#contact.style.pointerEvents = "auto";
    if (prefersReducedMotion()) gsap.set(this.#contact, { opacity: 1 });
    else gsap.to(this.#contact, { opacity: 1, duration: 0.3, overwrite: true });
    revealElements(Array.from(this.#contact.querySelectorAll<HTMLElement>(".contact-panel-grid > article")));
    requestAnimationFrame(() => this.#contact.querySelector<HTMLButtonElement>("#contact-close")?.focus({ preventScroll: true }));
  }

  closeContact(restoreFocus = false): void {
    if (!this.isContactOpen()) return;
    const focusTarget = restoreFocus && canReceiveProgrammaticFocus(this.#contactPreviousFocus) ? this.#contactPreviousFocus : null;
    setInertVisibility(this.#contact, false, focusTarget);
    this.#contact.style.pointerEvents = "none";
    if (prefersReducedMotion()) gsap.set(this.#contact, { opacity: 0 });
    else gsap.to(this.#contact, { opacity: 0, duration: 0.24, overwrite: true });
    this.#contactPreviousFocus = null;
  }

  isHelpOpen(): boolean {
    return this.#help.getAttribute("aria-hidden") === "false";
  }

  toggleHelp(): boolean {
    if (this.isHelpOpen()) {
      this.closeHelp(true);
      return false;
    }
    this.openHelp();
    return true;
  }

  openHelp(): void {
    this.#helpPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setInertVisibility(this.#help, true);
    this.#help.style.pointerEvents = "auto";
    if (prefersReducedMotion()) gsap.set(this.#help, { opacity: 1 });
    else gsap.to(this.#help, { opacity: 1, duration: 0.3, overwrite: true });
    revealElements(Array.from(this.#help.querySelectorAll<HTMLElement>(".help-grid > div")));
    requestAnimationFrame(() => this.#help.querySelector<HTMLButtonElement>("#help-close")?.focus({ preventScroll: true }));
  }

  closeHelp(restoreFocus = false): void {
    if (!this.isHelpOpen()) return;
    const focusTarget = restoreFocus && canReceiveProgrammaticFocus(this.#helpPreviousFocus) ? this.#helpPreviousFocus : null;
    setInertVisibility(this.#help, false, focusTarget);
    this.#help.style.pointerEvents = "none";
    if (prefersReducedMotion()) gsap.set(this.#help, { opacity: 0 });
    else gsap.to(this.#help, { opacity: 0, duration: 0.24, overwrite: true });
    this.#helpPreviousFocus = null;
  }
}
