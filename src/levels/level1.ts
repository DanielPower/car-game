import type { LevelConfig } from "../types";

export const level1: LevelConfig = {
  trackWidth: 120,
  roadFriction: 0.7,
  offRoadFriction: 0.3,
  startPosition: { x: 400, y: 300 },
  trackPath: [
    { x: 400, y: 150, isControlPoint: true },
    { x: 600, y: 150 },
    { x: 700, y: 250, isControlPoint: true },
    { x: 700, y: 350 },
    { x: 600, y: 450, isControlPoint: true },
    { x: 400, y: 450 },
    { x: 200, y: 450, isControlPoint: true },
    { x: 100, y: 350 },
    { x: 100, y: 250, isControlPoint: true },
    { x: 200, y: 150 },
    { x: 400, y: 150 },
  ],
  checkpoints: [
    { x: 700, y: 300 },
    { x: 400, y: 450 },
    { x: 100, y: 300 },
    { x: 400, y: 150 },
  ],
  wallPaths: [
    [
      { x: 0, y: 0 },
      { x: 0, y: 600 },
    ],
    [
      { x: 0, y: 600 },
      { x: 800, y: 600 },
    ],
    [
      { x: 800, y: 600 },
      { x: 800, y: 0 },
    ],
    [
      { x: 800, y: 0 },
      { x: 0, y: 0 },
    ],
  ],
};
