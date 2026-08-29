import { gsap } from "../animations/gsap.js";
import { clamp, distanceBetween, formatHeading, headingDegrees } from "../core/math.js";
import { queryRequired } from "../core/dom.js";
import { translateText } from "../core/language.js";
import { prefersReducedMotion } from "../core/media.js";
import { categoryHubById, mapBounds, nodeById, portfolioNodes, worldSize } from "../data/portfolio.js";
import type { MissionGroup, NodeId, Point } from "../domain/types.js";
import type { ExpeditionStore } from "../state/ExpeditionStore.js";

interface KillableAnimation {
  kill(): void;
}

interface OrbitMarkerState {
  readonly element: HTMLElement;
  readonly durationMs: number;
  readonly phaseMs: number;
  readonly reverse: boolean;
  readonly radiusX: number;
  readonly radiusY: number;
}

interface WorldControllerOptions {
  readonly store: ExpeditionStore;
  readonly onInspect: (nodeId: NodeId) => void;
  readonly onHighlight: (nodeId: NodeId) => void;
}

const MAX_VIEW_SCALE = 1.32;
const ZOOM_STEP = 0.12;
const WHEEL_ZOOM_SENSITIVITY = 0.00125;
const MAX_WHEEL_DELTA_PER_FRAME = 320;
const MAP_FIT_PADDING = 32;
const ZOOM_EPSILON = 0.005;
const MOVEMENT_KEYS = new Set(["w", "a", "s", "d"]);

export class WorldController {
  readonly #store: ExpeditionStore;
  readonly #onInspect: (nodeId: NodeId) => void;
  readonly #onHighlight: (nodeId: NodeId) => void;
  readonly #viewport = queryRequired<HTMLElement>("#viewport");
  readonly #world = queryRequired<HTMLElement>("#world");
  readonly #packet = queryRequired<HTMLElement>("#packet");
  readonly #trail = queryRequired<HTMLElement>("#packet-trail");
  readonly #location = queryRequired<HTMLElement>("#location");
  readonly #coordinates = queryRequired<HTMLElement>("#coordinates");
  readonly #miniDot = queryRequired<HTMLElement>("#mini-dot");
  readonly #sector = queryRequired<HTMLElement>("#map-sector");
  readonly #proximity = queryRequired<HTMLElement>("#proximity");
  readonly #proximityName = queryRequired<HTMLElement>("#proximity-name");
  readonly #zoomInButton = queryRequired<HTMLButtonElement>("#map-zoom-in");
  readonly #zoomOutButton = queryRequired<HTMLButtonElement>("#map-zoom-out");
  readonly #zoomFitButton = queryRequired<HTMLButtonElement>("#map-zoom-fit");
  readonly #zoomValue = queryRequired<HTMLElement>("#map-zoom-value");
  #lastFrame = performance.now();
  #frameId = 0;
  #resizeFrameId = 0;
  #resizeAttempts = 0;
  #dragFrameId = 0;
  #wheelZoomFrameId = 0;
  #orbitFrameId = 0;
  #orbitEpoch = performance.now();
  #lastWorldTransform = "";
  #lastPacketTransform = "";
  #lastTrailTransform = "";
  #lastHeading = "";
  #lastCoordinates = "";
  #lastMapReadoutAt = 0;
  #pendingDragX = 0;
  #pendingDragY = 0;
  #pendingWheelDelta = 0;
  #movementEnabled = true;
  #viewportActive = true;
  #autopilotTween: KillableAnimation | null = null;
  #viewScale = 1;
  #lastMinimumViewScale = 0.1;
  #cameraPan = { x: 0, y: 0 };
  #cameraSnapTween: KillableAnimation | null = null;
  readonly #abort = new AbortController();
  readonly #viewportResizeObserver: ResizeObserver | null;
  #dragState: { pointerId: number; x: number; y: number } | null = null;
  readonly #nodePositions = new Map<NodeId, Point>(portfolioNodes.map((node) => [node.id, node.position]));
  readonly #nodeElements = new Map<NodeId, HTMLElement>();
  readonly #orbitMarkers: OrbitMarkerState[] = [];

