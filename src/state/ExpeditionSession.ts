import { isNodeId } from "../data/portfolio.js";
import type { NodeId, Point } from "../domain/types.js";
import type { ExpeditionState } from "./ExpeditionStore.js";

const SNAPSHOT_KEY = "network-expedition:snapshot:v1";
const RETURN_KEY = "network-expedition:return-to-world";

export interface ExpeditionSnapshot {
  readonly version: 1;
  readonly started: boolean;
  readonly position: Point;
  readonly openNode: NodeId | null;
  readonly panelScrollTop: number;
}

const isFinitePoint = (value: unknown): value is Point => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<Point>;
  return Number.isFinite(candidate.x) && Number.isFinite(candidate.y);
};

export const saveExpeditionSnapshot = (state: ExpeditionState, panelScrollTop = 0): void => {
  const snapshot: ExpeditionSnapshot = {
    version: 1,
    started: state.started,
    position: { ...state.position },
    openNode: state.openNode,
    panelScrollTop: Math.max(0, panelScrollTop),
  };
  sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
};

export const loadExpeditionSnapshot = (): ExpeditionSnapshot | null => {
  const raw = sessionStorage.getItem(SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    const candidate = JSON.parse(raw) as Partial<ExpeditionSnapshot>;
    if (candidate.version !== 1 || typeof candidate.started !== "boolean" || !isFinitePoint(candidate.position)) return null;
    if (candidate.openNode !== null && candidate.openNode !== undefined && !isNodeId(candidate.openNode)) return null;
    return {
      version: 1,
      started: candidate.started,
      position: candidate.position,
      openNode: candidate.openNode ?? null,
      panelScrollTop: Number.isFinite(candidate.panelScrollTop) ? Math.max(0, Number(candidate.panelScrollTop)) : 0,
    };
  } catch {
    return null;
  }
};

export const markReturnToExpedition = (): void => {
  sessionStorage.setItem(RETURN_KEY, "1");
};

export const shouldRestoreExpedition = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return params.get("restore") === "1" || sessionStorage.getItem(RETURN_KEY) === "1";
};

export const consumeReturnMarker = (): void => {
  sessionStorage.removeItem(RETURN_KEY);
};

export const hasReturnMarker = (): boolean => sessionStorage.getItem(RETURN_KEY) === "1";
