import * as RAPIER from "@dimforge/rapier2d-compat";
import type { LevelConfig } from "../types";

export const level1: LevelConfig = {
  trackWidth: 120, // Width of the track in pixels
  roadFriction: 0.7, // Friction coefficient on the road
  offRoadFriction: 0.3, // Friction coefficient off the road
  startPosition: { x: 400, y: 300 }, // Car starting position
  // Define the track as a list of points that form a loop
  trackPath: [
    { x: 400, y: 150, isControlPoint: true }, // Top center
    { x: 600, y: 150 },
    { x: 700, y: 250, isControlPoint: true }, // Right upper curve
    { x: 700, y: 350 },
    { x: 600, y: 450, isControlPoint: true }, // Right lower curve
    { x: 400, y: 450 },
    { x: 200, y: 450, isControlPoint: true }, // Left lower curve
    { x: 100, y: 350 },
    { x: 100, y: 250, isControlPoint: true }, // Left upper curve
    { x: 200, y: 150 },
    { x: 400, y: 150 }, // Back to start to close the loop
  ],
  // Optional checkpoints for lap timing or race progression
  checkpoints: [
    { x: 700, y: 300 }, // Right side
    { x: 400, y: 450 }, // Bottom
    { x: 100, y: 300 }, // Left side
    { x: 400, y: 150 }, // Top
  ],
};

// Helper function to generate track boundaries from the track path
export function generateTrackBoundaries(
  world: RAPIER.World,
  level: LevelConfig,
  physicsScale: number,
): { innerBoundary: RAPIER.Collider[]; outerBoundary: RAPIER.Collider[] } {
  const innerBoundary: RAPIER.Collider[] = [];
  const outerBoundary: RAPIER.Collider[] = [];

  // Calculate the track boundaries (inner and outer edges)
  for (let i = 0; i < level.trackPath.length - 1; i++) {
    const current = level.trackPath[i];
    const next = level.trackPath[i + 1];

    // Calculate direction vector
    const dx = next.x - current.x;
    const dy = next.y - current.y;

    // Calculate normal vector (perpendicular to direction)
    const length = Math.sqrt(dx * dx + dy * dy);
    const normalX = -dy / length;
    const normalY = dx / length;

    // Calculate half-width for the track
    const halfWidth = level.trackWidth / 2;

    // Inner boundary point
    const innerX1 = current.x - normalX * halfWidth;
    const innerY1 = current.y - normalY * halfWidth;
    const innerX2 = next.x - normalX * halfWidth;
    const innerY2 = next.y - normalY * halfWidth;

    // Outer boundary point
    const outerX1 = current.x + normalX * halfWidth;
    const outerY1 = current.y + normalY * halfWidth;
    const outerX2 = next.x + normalX * halfWidth;
    const outerY2 = next.y + normalY * halfWidth;

    // Create colliders for inner boundary segment
    const innerSegmentDesc = RAPIER.ColliderDesc.segment(
      new RAPIER.Vector2(innerX1 / physicsScale, innerY1 / physicsScale),
      new RAPIER.Vector2(innerX2 / physicsScale, innerY2 / physicsScale),
    ).setFriction(level.roadFriction);

    const innerSegment = world.createCollider(innerSegmentDesc);
    innerBoundary.push(innerSegment);

    // Create colliders for outer boundary segment
    const outerSegmentDesc = RAPIER.ColliderDesc.segment(
      new RAPIER.Vector2(outerX1 / physicsScale, outerY1 / physicsScale),
      new RAPIER.Vector2(outerX2 / physicsScale, outerY2 / physicsScale),
    ).setFriction(level.roadFriction);

    const outerSegment = world.createCollider(outerSegmentDesc);
    outerBoundary.push(outerSegment);
  }

  return { innerBoundary, outerBoundary };
}

// Helper function to check if a point is on the road
export function isPointOnRoad(
  point: { x: number; y: number },
  level: LevelConfig,
): boolean {
  for (let i = 0; i < level.trackPath.length - 1; i++) {
    const current = level.trackPath[i];
    const next = level.trackPath[i + 1];

    // Calculate the squared distance from point to line segment
    const distSq = pointToLineDistSq(point, current, next);

    // If point is within half track width of any segment, it's on the road
    if (distSq <= Math.pow(level.trackWidth / 2, 2)) {
      return true;
    }
  }

  return false;
}

// Calculate squared distance from point to line segment
function pointToLineDistSq(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    // Line segment is a point
    const deltaX = point.x - lineStart.x;
    const deltaY = point.y - lineStart.y;
    return deltaX * deltaX + deltaY * deltaY;
  }

  // Calculate projection of point onto line segment
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq,
    ),
  );

  // Calculate closest point on line segment
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;

  // Calculate squared distance to closest point
  const deltaX = point.x - projX;
  const deltaY = point.y - projY;
  return deltaX * deltaX + deltaY * deltaY;
}