  constructor(options: WorldControllerOptions) {
    this.#store = options.store;
    this.#onInspect = options.onInspect;
    this.#onHighlight = options.onHighlight;
    const clampedStart = this.#clampPosition(this.#store.state.position);
    this.#store.setPosition(clampedStart);
    this.#viewScale = clamp(this.#viewScale, this.#minimumViewScale(), MAX_VIEW_SCALE);
    for (const node of portfolioNodes) {
      const element = document.querySelector<HTMLElement>(`.node[data-node-id="${node.id}"]`);
      if (element) this.#nodeElements.set(node.id, element);
    }
    this.#initializeOrbitMarkers();
    this.#updateWorldCompositing();
    this.renderPosition();
    this.detectProximity();
    this.#bindDragNavigation();
    this.#bindZoomControls();
    this.#viewportResizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => this.refreshViewportBounds());
    this.#viewportResizeObserver?.observe(this.#viewport);
    window.addEventListener("resize", this.#handleViewportResize, {
      signal: this.#abort.signal,
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", this.#handleViewportResize, {
      signal: this.#abort.signal,
      passive: true,
    });
    this.#updateZoomControls();
  }


  /**
   * Recalculate the camera against the live viewport. The same authored world is
   * used on mobile and laptop/desktop, while zero-sized reads are retried so a
   * Device Toolbar transition cannot overwrite the last valid fit scale.
   */
  refreshViewportBounds(preserveFit = true): void {
    cancelAnimationFrame(this.#resizeFrameId);
    const previousMinimum = this.#lastMinimumViewScale;
    const wasFit = this.#viewScale <= previousMinimum + ZOOM_EPSILON;
    this.#resizeAttempts = 0;

    const refresh = (): void => {
      this.#resizeFrameId = 0;
      const width = this.#viewport.clientWidth;
      const height = this.#viewport.clientHeight;
      if ((width <= 0 || height <= 0) && this.#resizeAttempts < 5) {
        this.#resizeAttempts += 1;
        this.#resizeFrameId = requestAnimationFrame(refresh);
        return;
      }
      if (width <= 0 || height <= 0) return;

      const minimumScale = this.#calculateMinimumViewScale(width, height);
      this.#viewScale = preserveFit && wasFit
        ? minimumScale
        : clamp(this.#viewScale, minimumScale, MAX_VIEW_SCALE);
      this.#cameraPan.x = 0;
      this.#cameraPan.y = 0;
      this.#lastWorldTransform = "";
      this.#updateWorldCompositing();
      this.renderPosition();
      this.#updateZoomControls();
    };

    this.#resizeFrameId = requestAnimationFrame(refresh);
  }

  /**
   * Pause or resume the shared world lifecycle. Responsive mode changes no longer
   * deactivate it; this hook remains useful for genuine visibility/lifecycle work.
   */
  setViewportActive(active: boolean): void {
    if (this.#viewportActive === active) {
      if (active) this.refreshViewportBounds();
      return;
    }

    this.#viewportActive = active;
    if (!active) {
      this.#store.state.pressedKeys.clear();
      this.#stopMovementFrame();
      this.#stopOrbitFrame();
      return;
    }

    this.#lastWorldTransform = "";
    this.refreshViewportBounds();
    if (!this.#store.state.started) return;
    this.#updateOrbitMarkers(performance.now(), true);
    this.#ensureOrbitFrame();
    this.#ensureMovementFrame();
  }

  setMovementEnabled(enabled: boolean): void {
    this.#movementEnabled = enabled;
    if (enabled && this.#viewportActive) this.#ensureMovementFrame();
    else this.#stopMovementFrame();
  }

  refreshMotionPreferences(): void {
    if (prefersReducedMotion()) {
      this.#stopOrbitFrame();
      this.#cameraSnapTween?.kill();
      this.#cameraSnapTween = null;
      return;
    }
    if (this.#store.state.started && this.#viewportActive) {
      this.#orbitEpoch = performance.now();
      this.#updateOrbitMarkers(this.#orbitEpoch, true);
      this.#ensureOrbitFrame();
    }
  }

  fitMap(): void {
    this.setViewScale(this.#minimumViewScale());
  }

  focusNode(nodeId: NodeId): void {
    if (!this.#store.state.started) return;
    this.#onHighlight(nodeId);
    this.#autopilotTween?.kill();
    this.#autopilotTween = null;
    this.#cameraSnapTween?.kill();
    this.#cameraSnapTween = null;
    this.#store.state.autopilot = false;
    this.#store.state.pressedKeys.clear();

    const target = this.#clampPosition(this.#nodePosition(nodeId));
    this.#store.setPosition(target);

    const viewportWidth = this.#viewport.clientWidth;
    const viewportHeight = this.#viewport.clientHeight;
    const boundedX = this.#cameraAxis(viewportWidth, target.x, 0, worldSize.width, this.#viewScale);
    const boundedY = this.#cameraAxis(viewportHeight, target.y, 0, worldSize.height, this.#viewScale);
    const centeredX = viewportWidth / 2 - target.x * this.#viewScale;
    const centeredY = viewportHeight / 2 - target.y * this.#viewScale;
    this.#cameraPan.x = centeredX - boundedX;
    this.#cameraPan.y = centeredY - boundedY;

    this.renderPosition();
    this.detectProximity();
  }

  focusViewport(): void {
    if (this.#viewportActive) this.#viewport.focus({ preventScroll: true });
  }

  cancelAutopilot(): void {
    this.#autopilotTween?.kill();
    this.#autopilotTween = null;
    this.#cameraSnapTween?.kill();
    this.#cameraSnapTween = null;
    this.#store.state.autopilot = false;
    this.#store.state.pressedKeys.clear();
    document.querySelectorAll<SVGPathElement>(".route.traveling").forEach((route) => route.classList.remove("traveling"));
    this.#syncInteractionClass();
  }

  resumeManualControl(): void {
    this.#autopilotTween?.kill();
    this.#autopilotTween = null;
    this.#store.state.autopilot = false;
    this.#store.state.pressedKeys.clear();
    this.#movementEnabled = true;
    this.#syncInteractionClass();
    if (this.#viewportActive) this.#viewport.focus({ preventScroll: true });
  }

  setStarted(started: boolean): void {
    this.#store.state.started = started;
    if (started && this.#viewportActive) {
      this.#updateOrbitMarkers(performance.now(), true);
      this.#ensureOrbitFrame();
      this.#ensureMovementFrame();
    } else {
      this.#stopOrbitFrame();
      this.#stopMovementFrame();
    }
  }

  setKey(key: string, pressed: boolean): void {
    this.#store.setKey(key, pressed);
    if (!MOVEMENT_KEYS.has(key)) return;
    if (pressed) {
      this.#cameraSnapTween?.kill();
      this.#cameraSnapTween = null;
      this.#cameraPan.x = 0;
      this.#cameraPan.y = 0;
      this.#ensureMovementFrame();
    } else if (!this.#hasMovementInput()) this.#stopMovementFrame();
  }

  inspectionTarget(): NodeId {
    const nearest = this.#store.state.nearestNode;
    if (nearest) return nearest;

    let closestId: NodeId = "profile";
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const node of portfolioNodes) {
      const distance = distanceBetween(this.#store.state.position, this.#nodePosition(node.id));
      if (distance < closestDistance) {
        closestId = node.id;
        closestDistance = distance;
      }
    }
    return closestId;
  }

  inspectNearest(): void {
    this.#onInspect(this.inspectionTarget());
  }

  autopilot(nodeId: NodeId, openAfter = true, onComplete?: () => void): void {
    if (!this.#store.state.started) return;
    this.#onHighlight(nodeId);
    if (!this.#viewportActive) {
      if (openAfter) this.#onInspect(nodeId);
      onComplete?.();
      return;
    }
    this.#autopilotTo(this.#nodePosition(nodeId), () => {
      if (openAfter) this.#onInspect(nodeId);
      onComplete?.();
    });
  }

  autopilotCategory(group: MissionGroup, onComplete?: () => void): void {
    if (!this.#store.state.started) return;
    if (!this.#viewportActive) {
      onComplete?.();
      return;
    }
    this.#autopilotTo(categoryHubById[group].position, onComplete);
  }


  setViewScale(scale: number): void {
    this.#viewScale = clamp(scale, this.#minimumViewScale(), MAX_VIEW_SCALE);
    this.#cameraSnapTween?.kill();
    this.#cameraSnapTween = null;
    this.#cameraPan.x = 0;
    this.#cameraPan.y = 0;
    this.#updateWorldCompositing();
    this.renderPosition();
    this.#updateZoomControls();
    this.#syncInteractionClass();
  }

  viewScale(): number {
    return this.#viewScale;
  }

  setNodePositions(positions: Readonly<Partial<Record<NodeId, Point>>>): void {
    for (const node of portfolioNodes) {
      const position = positions[node.id] ?? node.position;
      this.#nodePositions.set(node.id, position);
    }
    this.detectProximity();
  }

  autopilotPoint(target: Point, onComplete?: () => void): void {
    if (!this.#store.state.started) return;
    if (!this.#viewportActive) {
      onComplete?.();
      return;
    }
    this.#autopilotTo(target, onComplete);
  }

  renderPosition(): void {
    const { position, previousPosition } = this.#store.state;
    const packetTransform = `translate3d(${position.x.toFixed(2)}px, ${position.y.toFixed(2)}px, 0)`;
    if (packetTransform !== this.#lastPacketTransform) {
      this.#packet.style.transform = packetTransform;
      this.#lastPacketTransform = packetTransform;
    }

    if (distanceBetween(position, previousPosition) > 0.02) {
      const angle = headingDegrees(previousPosition, position);
      const headingValue = formatHeading(angle);
      if (headingValue !== this.#lastHeading) {
        const heading = this.#packet.querySelector<HTMLElement>(".packet-heading");
        if (heading) heading.textContent = headingValue;
        this.#lastHeading = headingValue;
      }
      const trailTransform = `translate3d(${(position.x - 85).toFixed(2)}px, ${position.y.toFixed(2)}px, 0) rotate(${(angle + 180).toFixed(2)}deg)`;
      if (trailTransform !== this.#lastTrailTransform) {
        this.#trail.style.transform = trailTransform;
        this.#lastTrailTransform = trailTransform;
      }
    }

    const viewportWidth = this.#viewport.clientWidth;
    const viewportHeight = this.#viewport.clientHeight;
    if (this.#viewportActive && viewportWidth > 0 && viewportHeight > 0) {
      const cameraX = this.#cameraAxis(viewportWidth, position.x, 0, worldSize.width, this.#viewScale) + this.#cameraPan.x;
      const cameraY = this.#cameraAxis(viewportHeight, position.y, 0, worldSize.height, this.#viewScale) + this.#cameraPan.y;
      const worldTransform = `translate3d(${cameraX.toFixed(3)}px, ${cameraY.toFixed(3)}px, 0) scale(${this.#viewScale.toFixed(5)})`;
      if (worldTransform !== this.#lastWorldTransform) {
        this.#world.style.transform = worldTransform;
        this.#lastWorldTransform = worldTransform;
      }
    }
    const now = performance.now();
    if (now - this.#lastMapReadoutAt >= 50 || this.#lastMapReadoutAt === 0) {
      this.#lastMapReadoutAt = now;
      const mapWidth = mapBounds.maxX - mapBounds.minX;
      const mapHeight = mapBounds.maxY - mapBounds.minY;
      this.#miniDot.style.left = `${((position.x - mapBounds.minX) / mapWidth) * 100}%`;
      this.#miniDot.style.top = `${((position.y - mapBounds.minY) / mapHeight) * 100}%`;
      const coordinateValue = `${Math.round(position.x).toString().padStart(4, "0")} / ${Math.round(position.y).toString().padStart(4, "0")}`;
      if (coordinateValue !== this.#lastCoordinates) {
        this.#coordinates.textContent = coordinateValue;
        this.#lastCoordinates = coordinateValue;
      }
    }
  }

  detectProximity(): void {
    const position = this.#store.state.position;
    let nearest: NodeId | null = null;
    let nearestDistance = 126;

    for (const node of portfolioNodes) {
      const distance = distanceBetween(position, this.#nodePosition(node.id));
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = node.id;
      }
      this.#nodeElements.get(node.id)?.classList.toggle("near", distance < 126);
    }

    if (nearest !== this.#store.state.nearestNode) {
      this.#store.state.nearestNode = nearest;
      if (nearest) {
        this.#proximityName.textContent = translateText(nodeById[nearest].locationLabel);
        gsap.to(this.#proximity, { opacity: 1, y: 0, duration: 0.25 });
      } else {
        gsap.to(this.#proximity, { opacity: 0, y: 20, duration: 0.2 });
      }
    }

    if (nearest) {
      const node = nodeById[nearest];
      this.#location.textContent = translateText(node.locationLabel);
      this.#sector.textContent = translateText(node.sector === "physical" ? "SECTOR A" : node.sector === "interface" ? "SECTOR B" : "SECTOR C");
    }
  }

  destroy(): void {
    cancelAnimationFrame(this.#frameId);
    cancelAnimationFrame(this.#resizeFrameId);
    cancelAnimationFrame(this.#dragFrameId);
    cancelAnimationFrame(this.#wheelZoomFrameId);
    this.#stopOrbitFrame();
    this.#autopilotTween?.kill();
    this.#autopilotTween = null;
    this.#cameraSnapTween?.kill();
    this.#cameraSnapTween = null;
    this.#store.state.autopilot = false;
    this.#viewportResizeObserver?.disconnect();
    this.#abort.abort();
  }


  #initializeOrbitMarkers(): void {
    document.querySelectorAll<HTMLElement>(".mission-orbit[data-orbit-duration]").forEach((orbit) => {
      const element = orbit.querySelector<HTMLElement>(".mission-orbit-signal");
      const durationSeconds = Number.parseFloat(orbit.dataset["orbitDuration"] ?? "");
      const phaseSeconds = Number.parseFloat(orbit.dataset["orbitPhase"] ?? "0");
      const radiusX = Number.parseFloat(orbit.dataset["orbitRadiusX"] ?? "");
      const radiusY = Number.parseFloat(orbit.dataset["orbitRadiusY"] ?? "");
      if (!element || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return;
      if (!Number.isFinite(radiusX) || !Number.isFinite(radiusY)) return;

      this.#orbitMarkers.push({
        element,
        durationMs: durationSeconds * 1000,
        phaseMs: Number.isFinite(phaseSeconds) ? phaseSeconds * 1000 : 0,
        reverse: orbit.dataset["orbitReverse"] === "true",
        radiusX,
        radiusY,
      });
    });

    if (this.#orbitMarkers.length === 0) return;
    this.#orbitEpoch = performance.now();
    this.#updateOrbitMarkers(this.#orbitEpoch, true);
    if (!prefersReducedMotion()) this.#ensureOrbitFrame();
  }

  #ensureOrbitFrame(): void {
    if (!this.#viewportActive || this.#orbitFrameId !== 0 || this.#orbitMarkers.length === 0 || !this.#store.state.started || prefersReducedMotion()) return;
    this.#orbitFrameId = requestAnimationFrame(this.#orbitFrame);
  }

  #stopOrbitFrame(): void {
    if (this.#orbitFrameId !== 0) cancelAnimationFrame(this.#orbitFrameId);
    this.#orbitFrameId = 0;
  }

  readonly #orbitFrame = (now: number): void => {
    this.#orbitFrameId = 0;
    if (!this.#viewportActive || !this.#store.state.started || prefersReducedMotion()) return;
    this.#updateOrbitMarkers(now);
    this.#orbitFrameId = requestAnimationFrame(this.#orbitFrame);
  };

  readonly #updateOrbitMarkers = (now: number, force = false): void => {
    if (!force) {
      if (!this.#store.state.started || document.hidden) return;
      if (document.documentElement.classList.contains("ambient-motion-calm")) return;
      if (document.body.classList.contains("panel-reading")) return;
    }

    const elapsed = now - this.#orbitEpoch;
    for (const marker of this.#orbitMarkers) {
      let progress = ((elapsed + marker.phaseMs) % marker.durationMs) / marker.durationMs;
      if (marker.reverse) progress = 1 - progress;
      const angle = progress * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * marker.radiusX;
      const y = Math.sin(angle) * marker.radiusY;
      marker.element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    }
  };

  #bindZoomControls(): void {
    this.#zoomInButton.addEventListener("click", () => {
      this.setViewScale(this.#viewScale + ZOOM_STEP);
    }, { signal: this.#abort.signal });

    this.#zoomOutButton.addEventListener("click", () => {
      this.setViewScale(this.#viewScale - ZOOM_STEP);
    }, { signal: this.#abort.signal });

    this.#zoomFitButton.addEventListener("click", () => {
      this.fitMap();
    }, { signal: this.#abort.signal });

    this.#viewport.addEventListener("wheel", (event) => {
      if (!this.#viewportActive || !this.#store.state.started) return;
      if (event.ctrlKey || event.metaKey) return;
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX) || event.deltaY === 0) return;

      event.preventDefault();

      const deltaModeMultiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? Math.max(1, this.#viewport.clientHeight)
          : 1;
      const normalizedDelta = event.deltaY * deltaModeMultiplier;
      this.#pendingWheelDelta = clamp(
        this.#pendingWheelDelta + normalizedDelta,
        -MAX_WHEEL_DELTA_PER_FRAME,
        MAX_WHEEL_DELTA_PER_FRAME,
      );

      if (this.#wheelZoomFrameId === 0) {
        this.#wheelZoomFrameId = requestAnimationFrame(() => this.#flushWheelZoom());
      }
    }, { signal: this.#abort.signal, passive: false });
  }

  #flushWheelZoom(): void {
    this.#wheelZoomFrameId = 0;
    const wheelDelta = this.#pendingWheelDelta;
    this.#pendingWheelDelta = 0;
    if (wheelDelta === 0 || !this.#viewportActive) return;

    const scaleFactor = Math.exp(-wheelDelta * WHEEL_ZOOM_SENSITIVITY);
    const nextScale = clamp(
      this.#viewScale * scaleFactor,
      this.#minimumViewScale(),
      MAX_VIEW_SCALE,
    );
    if (Math.abs(nextScale - this.#viewScale) <= Number.EPSILON) return;
    this.setViewScale(nextScale);
  }

  readonly #handleViewportResize = (): void => {
    this.refreshViewportBounds();
  };

  #calculateMinimumViewScale(viewportWidth: number, viewportHeight: number): number {
    const availableWidth = Math.max(1, viewportWidth - MAP_FIT_PADDING * 2);
    const availableHeight = Math.max(1, viewportHeight - MAP_FIT_PADDING * 2);
    const fitScale = Math.min(availableWidth / worldSize.width, availableHeight / worldSize.height);
    this.#lastMinimumViewScale = Math.min(fitScale, MAX_VIEW_SCALE);
    return this.#lastMinimumViewScale;
  }

  #minimumViewScale(): number {
    const width = this.#viewport.clientWidth;
    const height = this.#viewport.clientHeight;
    if (width <= 0 || height <= 0) return this.#lastMinimumViewScale;
    return this.#calculateMinimumViewScale(width, height);
  }

  #updateZoomControls(): void {
    const minimumScale = this.#minimumViewScale();
    const atMinimum = this.#viewScale <= minimumScale + ZOOM_EPSILON;
    const atMaximum = this.#viewScale >= MAX_VIEW_SCALE - ZOOM_EPSILON;
    const percentage = Math.round(this.#viewScale * 100);

    this.#zoomOutButton.disabled = atMinimum;
    this.#zoomInButton.disabled = atMaximum;
    this.#zoomFitButton.classList.toggle("is-fit", atMinimum);
    this.#zoomValue.textContent = `${percentage}%`;
    this.#zoomFitButton.setAttribute(
      "aria-label",
      translateText(`Fit the complete map in view. Current zoom ${percentage} percent`),
    );
  }

  #bindDragNavigation(): void {
    const finishDrag = (pointerId: number): void => {
      if (!this.#dragState || this.#dragState.pointerId !== pointerId) return;
      this.#flushPendingDrag();
      this.#dragState = null;
      this.#viewport.classList.remove("dragging");
      try { this.#viewport.releasePointerCapture(pointerId); } catch { /* capture may already be released */ }

      this.#cameraSnapTween?.kill();
      this.#cameraSnapTween = null;
      if (this.#cameraPan.x === 0 && this.#cameraPan.y === 0) {
        this.#syncInteractionClass();
        return;
      }

      if (prefersReducedMotion()) {
        this.#cameraPan.x = 0;
        this.#cameraPan.y = 0;
        this.renderPosition();
        this.#syncInteractionClass();
        return;
      }

      this.#cameraSnapTween = gsap.to(this.#cameraPan, {
        x: 0,
        y: 0,
        duration: 0.46,
        ease: "power3.out",
        overwrite: true,
        onUpdate: () => this.renderPosition(),
        onComplete: () => {
          this.#cameraSnapTween = null;
          this.renderPosition();
          this.#syncInteractionClass();
        },
      });
      this.#syncInteractionClass();
    };

    this.#viewport.addEventListener("pointerdown", (event) => {
      if (!this.#store.state.started || !this.#movementEnabled || event.button !== 0) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("button, a, input, textarea, select, [role='button'], [role='dialog']")) return;

      this.#autopilotTween?.kill();
      this.#autopilotTween = null;
      this.#cameraSnapTween?.kill();
      this.#cameraSnapTween = null;
      this.#store.state.autopilot = false;
      this.#store.state.pressedKeys.clear();
      this.#dragState = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      this.#viewport.setPointerCapture(event.pointerId);
      this.#viewport.classList.add("dragging");
      this.#syncInteractionClass();
      event.preventDefault();
    }, { signal: this.#abort.signal });

    this.#viewport.addEventListener("pointermove", (event) => {
      const drag = this.#dragState;
      if (!drag || drag.pointerId !== event.pointerId || !this.#movementEnabled) return;

      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.x = event.clientX;
      drag.y = event.clientY;

      // Dragging pans only the camera. The packet remains at its world coordinate
      // and continues to be constrained by #clampPosition for keyboard/autopilot movement.
      this.#pendingDragX += dx;
      this.#pendingDragY += dy;
      if (this.#dragFrameId === 0) {
        this.#dragFrameId = requestAnimationFrame(() => this.#flushPendingDrag());
      }
      event.preventDefault();
    }, { signal: this.#abort.signal });

    this.#viewport.addEventListener("pointerup", (event) => finishDrag(event.pointerId), { signal: this.#abort.signal });
    this.#viewport.addEventListener("pointercancel", (event) => finishDrag(event.pointerId), { signal: this.#abort.signal });
    this.#viewport.addEventListener("lostpointercapture", (event) => finishDrag(event.pointerId), { signal: this.#abort.signal });
  }


  #flushPendingDrag(): void {
    if (this.#dragFrameId !== 0) cancelAnimationFrame(this.#dragFrameId);
    this.#dragFrameId = 0;
    if (this.#pendingDragX === 0 && this.#pendingDragY === 0) return;

    this.#cameraPan.x += this.#pendingDragX;
    this.#cameraPan.y += this.#pendingDragY;
    this.#pendingDragX = 0;
    this.#pendingDragY = 0;
    this.renderPosition();
  }

  #autopilotTo(target: Point, onComplete?: () => void): void {
    document.querySelectorAll<SVGPathElement>(".route.active").forEach((route) => route.classList.add("traveling"));
    this.#cameraSnapTween?.kill();
    this.#cameraSnapTween = null;
    this.#cameraPan.x = 0;
    this.#cameraPan.y = 0;
    const start = this.#store.state.position;
    const proxy = { x: start.x, y: start.y };
    const distance = distanceBetween(start, target);
    const duration = prefersReducedMotion() ? 0 : clamp(distance / 900, 0.55, 1.55);

    this.#autopilotTween?.kill();
    this.#autopilotTween = null;
    this.#store.state.autopilot = true;

    this.#autopilotTween = gsap.to(proxy, {
      x: target.x,
      y: target.y,
      duration,
      ease: "power3.inOut",
      onUpdate: () => {
        this.#store.setPosition(this.#clampPosition({ x: proxy.x, y: proxy.y }));
        this.renderPosition();
        this.detectProximity();
      },
      onComplete: () => {
        this.#autopilotTween = null;
        this.#store.state.autopilot = false;
        document.querySelectorAll<SVGPathElement>(".route.traveling").forEach((route) => route.classList.remove("traveling"));
        this.#syncInteractionClass();
        onComplete?.();
      },
    });
    this.#syncInteractionClass();
  }

  #clampPosition(position: Point): Point {
    const packetMargin = 42;
    return {
      x: clamp(position.x, mapBounds.minX + packetMargin, mapBounds.maxX - packetMargin),
      y: clamp(position.y, mapBounds.minY + packetMargin, mapBounds.maxY - packetMargin),
    };
  }

  #nodePosition(nodeId: NodeId): Point {
    return this.#nodePositions.get(nodeId) ?? nodeById[nodeId].position;
  }

  #cameraAxis(viewportSize: number, position: number, minimum: number, maximum: number, scale: number): number {
    const scaledMinimum = minimum * scale;
    const scaledMaximum = maximum * scale;
    const contentSize = scaledMaximum - scaledMinimum;

    if (viewportSize >= contentSize) {
      return (viewportSize - contentSize) / 2 - scaledMinimum;
    }

    const centered = viewportSize / 2 - position * scale;
    const minimumTranslation = viewportSize - scaledMaximum;
    const maximumTranslation = -scaledMinimum;
    return clamp(centered, minimumTranslation, maximumTranslation);
  }

  #hasMovementInput(): boolean {
    const keys = this.#store.state.pressedKeys;
    return keys.has("w") || keys.has("a") || keys.has("s") || keys.has("d");
  }

  #ensureMovementFrame(): void {
    const state = this.#store.state;
    if (!this.#viewportActive || this.#frameId !== 0 || !state.started || state.autopilot || !this.#movementEnabled || !this.#hasMovementInput()) return;
    this.#lastFrame = performance.now();
    this.#frameId = requestAnimationFrame(this.#frame);
    this.#syncInteractionClass();
  }

  #stopMovementFrame(): void {
    if (this.#frameId !== 0) cancelAnimationFrame(this.#frameId);
    this.#frameId = 0;
    this.#lastMapReadoutAt = 0;
    this.renderPosition();
    this.#syncInteractionClass();
  }

  #syncInteractionClass(): void {
    // Deliberately avoid toggling a class on <html> while the packet moves. A
    // root-level class invalidated the full page style tree and could make the
    // completely zoomed-out map flash on lower-powered GPUs.
  }

  #updateWorldCompositing(): void {
    const atFit = this.#viewScale <= this.#minimumViewScale() + ZOOM_EPSILON;
    this.#world.classList.toggle("map-fit-view", atFit);
    this.#world.style.setProperty("--view-scale", this.#viewScale.toFixed(5));

    // Keep COMMS comfortably clickable when the complete 3600 × 2200 world is
    // fitted into a narrow viewport. Only its transparent interaction surface
    // counter-scales; the visible orb and map layout remain unchanged.
    const contactHitScale = clamp(0.28 / Math.max(this.#viewScale, 0.001), 1, 4.5);
    this.#world.style.setProperty("--contact-hit-scale", contactHitScale.toFixed(3));
    this.#world.style.willChange = atFit ? "auto" : "transform";
  }

  readonly #frame = (now: number): void => {
    this.#frameId = 0;
    if (!this.#viewportActive) return;
    const dt = Math.min(2, (now - this.#lastFrame) / 16.67);
    this.#lastFrame = now;
    const state = this.#store.state;

    if (state.started && !state.autopilot && this.#movementEnabled && this.#hasMovementInput()) {
      const speed = 9.0 * dt;
      const keys = state.pressedKeys;
      const horizontal = Number(keys.has("d")) - Number(keys.has("a"));
      const vertical = Number(keys.has("s")) - Number(keys.has("w"));
      let dx = horizontal * speed;
      let dy = vertical * speed;

      if (dx !== 0 || dy !== 0) {
        // Multiple held WASD keys are combined into one movement vector. Keep
        // diagonal travel at the same overall speed as cardinal movement.
        const length = Math.hypot(dx, dy);
        if (length > speed) {
          dx = (dx / length) * speed;
          dy = (dy / length) * speed;
        }
        const next = this.#clampPosition({
          x: state.position.x + dx,
          y: state.position.y + dy,
        });
        this.#store.setPosition(next);
        this.renderPosition();
        this.detectProximity();
      }

      this.#frameId = requestAnimationFrame(this.#frame);
    }

    this.#syncInteractionClass();
  };
}

