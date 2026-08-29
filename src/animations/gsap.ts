import { clamp } from "../core/math.js";

export interface KillableAnimation {
  kill(): void;
  pause?(): void;
  resume?(): void;
}

export interface GsapTimeline extends KillableAnimation {
  to(target: AnimationTarget, vars: TweenVars, position?: number): GsapTimeline;
  from(target: AnimationTarget, vars: TweenVars, position?: number): GsapTimeline;
  fromTo(target: AnimationTarget, fromVars: TweenVars, toVars: TweenVars, position?: number): GsapTimeline;
}

export type AnimationTarget = string | Element | Element[] | Record<string, unknown>;

export interface TweenVars {
  readonly duration?: number;
  readonly delay?: number;
  readonly ease?: string;
  readonly opacity?: number;
  readonly x?: number;
  readonly y?: number;
  readonly xPercent?: number;
  readonly scale?: number;
  readonly rotation?: number | string;
  readonly skewY?: number;
  readonly width?: number | string;
  readonly strokeDashoffset?: number;
  readonly transformOrigin?: string;
  readonly repeat?: number;
  readonly yoyo?: boolean;
  readonly overwrite?: boolean;
  readonly stagger?: number | { readonly each?: number; readonly from?: string };
  readonly onUpdate?: () => void;
  readonly onComplete?: () => void;
  readonly [key: string]: unknown;
}

interface GsapRuntime {
  to(target: unknown, vars: Record<string, unknown>): KillableAnimation;
  set(target: unknown, vars: Record<string, unknown>): void;
  fromTo(target: unknown, fromVars: Record<string, unknown>, toVars: Record<string, unknown>): KillableAnimation;
  timeline(options?: Record<string, unknown>): GsapTimeline;
  killTweensOf(target: unknown): void;
  getProperty(target: unknown, property: string): unknown;
}

export interface DraggableInstance {
  x: number;
  kill(): void;
  update(): void;
}

interface DraggableOptions {
  readonly type: "x";
  readonly bounds: { readonly minX: number; readonly maxX: number };
  readonly onDrag?: (this: DraggableInstance) => void;
  readonly onDragEnd?: (this: DraggableInstance) => void;
}

interface DraggableRuntime {
  create(target: Element, options: DraggableOptions): DraggableInstance[];
}

type VendorWindow = Window & {
  gsap?: GsapRuntime;
  Draggable?: DraggableRuntime;
};

const runtimeWindow = window as VendorWindow;
const activeAnimations = new WeakMap<object, Set<KillableAnimation>>();

const track = (target: object, animation: KillableAnimation): KillableAnimation => {
  const current = activeAnimations.get(target) ?? new Set<KillableAnimation>();
  current.add(animation);
  activeAnimations.set(target, current);
  return animation;
};

const untrack = (target: object, animation: KillableAnimation): void => {
  activeAnimations.get(target)?.delete(animation);
};

const getElements = (target: AnimationTarget): Element[] => {
  if (typeof target === "string") return Array.from(document.querySelectorAll(target));
  if (target instanceof Element) return [target];
  if (Array.isArray(target)) return target.filter((item): item is Element => item instanceof Element);
  return [];
};

const transformFromVars = (vars: TweenVars): string | undefined => {
  const parts: string[] = [];
  if (typeof vars.xPercent === "number") parts.push(`translateX(${vars.xPercent}%)`);
  if (typeof vars.x === "number") parts.push(`translateX(${vars.x}px)`);
  if (typeof vars.y === "number") parts.push(`translateY(${vars.y}px)`);
  if (typeof vars.scale === "number") parts.push(`scale(${vars.scale})`);
  if (typeof vars.rotation === "number") parts.push(`rotate(${vars.rotation}deg)`);
  else if (typeof vars.rotation === "string" && !vars.rotation.startsWith("+=" ) && !vars.rotation.startsWith("-=")) parts.push(`rotate(${vars.rotation})`);
  if (typeof vars.skewY === "number") parts.push(`skewY(${vars.skewY}deg)`);
  return parts.length > 0 ? parts.join(" ") : undefined;
};

const applyElementVars = (element: Element, vars: TweenVars): void => {
  if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) return;
  const style = element.style;
  if (typeof vars.opacity === "number") style.opacity = String(vars.opacity);
  if (vars.width !== undefined) style.width = typeof vars.width === "number" ? `${vars.width}px` : vars.width;
  if (typeof vars.strokeDashoffset === "number") style.strokeDashoffset = String(vars.strokeDashoffset);
  if (typeof vars.transformOrigin === "string") style.transformOrigin = vars.transformOrigin;
  const transform = transformFromVars(vars);
  if (transform) style.transform = transform;
};

const elementKeyframe = (vars: TweenVars): Keyframe => {
  const frame: Keyframe = {};
  if (typeof vars.opacity === "number") frame["opacity"] = vars.opacity;
  if (vars.width !== undefined) frame["width"] = typeof vars.width === "number" ? `${vars.width}px` : vars.width;
  if (typeof vars.strokeDashoffset === "number") frame["strokeDashoffset"] = vars.strokeDashoffset;
  const transform = transformFromVars(vars);
  if (transform) frame["transform"] = transform;
  return frame;
};

