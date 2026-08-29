import { isMotionReductionEnabled } from "./experienceSettings.js";

export const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

// Navigation mode follows the primary input model rather than browser width.
// Both modes use the same orbital world; the mode only adapts controls, pointer
// feedback, and full-screen panel layout. A narrowed laptop therefore remains in
// laptop/desktop mode, while touch emulation selects the mobile control treatment.
export const mobileNavigationQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
export const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

// Backwards-compatible alias for controllers that describe mobile layout state.
export const mobileLayoutQuery = mobileNavigationQuery;

export type ResponsiveMode = "mobile" | "desktop";

export const prefersReducedMotion = (): boolean => reducedMotionQuery.matches || isMotionReductionEnabled();
export const responsiveMode = (): ResponsiveMode => mobileNavigationQuery.matches ? "mobile" : "desktop";
export const supportsFinePointer = (): boolean => finePointerQuery.matches || !mobileNavigationQuery.matches;
