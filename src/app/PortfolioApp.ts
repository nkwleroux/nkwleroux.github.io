import { gsap } from "../animations/gsap.js";
import { installHoverMotion, revealNodes } from "../animations/motion.js";
import { canReceiveProgrammaticFocus, isInteractiveTarget, isTextEntryTarget, queryRequired, setInertVisibility } from "../core/dom.js";
import { mobileNavigationQuery, prefersReducedMotion, responsiveMode } from "../core/media.js";
import { installThemeControls } from "../core/theme.js";
import { currentLanguage, installLanguageControls, translate, translateText } from "../core/language.js";
import { categoryHubById, isMissionGroup, isNodeId, nodeById } from "../data/portfolio.js";
import { recruiterSummaries, recruiterTour } from "../data/experience.js";
import type { MissionGroup, NodeId } from "../domain/types.js";
import { LayerInspectorController } from "../controllers/LayerInspectorController.js";
import { OverlayController } from "../controllers/OverlayController.js";
import { PanelController } from "../controllers/PanelController.js";
import { ConstellationField } from "../controllers/ConstellationField.js";
import { WorldController } from "../controllers/WorldController.js";
import { WorldLayoutController } from "../controllers/WorldLayoutController.js";
import { SignalTraceController } from "../controllers/SignalTraceController.js";
import { CaseStudyController } from "../controllers/CaseStudyController.js";
import { InteractionPolishController } from "../controllers/InteractionPolishController.js";
import { SettingsController } from "../controllers/SettingsController.js";
import { CommandPaletteController } from "../controllers/CommandPaletteController.js";
import { renderAppShell } from "../render/appShell.js";
import {
  consumeReturnMarker,
  loadExpeditionSnapshot,
  markReturnToExpedition,
  saveExpeditionSnapshot,
  shouldRestoreExpedition,
  type ExpeditionSnapshot,
} from "../state/ExpeditionSession.js";
import { ExpeditionStore } from "../state/ExpeditionStore.js";

interface KillableAnimation {
  kill(): void;
  pause?(): void;
  resume?(): void;
}

type HeaderSurface = "missions" | "help" | "contact" | "settings" | "layers" | "tour" | "view";

// Keep the reading window independent from camera/motion preferences.
const TOUR_PANEL_DWELL_MS = 5200;

export class PortfolioApp {
  readonly #abort = new AbortController();
  readonly #store: ExpeditionStore;
  readonly #constellation: ConstellationField;
  readonly #layers: LayerInspectorController;
  readonly #overlays: OverlayController;
  readonly #panel: PanelController;
  readonly #world: WorldController;
  readonly #layout: WorldLayoutController;
  readonly #trace: SignalTraceController;
  readonly #caseStudies: CaseStudyController;
  readonly #polish: InteractionPolishController;
  readonly #settings: SettingsController;
  readonly #commands: CommandPaletteController;
  readonly #motionCleanups: (() => void)[];
  readonly #themeCleanup: () => void;
  readonly #languageCleanup: () => void;
  readonly #boot: HTMLElement;
  readonly #loader: HTMLElement;
  readonly #landingExperience: HTMLElement;
  readonly #gsapAnimations: KillableAnimation[] = [];
  #tourGeneration = 0;
  #lastNodeActivator: HTMLElement | null = null;
  #tourTimer: number | null = null;
  #recruiterTourActive = false;
  #tourIndex = 0;
  #tourRemainingMs = TOUR_PANEL_DWELL_MS;
  #tourDwellStartedAt = 0;
  #tourPhase: "idle" | "travel" | "dwell" = "idle";
  #tourPausedForSettings = false;
  #responsiveFrameId = 0;
  #responsiveSettleFrameId = 0;
  #responsiveModeTimerId: number | null = null;
  #navigationMode: "mobile" | "desktop" | null = null;
  #tabNavigationPending = false;

