import { prefersReducedMotion } from "../core/media.js";

interface MotionAnimation {
  cancel?: () => void;
  stop?: () => void;
}

interface MotionRuntime {
  animate(
    target: Element | Element[] | string,
    keyframes: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): MotionAnimation;
  stagger(interval: number): unknown;
}

type MotionWindow = Window & { Motion?: MotionRuntime };
const runtimeWindow = window as MotionWindow;

const animateFallback = (
  elements: HTMLElement[],
  keyframes: { readonly opacity?: readonly number[]; readonly y?: readonly number[]; readonly scale?: readonly number[] },
  durationSeconds: number,
  staggerSeconds: number,
): void => {
  elements.forEach((element, index) => {
    const startOpacity = keyframes.opacity?.[0];
    const endOpacity = keyframes.opacity?.[1];
    const startY = keyframes.y?.[0] ?? 0;
    const endY = keyframes.y?.[1] ?? 0;
    const startScale = keyframes.scale?.[0] ?? 1;
    const endScale = keyframes.scale?.[1] ?? 1;
    element.animate(
      [
        { opacity: startOpacity, transform: `translateY(${startY}px) scale(${startScale})` },
        { opacity: endOpacity, transform: `translateY(${endY}px) scale(${endScale})` },
      ],
      {
        duration: durationSeconds * 1000,
        delay: index * staggerSeconds * 1000,
        easing: "cubic-bezier(.22,.78,.22,1)",
        fill: "both",
      },
    );
  });
};

export const revealElements = (elements: Element[]): void => {
  const htmlElements = elements.filter((element): element is HTMLElement => element instanceof HTMLElement);
  if (htmlElements.length === 0) return;

  if (prefersReducedMotion()) {
    for (const element of htmlElements) {
      element.style.opacity = "1";
      element.style.transform = "none";
    }
    return;
  }

  const runtime = runtimeWindow.Motion;
  if (runtime) {
    runtime.animate(
      htmlElements,
      { opacity: [0, 1], y: [16, 0] },
      { duration: 0.48, delay: runtime.stagger(0.035), ease: [0.22, 0.78, 0.22, 1] },
    );
  } else {
    animateFallback(htmlElements, { opacity: [0, 1], y: [16, 0] }, 0.48, 0.035);
  }
};

export const revealNodes = (): void => {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(".node, .category-hub"));
  if (nodes.length === 0 || prefersReducedMotion()) return;
  const runtime = runtimeWindow.Motion;
  if (runtime) {
    runtime.animate(nodes, { opacity: [0, 1], scale: [0.68, 1] }, { duration: 0.62, delay: runtime.stagger(0.06) });
  } else {
    animateFallback(nodes, { opacity: [0, 1], scale: [0.68, 1] }, 0.62, 0.06);
  }
};

/**
 * Map hover feedback is CSS-only. Running a Web Animation for every pointer
 * enter/leave used to create competing transform animations on the large
 * composited world layer and could make navigation feel sticky.
 */
export const installHoverMotion = (): (() => void)[] => [];