const createNoop = (): KillableAnimation => ({ kill: () => undefined });

const fallbackCssEasing = (ease: string | undefined): string => {
  if (ease === "none" || ease === "linear") return "linear";
  if (ease === "sine.inOut") return "ease-in-out";
  if (ease === "power4.out") return "cubic-bezier(.16,1,.3,1)";
  if (ease === "power3.inOut") return "cubic-bezier(.65,0,.35,1)";
  if (ease === "power2.out") return "cubic-bezier(.22,.61,.36,1)";
  return "cubic-bezier(.22,.78,.22,1)";
};

const fallbackProgress = (progress: number, ease: string | undefined): number => {
  if (ease === "none" || ease === "linear") return progress;
  if (ease === "sine.inOut") return -(Math.cos(Math.PI * progress) - 1) / 2;
  if (ease?.endsWith(".out")) return 1 - Math.pow(1 - progress, 3);
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
};

const fallbackObjectTween = (target: Record<string, unknown>, vars: TweenVars): KillableAnimation => {
  const durationMs = Math.max(0, Number(vars.duration ?? 0.4) * 1000);
  const delayMs = Math.max(0, Number(vars.delay ?? 0) * 1000);
  const keys = Object.keys(vars).filter((key) => typeof vars[key] === "number" && typeof target[key] === "number");
  const starts = Object.fromEntries(keys.map((key) => [key, Number(target[key])])) as Record<string, number>;
  let frameId = 0;
  let cancelled = false;
  const startedAt = performance.now() + delayMs;

  const animation: KillableAnimation = {
    kill: () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      untrack(target, animation);
    },
  };

  const tick = (now: number): void => {
    if (cancelled) return;
    if (now < startedAt) {
      frameId = requestAnimationFrame(tick);
      return;
    }
    const linear = durationMs === 0 ? 1 : clamp((now - startedAt) / durationMs, 0, 1);
    const t = fallbackProgress(linear, vars.ease);
    for (const key of keys) {
      const end = Number(vars[key]);
      const startValue = starts[key];
      if (startValue === undefined) continue;
      target[key] = startValue + (end - startValue) * t;
    }
    vars.onUpdate?.();
    if (linear < 1) frameId = requestAnimationFrame(tick);
    else {
      vars.onComplete?.();
      untrack(target, animation);
    }
  };

  frameId = requestAnimationFrame(tick);
  return track(target, animation);
};

const fallbackElementTween = (target: AnimationTarget, vars: TweenVars): KillableAnimation => {
  const elements = getElements(target);
  if (elements.length === 0) {
    vars.onComplete?.();
    return createNoop();
  }

  const animations: Animation[] = [];
  const duration = Math.max(0, Number(vars.duration ?? 0.35) * 1000);
  const delay = Math.max(0, Number(vars.delay ?? 0) * 1000);
  const iterations = vars.repeat === -1 ? Infinity : Math.max(1, Number(vars.repeat ?? 0) + 1);
  const direction: PlaybackDirection = vars.yoyo ? "alternate" : "normal";
  let completed = 0;
  const frame = elementKeyframe(vars);

  elements.forEach((element, index) => {
    const staggerEach = typeof vars.stagger === "number" ? vars.stagger : Number(vars.stagger?.each ?? 0);
    const animation = element.animate([{}, frame], {
      duration,
      delay: delay + staggerEach * index * 1000,
      easing: fallbackCssEasing(vars.ease),
      fill: "forwards",
      iterations,
      direction,
    });
    if (iterations !== Infinity) {
      animation.addEventListener("finish", () => {
        applyElementVars(element, vars);
        completed += 1;
        vars.onUpdate?.();
        if (completed === elements.length) vars.onComplete?.();
      }, { once: true });
    }
    animations.push(animation);
  });

  return {
    kill: () => {
      for (const animation of animations) animation.cancel();
    },
    pause: () => {
      for (const animation of animations) animation.pause();
    },
    resume: () => {
      for (const animation of animations) animation.play();
    },
  };
};

const fallbackTo = (target: AnimationTarget, vars: TweenVars): KillableAnimation => {
  if (typeof target === "object" && target !== null && !(target instanceof Element) && !Array.isArray(target)) {
    return fallbackObjectTween(target, vars);
  }
  return fallbackElementTween(target, vars);
};

class NativeTimeline implements GsapTimeline {
  #cursor = 0;
  #completionTimer = 0;
  readonly #animations: KillableAnimation[] = [];

  constructor(private readonly onComplete?: () => void) {}

  to(target: AnimationTarget, vars: TweenVars, position?: number): GsapTimeline {
    const start = position ?? this.#cursor;
    const duration = Number(vars.duration ?? 0.35);
    this.#animations.push(fallbackTo(target, { ...vars, delay: start }));
    this.#cursor = Math.max(this.#cursor, start + duration);
    this.#scheduleCompletion();
    return this;
  }

