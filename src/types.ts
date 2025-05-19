export interface TrackPoint {
  x: number;
  y: number;
  isControlPoint?: boolean;
}

export interface LevelConfig {
  trackPath: TrackPoint[];
  wallPaths: TrackPoint[][];
  trackWidth: number;
  startPosition: { x: number; y: number };
  checkpoints?: { x: number; y: number }[];
  roadFriction: number;
  offRoadFriction: number;
}

export interface CheckpointState {
  index: number;
  passed: boolean;
  timestamp: number;
}

export interface TerrainProperties {
  name: string;
  color: string;
  friction: number;
}

export type Vec2 = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