  constructor(private readonly root: HTMLElement) {
    const restoring = shouldRestoreExpedition();
    const snapshot = restoring ? loadExpeditionSnapshot() : null;
    const deepLink = this.#resolveDeepLink();
    this.#store = new ExpeditionStore(nodeById.profile.position, deepLink ? null : snapshot);

    this.root.innerHTML = renderAppShell();
    this.#boot = queryRequired<HTMLElement>("#boot");
    this.#loader = queryRequired<HTMLElement>("#signal-loader");
    this.#landingExperience = queryRequired<HTMLElement>("#landing-experience");
    this.#layers = new LayerInspectorController();
    this.#overlays = new OverlayController();
    this.#trace = new SignalTraceController();
    this.#caseStudies = new CaseStudyController((traceId) => {
      this.#overlays.collapseMinimap();
      this.#caseStudies.close();
      this.#trace.open(traceId);
    });
    this.#panel = new PanelController(
      this.#store,
      () => this.openLayers(),
      () => this.#restoreInteractionFocus(),
      (nodeId) => {
        this.#overlays.collapseMinimap();
        if (nodeId === "ilac") this.#trace.open(nodeId);
      },
      (nodeId) => {
        this.#overlays.collapseMinimap();
        this.#caseStudies.open(nodeId);
      },
      (reading) => {
        if (reading) this.#pauseAmbientMotion();
        else this.#resumeAmbientMotion();
      },
      () => {
        this.persistSession();
        markReturnToExpedition();
      },
    );
    this.#world = new WorldController({
      store: this.#store,
      onInspect: (nodeId) => this.#activateNode(nodeId, false),
      onHighlight: (nodeId) => this.#panel.highlightRoutes(nodeId),
    });
    this.#layout = new WorldLayoutController(this.#world);
    this.#polish = new InteractionPolishController();
    this.#constellation = new ConstellationField();
    this.#constellation.start();
    this.#settings = new SettingsController(
      () => {
        this.#world.refreshMotionPreferences();
        this.#layout.refreshView();
        this.#constellation.refreshViewportBounds();
        requestAnimationFrame(() => this.#layout.refreshView());
      },
      () => this.#handleSettingsClosed(),
    );
    this.#commands = new CommandPaletteController([
      { id: "go-ilac", label: "Go to ILAC", hint: "Open the ILAC mission in the constellation", keywords: ["project", "protocol", "lon"], run: () => this.#activateNode("ilac") },
      { id: "open-resume", label: "Open Resume", hint: "Open the conventional resume", keywords: ["cv", "pdf"], run: () => { this.persistSession(); markReturnToExpedition(); window.location.href = "/resume.html"; } },
      { id: "show-cpp", label: "Show C++ projects", hint: "Open the capability evidence for C++ work", keywords: ["cpp", "embedded", "skills"], run: () => this.#activateNode("skills") },
      { id: "contact", label: "Contact Nicholas", hint: "Open the direct contact channel", keywords: ["email", "linkedin"], run: () => { if (!this.#overlays.isContactOpen()) this.#toggleContact(); } },
      { id: "language", label: "Switch language", hint: "Cycle English, Spanish, and Dutch", keywords: ["en", "es", "nl"], run: () => this.#cycleLanguage() },
      { id: "fit-map", label: "Fit map", hint: "Fit the complete authored world into view", keywords: ["zoom", "world"], run: () => this.#enterNetwork(undefined, () => { this.#world.fitMap(); this.#world.focusViewport(); }) },
      { id: "settings", label: "Open Settings", hint: "Performance and accessibility modes", keywords: ["performance", "accessibility", "motion"], run: () => this.#toggleSettings() },
    ]);
    this.#motionCleanups = installHoverMotion();
    this.#themeCleanup = installThemeControls();
    this.#languageCleanup = installLanguageControls();
    this.#bindEvents();
    this.#initAnimations(deepLink);

    if (snapshot?.started && !deepLink) this.#restoreSession(snapshot);
    if (restoring) consumeReturnMarker();
  }

  #prepareHeaderSurface(target: HeaderSurface, preserveTour = false): void {
    if (!preserveTour) this.#cancelGuidedTour();
    this.#clearNodeRoute();
    this.#overlays.collapseMinimap();
    if (target !== "missions") this.#overlays.closeMissions();
    if (target !== "help") this.#overlays.closeHelp();
    if (target !== "contact") this.#overlays.closeContact();
    if (target !== "settings") this.#settings.close(false, false);
    if (target !== "layers") this.#layers.close();
    this.#panel.close(false);
    this.#trace.close();
    this.#caseStudies.close();
    this.#layout.exitFocus();
  }

  openLayers(): void {
    this.#prepareHeaderSurface("layers");
    this.#world.setMovementEnabled(false);
    this.#layers.open();
  }

  #toggleHelp(): void {
    if (this.#overlays.isHelpOpen()) {
      this.#overlays.closeHelp();
      this.#world.resumeManualControl();
      return;
    }
    this.#prepareHeaderSurface("help");
    this.#world.setMovementEnabled(false);
    this.#overlays.openHelp();
  }

  #toggleContact(): void {
    if (this.#overlays.isContactOpen()) {
      this.#overlays.closeContact();
      this.#world.resumeManualControl();
      return;
    }
    this.#prepareHeaderSurface("contact");
    this.#world.setMovementEnabled(false);
    this.#overlays.openContact();
  }

  #toggleSettings(): void {
    if (this.#settings.isOpen()) {
      this.#settings.close();
      return;
    }
    const preservingTour = this.#pauseRecruiterTourForSettings();
    this.#prepareHeaderSurface("settings", preservingTour);
    this.#world.setMovementEnabled(false);
    this.#settings.open();
  }

  #handleSettingsClosed(): void {
    if (this.#tourPausedForSettings) {
      this.#resumeRecruiterTourAfterSettings();
      return;
    }
    if (this.#store.state.started) this.#world.resumeManualControl();
  }

  #cycleLanguage(): void {
    const order = ["en", "es", "nl"] as const;
    const current = currentLanguage();
    const index = order.indexOf(current);
    const next = order[(index + 1) % order.length] ?? "en";
    const select = document.querySelector<HTMLSelectElement>("[data-language-select]");
    if (!select) return;
    select.value = next;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  #resolveDeepLink(): NodeId | null {
    const params = new URLSearchParams(window.location.search);
    const mission = params.get("mission");
    if (isNodeId(mission ?? undefined)) return mission as NodeId;
    const skill = params.get("skill");
    if (skill && skill.trim().length > 0) return "skills";
    return null;
  }

  #closeMobileMenu(): void {
    const toggle = queryRequired<HTMLButtonElement>("#hud-menu-toggle");
    const menu = queryRequired<HTMLElement>("#hud-mobile-menu");
    menu.classList.remove("open");
    setInertVisibility(menu, false, toggle);
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", translateText("Open portfolio menu"));
  }

  #scheduleResponsiveModeSync(force = false, scheduleSettledRecheck = true): void {
    const nextMode = responsiveMode();
    const changed = this.#navigationMode !== nextMode;
    if (changed || force) {
      this.#navigationMode = nextMode;
      document.documentElement.dataset["navigationMode"] = nextMode;
      document.body.classList.toggle("mobile-navigation-mode", nextMode === "mobile");
      document.body.classList.toggle("desktop-navigation-mode", nextMode === "desktop");

      const viewport = queryRequired<HTMLElement>("#viewport");
      viewport.setAttribute("aria-hidden", "false");

      if (nextMode === "desktop") this.#closeMobileMenu();
    }

    // Mobile and laptop/desktop use the same authored world. Keep its controller
    // active while capability changes only adapt the HUD, pointer feedback, and
    // full-screen reading surfaces.
    this.#world.setViewportActive(true);

    cancelAnimationFrame(this.#responsiveFrameId);
    this.#responsiveFrameId = requestAnimationFrame(() => {
      this.#responsiveFrameId = 0;
      this.#refreshResponsiveGeometry();
    });

    // Chrome applies Device Toolbar metrics and touch/pointer emulation in
    // separate steps. The resize can therefore arrive just before the pointer
    // media query changes. Re-check once after that short settling window so
    // mode changes do not depend on a reload or on which DevTools step ran first.
    if (scheduleSettledRecheck) {
      if (this.#responsiveModeTimerId !== null) window.clearTimeout(this.#responsiveModeTimerId);
      this.#responsiveModeTimerId = window.setTimeout(() => {
        this.#responsiveModeTimerId = null;
        const modeChangedWhileSettling = this.#navigationMode !== responsiveMode();
        this.#scheduleResponsiveModeSync(modeChangedWhileSettling, false);
      }, 140);
    }
  }

  #refreshResponsiveGeometry(): void {
    // Chrome can apply emulated dimensions and input capabilities in separate
    // steps. Refresh immediately and once more on the next frame so the shared
    // world and constellation always use the final live viewport geometry.
    this.#world.refreshViewportBounds();
    this.#layout.refreshView();
    this.#constellation.refreshViewportBounds();
    cancelAnimationFrame(this.#responsiveSettleFrameId);
    this.#responsiveSettleFrameId = requestAnimationFrame(() => {
      this.#responsiveSettleFrameId = 0;
      this.#world.refreshViewportBounds();
      this.#layout.refreshView();
      this.#constellation.refreshViewportBounds();
    });
  }

  #restoreInteractionFocus(): void {
    this.#world.resumeManualControl();
    requestAnimationFrame(() => {
      if (canReceiveProgrammaticFocus(this.#lastNodeActivator)) {
        this.#lastNodeActivator.focus({ preventScroll: true });
        return;
      }
      this.#world.focusViewport();
    });
  }

  persistSession(): void {
    const panelScrollTop = queryRequired<HTMLElement>("#detail-panel").scrollTop;
    saveExpeditionSnapshot(this.#store.state, panelScrollTop);
  }

  #closeLayers(): void {
    this.#layers.close();
    this.#world.resumeManualControl();
  }

  #activateNode(nodeId: NodeId, moveCamera = true, preserveMissionFocus = false, fromTour = false, syncHistory = true): void {
    if (!fromTour) this.#cancelGuidedTour();
    if (!this.#store.state.started) {
      this.#enterNetwork(nodeId);
      return;
    }

    this.#overlays.collapseMinimap();
    this.#overlays.closeMissions();
    this.#overlays.closeHelp();
    this.#overlays.closeContact();
    this.#settings.close(false);
    this.#commands.close(false);
    this.#layers.close();
    this.#trace.close();
    this.#caseStudies.close();
    this.#world.setMovementEnabled(true);
    this.#polish.pulseNode(nodeId);
    this.#panel.switchTo(nodeId, !preserveMissionFocus);
    if (syncHistory) this.#pushNodeRoute(nodeId);
    if (moveCamera) this.#world.autopilot(nodeId, false);
  }

  #enterNetwork(destination?: NodeId, onEntered?: () => void): void {
    if (this.#store.state.started) {
      if (onEntered) onEntered();
      else if (destination) this.#activateNode(destination);
      return;
    }

    this.#world.setStarted(true);
    document.body.classList.add("network-started");
    const finish = (): void => {
      this.#landingExperience.hidden = true;
      this.#landingExperience.style.pointerEvents = "none";
      this.#scheduleResponsiveModeSync(true);
      this.#world.renderPosition();
      this.persistSession();
      if (onEntered) onEntered();
      else if (destination) this.#activateNode(destination);
      else this.#world.focusViewport();
    };

    if (prefersReducedMotion()) {
      finish();
      return;
    }

    const launch = gsap.timeline({ onComplete: finish });
    launch
      .to(".classic-landing-core, .classic-landing-route, .classic-ready-copy", { opacity: 0, scale: 0.985, duration: 0.32, ease: "power2.in" }, 0)
      .to(".classic-landing-header", { opacity: 0, y: -8, duration: 0.24, ease: "power2.in" }, 0.03)
      .fromTo(".viewport", { opacity: 0.42, scale: 1.025 }, { opacity: 1, scale: 1, duration: 0.68, ease: "power2.out" }, 0.16)
      .to(this.#landingExperience, { opacity: 0, duration: 0.4, ease: "power2.inOut" }, 0.28);
    this.#trackAnimation(launch);
    revealNodes();
  }

  #restoreSession(snapshot: ExpeditionSnapshot): void {
    this.#landingExperience.hidden = true;
    this.#landingExperience.style.pointerEvents = "none";
    this.#boot.style.pointerEvents = "none";
    this.#world.setStarted(true);
    document.body.classList.add("network-started");
    this.#scheduleResponsiveModeSync(true);
    this.#world.renderPosition();
    this.#world.detectProximity();
    revealNodes();

    if (snapshot.openNode) {
      this.#panel.open(snapshot.openNode);
      requestAnimationFrame(() => {
        queryRequired<HTMLElement>("#detail-panel").scrollTop = snapshot.panelScrollTop;
      });
    }

    if (new URLSearchParams(window.location.search).has("restore")) {
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.hash}`);
    }
  }

  #bindDestinationButton(element: HTMLElement, datasetKey: "nodeId" | "missionId"): void {
    const isMissionButton = datasetKey === "missionId";
    let pointerStart: { pointerId: number; pointerType: string; x: number; y: number } | null = null;
    let suppressClick = false;
    const activate = (): void => {
      this.#lastNodeActivator = element;
      const candidate = element.dataset[datasetKey];
      if (!isNodeId(candidate)) return;
      if (this.#store.state.openNode === candidate) {
        this.#cancelGuidedTour();
        this.#panel.close();
        this.#clearNodeRoute();
        return;
      }
      this.#activateNode(candidate, true, isMissionButton);
    };

    // A transformed map can lose the browser-generated click after pointer capture,
    // wheel zoom, or a tiny amount of camera movement. Treat every short primary-pointer
    // release as the activation and retain click only as the keyboard/synthetic fallback.
    element.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      pointerStart = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        x: event.clientX,
        y: event.clientY,
      };
      if (event.pointerType !== "mouse") {
        try { element.setPointerCapture(event.pointerId); } catch { /* capture is best-effort */ }
      }
    }, { signal: this.#abort.signal });
    element.addEventListener("pointerup", (event) => {
      const start = pointerStart;
      pointerStart = null;
      if (!start || start.pointerId !== event.pointerId || !event.isPrimary) return;
      const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      if (start.pointerType !== "mouse") {
        try { element.releasePointerCapture(event.pointerId); } catch { /* capture may already be released */ }
      }
      const movementTolerance = start.pointerType === "mouse" ? 8 : 18;
      if (moved > movementTolerance) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = true;
      activate();
      window.setTimeout(() => { suppressClick = false; }, 450);
    }, { signal: this.#abort.signal });
    element.addEventListener("pointercancel", () => { pointerStart = null; }, { signal: this.#abort.signal });

    element.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (suppressClick) return;
      activate();
    }, { signal: this.#abort.signal });

    element.addEventListener("keydown", (event) => {
      if (isMissionButton && (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End")) {
        event.preventDefault();
        event.stopPropagation();
        if (event.key === "ArrowDown") this.#overlays.moveMissionFocus(1);
        else if (event.key === "ArrowUp") this.#overlays.moveMissionFocus(-1);
        else this.#overlays.focusMissionBoundary(event.key === "Home" ? "first" : "last");
        return;
      }

      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      activate();
    }, { signal: this.#abort.signal });
  }

  #activateCategoryHub(group: MissionGroup, fromTour = false, onComplete?: () => void): void {
    if (!fromTour) this.#cancelGuidedTour();

    const travel = (): void => {
      this.#clearNodeRoute();
      this.#overlays.collapseMinimap();
      this.#overlays.closeMissions();
      this.#overlays.closeHelp();
      this.#overlays.closeContact();
      this.#layers.close();
      this.#trace.close();
      this.#caseStudies.close();
      this.#panel.close(false);
      this.#world.setMovementEnabled(false);
      this.#panel.highlightCategoryRoutes(group);

      if (fromTour) {
        this.#world.autopilotCategory(group, onComplete);
        return;
      }

      const hub = categoryHubById[group];
      if (hub.missionIds.length > 1) {
        this.#layout.focusCategory(group, onComplete);
      } else {
        this.#world.autopilotCategory(group, () => {
          this.#world.resumeManualControl();
          onComplete?.();
        });
      }
    };

    if (!this.#store.state.started) {
      this.#enterNetwork(undefined, travel);
      return;
    }

    travel();
  }

  #bindCategoryHubButton(element: HTMLElement): void {
    let touchStart: { pointerId: number; x: number; y: number } | null = null;
    let suppressClick = false;
    const activate = (): void => {
      this.#lastNodeActivator = element;
      const candidate = element.dataset["categoryHub"];
      if (isMissionGroup(candidate)) this.#activateCategoryHub(candidate);
    };

    element.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      touchStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      try { element.setPointerCapture(event.pointerId); } catch { /* capture is best-effort */ }
    }, { signal: this.#abort.signal });
    element.addEventListener("pointerup", (event) => {
      const start = touchStart;
      touchStart = null;
      if (!start || start.pointerId !== event.pointerId || event.pointerType === "mouse") return;
      const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      try { element.releasePointerCapture(event.pointerId); } catch { /* capture may already be released */ }
      if (moved > 18) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = true;
      activate();
      window.setTimeout(() => { suppressClick = false; }, 450);
    }, { signal: this.#abort.signal });
    element.addEventListener("pointercancel", () => { touchStart = null; }, { signal: this.#abort.signal });

    element.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (suppressClick) return;
      activate();
    }, { signal: this.#abort.signal });

    element.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      activate();
    }, { signal: this.#abort.signal });
  }

  #bindEvents(): void {
    queryRequired<HTMLButtonElement>("#start").addEventListener("click", () => this.#enterNetwork(), { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#quick-tour-toggle").addEventListener("click", () => {
      if (this.#recruiterTourActive) this.#cancelGuidedTour(true);
      else this.#startRecruiterTour();
    }, { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#quick-tour-skip").addEventListener("click", () => this.#cancelGuidedTour(true), { signal: this.#abort.signal });

    document.querySelectorAll<HTMLAnchorElement>("#resume-link, #mobile-resume-link, .contact-resume-link").forEach((link) => {
      link.addEventListener("click", () => {
        this.persistSession();
        markReturnToExpedition();
      }, { signal: this.#abort.signal });
    });
    queryRequired<HTMLButtonElement>("#panel-close").addEventListener("click", () => {
      this.#cancelGuidedTour();
      this.#clearNodeRoute();
    }, { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#missions-toggle").addEventListener("click", () => {
      if (this.#overlays.isMissionsOpen()) {
        this.#overlays.closeMissions();
        this.#world.resumeManualControl();
        return;
      }
      this.#prepareHeaderSurface("missions");
      this.#world.setMovementEnabled(false);
      this.#overlays.openMissions();
    }, { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#missions-close").addEventListener("click", () => {
      this.#overlays.closeMissions();
      this.#world.resumeManualControl();
    }, { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#minimap-toggle").addEventListener("click", () => {
      this.#overlays.toggleMinimap();
      requestAnimationFrame(() => this.#world.focusViewport());
    }, { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#layers-close").addEventListener("click", () => this.#closeLayers(), { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#help-toggle").addEventListener("click", () => this.#toggleHelp(), { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#contact-toggle").addEventListener("click", () => this.#toggleContact(), { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#settings-toggle").addEventListener("click", () => this.#toggleSettings(), { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#help-close").addEventListener("click", () => {
      this.#overlays.closeHelp();
      this.#world.resumeManualControl();
    }, { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#contact-close").addEventListener("click", () => {
      this.#overlays.closeContact();
      this.#world.resumeManualControl();
    }, { signal: this.#abort.signal });

    queryRequired<HTMLButtonElement>("#view-toggle").addEventListener("click", () => {
      this.#prepareHeaderSurface("view");
      this.#world.resumeManualControl();
    }, { signal: this.#abort.signal });

    const hudMenuToggle = queryRequired<HTMLButtonElement>("#hud-menu-toggle");
    const hudMobileMenu = queryRequired<HTMLElement>("#hud-mobile-menu");
    const closeHudMenu = (): void => this.#closeMobileMenu();
    hudMenuToggle.addEventListener("click", () => {
      const open = !hudMobileMenu.classList.contains("open");
      hudMobileMenu.classList.toggle("open", open);
      setInertVisibility(hudMobileMenu, open, hudMenuToggle);
      hudMenuToggle.setAttribute("aria-expanded", String(open));
      hudMenuToggle.setAttribute("aria-label", translateText(open ? "Close portfolio menu" : "Open portfolio menu"));
    }, { signal: this.#abort.signal });

    queryRequired<HTMLButtonElement>("#mobile-view-toggle").addEventListener("click", () => {
      closeHudMenu();
      queryRequired<HTMLButtonElement>("#view-toggle").click();
    }, { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#mobile-quick-tour-toggle").addEventListener("click", () => {
      closeHudMenu();
      queryRequired<HTMLButtonElement>("#quick-tour-toggle").click();
    }, { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#mobile-contact-toggle").addEventListener("click", () => {
      closeHudMenu();
      this.#toggleContact();
    }, { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#mobile-settings-toggle").addEventListener("click", () => {
      closeHudMenu();
      this.#toggleSettings();
    }, { signal: this.#abort.signal });
    queryRequired<HTMLButtonElement>("#mobile-help-toggle").addEventListener("click", () => {
      closeHudMenu();
      this.#toggleHelp();
    }, { signal: this.#abort.signal });
    queryRequired<HTMLAnchorElement>("#mobile-resume-link").addEventListener("click", closeHudMenu, { signal: this.#abort.signal });

    const mobileMapSelect = queryRequired<HTMLSelectElement>("#mobile-map-select");
    mobileMapSelect.addEventListener("change", () => {
      const candidate = mobileMapSelect.value;
      if (!isNodeId(candidate)) return;
      this.#activateNode(candidate, true);
      mobileMapSelect.value = "";
      this.#overlays.collapseMinimap();
    }, { signal: this.#abort.signal });

    document.querySelectorAll<HTMLSelectElement>("#hud [data-language-select]").forEach((select) => {
      select.addEventListener("change", () => {
        if (this.#store.state.started) requestAnimationFrame(() => this.#world.focusViewport());
      }, { signal: this.#abort.signal });
    });

    document.querySelectorAll<HTMLElement>("[data-node-id]").forEach((element) => this.#bindDestinationButton(element, "nodeId"));
    document.querySelectorAll<HTMLElement>("[data-category-hub]").forEach((element) => this.#bindCategoryHubButton(element));
    document.querySelectorAll<HTMLElement>("[data-mission-id]").forEach((element) => this.#bindDestinationButton(element, "missionId"));

    const bindArrowMenu = (container: HTMLElement): void => {
      container.addEventListener("keydown", (event) => {
        if (!(event.target instanceof HTMLElement) || event.target.matches("input, textarea, select")) return;
        const previous = event.key === "ArrowLeft" || event.key === "ArrowUp";
        const next = event.key === "ArrowRight" || event.key === "ArrowDown";
        if (!previous && !next) return;

        const items = Array.from(container.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"))
          .filter((item) => item.offsetParent !== null && item.getAttribute("aria-hidden") !== "true");
        if (items.length < 2) return;
        const current = items.indexOf(event.target);
        if (current < 0) return;

        event.preventDefault();
        event.stopPropagation();
        const delta = previous ? -1 : 1;
        items[(current + delta + items.length) % items.length]?.focus({ preventScroll: true });
      }, { signal: this.#abort.signal });
    };

    bindArrowMenu(queryRequired<HTMLElement>("#hud .pen-header-actions"));
    bindArrowMenu(queryRequired<HTMLElement>("#hud-mobile-menu"));

    document.addEventListener("focusin", (event) => {
      if (!this.#tabNavigationPending || !this.#store.state.started) return;
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-node-id]") : null;
      const candidate = target?.dataset["nodeId"];
      if (!isNodeId(candidate)) return;
      this.#cancelGuidedTour();
      this.#layout.exitFocus();
      this.#world.setMovementEnabled(true);
      this.#world.focusNode(candidate);
    }, { signal: this.#abort.signal });

    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (event.key === "Tab") this.#tabNavigationPending = true;

      const paletteShortcut = (event.key === "/" && !isTextEntryTarget(event.target))
        || ((event.ctrlKey || event.metaKey) && key === "k" && !isTextEntryTarget(event.target));
      if (paletteShortcut) {
        event.preventDefault();
        this.#settings.close(false);
        this.#commands.open();
        return;
      }

      if (this.#commands.isOpen()) return;
      if (event.key === "Escape") {
        if (this.#settings.isOpen()) {
          event.preventDefault();
          this.#settings.close();
          return;
        }
        // Nested mission workspaces own Escape. Closing them must reveal the
        // mission panel underneath rather than dismissing both layers at once.
        if (this.#trace.isOpen()) {
          event.preventDefault();
          this.#trace.close();
          return;
        }
        if (this.#caseStudies.isOpen()) {
          event.preventDefault();
          this.#caseStudies.close();
          return;
        }
        this.#cancelGuidedTour();
        this.#panel.close();
        this.#clearNodeRoute();
        this.#overlays.closeMissions();
        this.#overlays.closeHelp();
        this.#overlays.closeContact();
        this.#settings.close(false, false);
        this.#commands.close(false);
        this.#overlays.collapseMinimap();
        this.#closeLayers();
        this.#trace.close();
        this.#caseStudies.close();
        this.#layout.exitFocus();
        closeHudMenu();
        if (this.#store.state.started) this.#world.focusViewport();
        else if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        return;
      }

      if (event.key === "Enter" && this.#store.state.started && !isInteractiveTarget(event.target)) {
        event.preventDefault();
        const target = this.#world.inspectionTarget();
        this.#activateNode(target, false);
        return;
      }

      const wasdKey = ["w", "a", "s", "d"].includes(key);
      const canClaimNavigation = !isInteractiveTarget(event.target) || (wasdKey && !isTextEntryTarget(event.target));
      if (wasdKey && canClaimNavigation) {
        event.preventDefault();
        // Only tear down the guided tour when one is actually running. Calling
        // #cancelGuidedTour() on every WASD keydown clears pressedKeys, which
        // prevented two held direction keys (for example W+D) from producing
        // diagonal packet movement.
        if (this.#recruiterTourActive) this.#cancelGuidedTour();
        this.#layout.exitFocus();
        // Manual navigation always wins immediately, even if a node-click camera
        // travel is still finishing and even while the detail panel remains open.
        if (this.#store.state.autopilot) this.#world.resumeManualControl();
        else this.#world.setMovementEnabled(true);
        if (wasdKey && isInteractiveTarget(event.target)) this.#world.focusViewport();
        this.#world.setKey(key, true);
      }
    }, { signal: this.#abort.signal });

    document.addEventListener("keyup", (event) => {
      if (event.key === "Tab") this.#tabNavigationPending = false;
      this.#world.setKey(event.key.toLowerCase(), false);
    }, { signal: this.#abort.signal });
    window.addEventListener("popstate", (event) => {
      const state = event.state as { readonly penNode?: unknown } | null;
      const candidate = typeof state?.penNode === "string" ? state.penNode : undefined;
      if (isNodeId(candidate)) {
        this.#activateNode(candidate, true, false, false, false);
        return;
      }
      if (this.#store.state.openNode) this.#panel.close(false);
      if (this.#store.state.started) this.#world.resumeManualControl();
    }, { signal: this.#abort.signal });
    mobileNavigationQuery.addEventListener("change", () => this.#scheduleResponsiveModeSync(), {
      signal: this.#abort.signal,
    });
    window.addEventListener("resize", () => {
      this.#scheduleResponsiveModeSync();
      if (this.#layers.isOpen()) this.#layers.refreshBounds();
    }, { signal: this.#abort.signal, passive: true });
    window.visualViewport?.addEventListener("resize", () => this.#scheduleResponsiveModeSync(), {
      signal: this.#abort.signal,
      passive: true,
    });
    this.#scheduleResponsiveModeSync(true);
  }

  #pushNodeRoute(nodeId: NodeId): void {
    const route = `/network?mission=${encodeURIComponent(nodeId)}`;
    if (`${window.location.pathname}${window.location.search}` === route) return;
    const currentState = window.history.state;
    const state = currentState && typeof currentState === "object"
      ? { ...(currentState as Record<string, unknown>), penNode: nodeId }
      : { penNode: nodeId };
    window.history.pushState(state, "", route);
  }

  #clearNodeRoute(): void {
    const state = window.history.state as { readonly penNode?: unknown } | null;
    if (!isNodeId(typeof state?.penNode === "string" ? state.penNode : undefined)) return;
    window.history.replaceState({ penNetwork: true }, "", "/network");
  }

  #completeLandingLoad(): void {
    this.#landingExperience.classList.add("ready");
    this.#loader.classList.add("ready", "progress-complete");
    this.#boot.classList.add("progress-complete");
    queryRequired<HTMLElement>("#loader-percent").textContent = "100%";
    queryRequired<HTMLElement>("#loader-progress-fill").style.width = "100%";
    window.setTimeout(() => {
      this.#loader.hidden = true;
    }, prefersReducedMotion() ? 0 : 180);
    try { sessionStorage.setItem("pen:intro-seen", "1"); } catch { /* optional */ }
  }



  #startRecruiterTour(): void {
    this.#prepareHeaderSurface("tour");
    this.#recruiterTourActive = true;
    this.#tourPausedForSettings = false;
    this.#tourIndex = 0;
    this.#tourRemainingMs = TOUR_PANEL_DWELL_MS;
    this.#tourPhase = "travel";
    // Keep the active world layout. A tour started from Timeline stays on the
    // timeline positions; a tour started from Network stays in the orbital map.
    this.#layout.refreshView();
    this.#layout.exitFocus();
    const generation = this.#tourGeneration;
    this.#enterNetwork(undefined, () => this.#runRecruiterTourMission(0, generation));
  }

  #runRecruiterTourMission(index: number, generation: number): void {
    if (generation !== this.#tourGeneration) return;
    const nodeId = recruiterTour[index];
    if (!nodeId) return;

    this.#tourIndex = index;
    this.#tourPhase = "travel";
    this.#tourRemainingMs = TOUR_PANEL_DWELL_MS;
    this.#tourDwellStartedAt = 0;
    this.#overlays.closeMissions();
    this.#overlays.closeHelp();
    this.#overlays.closeContact();
    this.#settings.close(false, false);
    this.#layers.close();
    this.#trace.close();
    this.#caseStudies.close();
    this.#panel.close(false);
    this.#world.setMovementEnabled(false);
    this.#polish.pulseNode(nodeId);

    this.#world.autopilot(nodeId, false, () => {
      if (generation !== this.#tourGeneration || this.#tourPausedForSettings) return;
      this.#showRecruiterTourCard(index, generation, TOUR_PANEL_DWELL_MS);
    });
  }

  #showRecruiterTourCard(index: number, generation: number, dwellMs: number): void {
    if (generation !== this.#tourGeneration) return;
    const nodeId = recruiterTour[index];
    if (!nodeId) return;

    const card = queryRequired<HTMLElement>("#quick-tour-card");
    const node = nodeById[nodeId];
    this.#tourIndex = index;
    this.#tourPhase = "dwell";
    this.#tourRemainingMs = Math.max(250, dwellMs);
    this.#tourDwellStartedAt = performance.now();

    queryRequired<HTMLElement>("#quick-tour-progress").textContent = `${String(index + 1).padStart(2, "0")} / ${String(recruiterTour.length).padStart(2, "0")}`;
    queryRequired<HTMLElement>("#quick-tour-title").textContent = translateText(node.detail.title);
    queryRequired<HTMLElement>("#quick-tour-copy").textContent = translateText(recruiterSummaries[nodeId]);
    const timer = queryRequired<HTMLElement>("#quick-tour-timer");
    const elapsedBeforeResume = Math.max(0, TOUR_PANEL_DWELL_MS - this.#tourRemainingMs);
    const startingProgress = Math.min(100, (elapsedBeforeResume / TOUR_PANEL_DWELL_MS) * 100);
    timer.style.transition = "none";
    timer.style.width = `${startingProgress.toFixed(2)}%`;
    setInertVisibility(card, true);

    requestAnimationFrame(() => {
      if (generation !== this.#tourGeneration || this.#tourPausedForSettings) return;
      timer.style.transition = prefersReducedMotion() ? "none" : `width ${this.#tourRemainingMs / 1000}s linear`;
      timer.style.width = "100%";
    });

    if (this.#tourTimer !== null) window.clearTimeout(this.#tourTimer);
    this.#tourTimer = window.setTimeout(() => {
      this.#tourTimer = null;
      if (generation !== this.#tourGeneration || this.#tourPausedForSettings) return;
      setInertVisibility(card, false);
      const isLast = index >= recruiterTour.length - 1;
      if (isLast) {
        this.#recruiterTourActive = false;
        this.#tourPhase = "idle";
        this.#world.resumeManualControl();
        this.#panel.open("contact", false);
        return;
      }
      this.#runRecruiterTourMission(index + 1, generation);
    }, this.#tourRemainingMs);
  }

  #pauseRecruiterTourForSettings(): boolean {
    if (!this.#recruiterTourActive) return false;

    if (this.#tourPhase === "dwell") {
      const elapsed = Math.max(0, performance.now() - this.#tourDwellStartedAt);
      this.#tourRemainingMs = Math.max(250, this.#tourRemainingMs - elapsed);
    }
    if (this.#tourTimer !== null) {
      window.clearTimeout(this.#tourTimer);
      this.#tourTimer = null;
    }

    this.#tourPausedForSettings = true;
    this.#tourGeneration += 1;
    this.#world.cancelAutopilot();
    const card = document.querySelector<HTMLElement>("#quick-tour-card");
    if (card) setInertVisibility(card, false);
    return true;
  }

  #resumeRecruiterTourAfterSettings(): void {
    if (!this.#tourPausedForSettings || !this.#recruiterTourActive) return;
    this.#tourPausedForSettings = false;
    this.#world.setMovementEnabled(false);
    this.#layout.refreshView();
    const generation = this.#tourGeneration;

    if (this.#tourPhase === "dwell") {
      this.#showRecruiterTourCard(this.#tourIndex, generation, this.#tourRemainingMs);
      return;
    }

    this.#runRecruiterTourMission(this.#tourIndex, generation);
  }

  #cancelGuidedTour(resumeManual = false): void {
    this.#recruiterTourActive = false;
    this.#tourPausedForSettings = false;
    this.#tourPhase = "idle";
    this.#tourRemainingMs = TOUR_PANEL_DWELL_MS;
    this.#tourDwellStartedAt = 0;
    this.#tourGeneration += 1;
    if (this.#tourTimer !== null) {
      window.clearTimeout(this.#tourTimer);
      this.#tourTimer = null;
    }
    this.#world.cancelAutopilot();
    const card = document.querySelector<HTMLElement>("#quick-tour-card");
    if (card) setInertVisibility(card, false);
    if (resumeManual && this.#store.state.started) this.#world.resumeManualControl();
  }

  #initAnimations(deepLink: NodeId | null): void {
    gsap.set("#detail-panel", { xPercent: 105 });

    // Decorative infinite GSAP loops were intentionally removed. The map now
    // keeps only the lightweight shared mission-orbit marker loop; route dashes, terrain
    // rings, and node beacons remain static so navigation stays responsive.

    if (this.#store.state.started) {
      this.#landingExperience.hidden = true;
      document.body.classList.add("network-started");
      return;
    }

    if (deepLink) {
      this.#loader.hidden = true;
      this.#boot.classList.add("progress-complete");
      this.#landingExperience.classList.add("ready");
      queueMicrotask(() => this.#enterNetwork(deepLink));
      return;
    }

    const directExplore = new URLSearchParams(window.location.search).get("explore") === "1";
    if (directExplore) {
      window.history.replaceState(window.history.state, "", window.location.pathname);
      queueMicrotask(() => this.#enterNetwork());
      return;
    }

    let seenIntro = false;
    try { seenIntro = sessionStorage.getItem("pen:intro-seen") === "1"; } catch { /* optional */ }
    if (prefersReducedMotion() || seenIntro) {
      this.#loader.hidden = true;
      this.#boot.classList.add("progress-complete");
      this.#landingExperience.classList.add("ready");
      return;
    }

    const progress = { value: 0 };
    const loaderPercent = queryRequired<HTMLElement>("#loader-percent");
    const loaderStatus = queryRequired<HTMLElement>("#loader-status");
    const updateProgress = (): void => {
      const value = Math.round(progress.value);
      loaderPercent.textContent = `${String(value).padStart(3, "0")}%`;
      if (value > 62) loaderStatus.textContent = translate("landing.routes");
      else if (value > 30) loaderStatus.textContent = translate("landing.mapping");
    };

    const intro = gsap.timeline({ onComplete: () => this.#completeLandingLoad() });
    intro
      .fromTo(".classic-loader-progress-shell", { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "power1.out" }, 0)
      .to(progress, { value: 100, duration: 0.62, ease: "power2.out", onUpdate: updateProgress }, 0.04)
      .to("#loader-progress-fill", { width: "100%", duration: 0.62, ease: "power2.out" }, 0.04)
      .to(this.#loader, { opacity: 0, duration: 0.18, ease: "power1.out" }, 0.58);
    this.#trackAnimation(intro);
  }

  #pauseAmbientMotion(): void {
    document.documentElement.classList.add("ambient-motion-calm");
    this.#constellation.pause();
  }

  #resumeAmbientMotion(): void {
    document.documentElement.classList.remove("ambient-motion-calm");
    this.#constellation.resume();
  }

  #trackAnimation(animation: KillableAnimation): void {
    this.#gsapAnimations.push(animation);
  }

  destroy(): void {
    document.documentElement.classList.remove("ambient-motion-calm");
    this.#cancelGuidedTour();
    cancelAnimationFrame(this.#responsiveFrameId);
    cancelAnimationFrame(this.#responsiveSettleFrameId);
    if (this.#responsiveModeTimerId !== null) window.clearTimeout(this.#responsiveModeTimerId);
    this.#responsiveModeTimerId = null;
    delete document.documentElement.dataset["navigationMode"];
    document.body.classList.remove("mobile-navigation-mode", "desktop-navigation-mode");
    this.#abort.abort();
    this.#panel.destroy();
    this.#layers.destroy();
    this.#trace.destroy();
    this.#caseStudies.destroy();
    this.#layout.destroy();
    this.#polish.destroy();
    this.#settings.destroy();
    this.#commands.destroy();
    this.#constellation.destroy();
    this.#world.destroy();
    for (const cleanup of this.#motionCleanups) cleanup();
    this.#themeCleanup();
    this.#languageCleanup();
    for (const animation of this.#gsapAnimations) animation.kill();
    this.#gsapAnimations.length = 0;
  }
}