  from(target: AnimationTarget, vars: TweenVars, position?: number): GsapTimeline {
    const elements = getElements(target);
    for (const element of elements) applyElementVars(element, vars);
    const finalVars: TweenVars = {
      ...(vars.duration !== undefined ? { duration: vars.duration } : {}),
      ...(vars.opacity !== undefined ? { opacity: 1 } : {}),
      ...(typeof vars.x === "number" ? { x: 0 } : {}),
      ...(typeof vars.y === "number" ? { y: 0 } : {}),
      ...(typeof vars.scale === "number" ? { scale: 1 } : {}),
      ...(typeof vars.skewY === "number" ? { skewY: 0 } : {}),
    };
    return this.to(target, finalVars, position);
  }

  fromTo(target: AnimationTarget, fromVars: TweenVars, toVars: TweenVars, position?: number): GsapTimeline {
    const elements = getElements(target);
    for (const element of elements) applyElementVars(element, fromVars);
    return this.to(target, toVars, position);
  }

  kill(): void {
    window.clearTimeout(this.#completionTimer);
    for (const animation of this.#animations) animation.kill();
    this.#animations.length = 0;
  }

  #scheduleCompletion(): void {
    window.clearTimeout(this.#completionTimer);
    if (!this.onComplete) return;
    this.#completionTimer = window.setTimeout(() => this.onComplete?.(), Math.ceil(this.#cursor * 1000 + 20));
  }
}

export const gsap = {
  to(target: AnimationTarget, vars: TweenVars): KillableAnimation {
    return runtimeWindow.gsap?.to(target, vars as Record<string, unknown>) ?? fallbackTo(target, vars);
  },
  set(target: AnimationTarget, vars: TweenVars): void {
    if (runtimeWindow.gsap) runtimeWindow.gsap.set(target, vars as Record<string, unknown>);
    else for (const element of getElements(target)) applyElementVars(element, vars);
  },
  fromTo(target: AnimationTarget, fromVars: TweenVars, toVars: TweenVars): KillableAnimation {
    if (runtimeWindow.gsap) return runtimeWindow.gsap.fromTo(target, fromVars as Record<string, unknown>, toVars as Record<string, unknown>);
    for (const element of getElements(target)) applyElementVars(element, fromVars);
    return fallbackTo(target, toVars);
  },
  timeline(options?: { readonly onComplete?: () => void }): GsapTimeline {
    return runtimeWindow.gsap?.timeline(options as Record<string, unknown>) ?? new NativeTimeline(options?.onComplete);
  },
  killTweensOf(target: AnimationTarget): void {
    if (runtimeWindow.gsap) {
      runtimeWindow.gsap.killTweensOf(target);
      return;
    }
    if (typeof target === "object" && target !== null && !(target instanceof Element) && !Array.isArray(target)) {
      for (const animation of activeAnimations.get(target) ?? []) animation.kill();
    }
  },
  getProperty(target: Element, property: string): unknown {
    if (runtimeWindow.gsap) return runtimeWindow.gsap.getProperty(target, property);
    if (property === "x" && target instanceof HTMLElement) {
      const match = target.style.transform.match(/translateX\((-?[\d.]+)px\)/);
      return match ? Number(match[1]) : 0;
    }
    return 0;
  },
};

class NativeDraggable implements DraggableInstance {
  x: number;
  readonly #abort = new AbortController();
  #pointerId: number | null = null;
  #startClientX = 0;
  #startX = 0;

  constructor(
    private readonly target: HTMLElement,
    private readonly options: DraggableOptions,
  ) {
    this.x = Number(gsap.getProperty(target, "x")) || 0;
    target.addEventListener("pointerdown", this.#onPointerDown, { signal: this.#abort.signal });
    window.addEventListener("pointermove", this.#onPointerMove, { signal: this.#abort.signal });
    window.addEventListener("pointerup", this.#onPointerUp, { signal: this.#abort.signal });
  }

  update(): void {
    this.x = Number(gsap.getProperty(this.target, "x")) || this.x;
  }

  kill(): void {
    this.#abort.abort();
  }

  readonly #onPointerDown = (event: PointerEvent): void => {
    this.#pointerId = event.pointerId;
    this.#startClientX = event.clientX;
    this.#startX = this.x;
    this.target.setPointerCapture?.(event.pointerId);
  };

  readonly #onPointerMove = (event: PointerEvent): void => {
    if (this.#pointerId !== event.pointerId) return;
    const next = clamp(this.#startX + event.clientX - this.#startClientX, this.options.bounds.minX, this.options.bounds.maxX);
    this.x = next;
    this.target.style.transform = `translateX(${next}px)`;
    this.options.onDrag?.call(this);
  };

  readonly #onPointerUp = (event: PointerEvent): void => {
    if (this.#pointerId !== event.pointerId) return;
    this.#pointerId = null;
    this.options.onDragEnd?.call(this);
  };
}

export const Draggable = {
  create(target: Element, options: DraggableOptions): DraggableInstance[] {
    if (runtimeWindow.Draggable) return runtimeWindow.Draggable.create(target, options);
    if (!(target instanceof HTMLElement)) return [];
    return [new NativeDraggable(target, options)];
  },
};
