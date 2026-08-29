import type { NodeId, Point } from "../domain/types.js";
import type { ExpeditionSnapshot } from "./ExpeditionSession.js";

export interface ExpeditionState {
  position: Point;
  previousPosition: Point;
  started: boolean;
  autopilot: boolean;
  nearestNode: NodeId | null;
  openNode: NodeId | null;
  pressedKeys: Set<string>;
}

export class ExpeditionStore {
  readonly state: ExpeditionState;

  constructor(initialPosition: Point, snapshot?: ExpeditionSnapshot | null) {
    const position = snapshot?.position ?? initialPosition;
    this.state = {
      position: { ...position },
      previousPosition: { ...position },
      started: snapshot?.started ?? false,
      autopilot: false,
      nearestNode: null,
      openNode: snapshot?.openNode ?? null,
      pressedKeys: new Set<string>(),
    };
  }

  setPosition(position: Point): void {
    this.state.previousPosition = this.state.position;
    this.state.position = position;
  }

  setKey(key: string, pressed: boolean): void {
    if (pressed) this.state.pressedKeys.add(key);
    else this.state.pressedKeys.delete(key);
  }
}
