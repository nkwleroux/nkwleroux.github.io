import type { Point } from "../domain/types.js";

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const distanceBetween = (a: Point, b: Point): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

export const headingDegrees = (from: Point, to: Point): number =>
  (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;

export const formatHeading = (degrees: number): string =>
  `${Math.round((degrees + 360) % 360).toString().padStart(3, "0")}°`;
