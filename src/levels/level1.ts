import * as RAPIER from "@dimforge/rapier2d-compat";
import type { LevelConfig, Vec2 } from "../types";
import * as vec from "../utils/math";

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
    const direction = vec.subtract(next, current);
    
    // Calculate normal vector (perpendicular to direction)
    const normal = vec.normal(vec.normalize(direction));
    
    // Calculate half-width for the track
    const halfWidth = level.trackWidth / 2;
    
    // Calculate offset vectors for inner and outer edges
    const innerOffset = vec.multiply(normal, -halfWidth);
    const outerOffset = vec.multiply(normal, halfWidth);

    // Inner boundary points
    const innerPoint1 = vec.add(current, innerOffset);
    const innerPoint2 = vec.add(next, innerOffset);

    // Outer boundary points
    const outerPoint1 = vec.add(current, outerOffset);
    const outerPoint2 = vec.add(next, outerOffset);

    // Create colliders for inner boundary segment
    const innerSegmentDesc = RAPIER.ColliderDesc.segment(
      new RAPIER.Vector2(innerPoint1.x / physicsScale, innerPoint1.y / physicsScale),
      new RAPIER.Vector2(innerPoint2.x / physicsScale, innerPoint2.y / physicsScale),
    ).setFriction(level.roadFriction);

    const innerSegment = world.createCollider(innerSegmentDesc);
    innerBoundary.push(innerSegment);

    // Create colliders for outer boundary segment
    const outerSegmentDesc = RAPIER.ColliderDesc.segment(
      new RAPIER.Vector2(outerPoint1.x / physicsScale, outerPoint1.y / physicsScale),
      new RAPIER.Vector2(outerPoint2.x / physicsScale, outerPoint2.y / physicsScale),
    ).setFriction(level.roadFriction);

    const outerSegment = world.createCollider(outerSegmentDesc);
    outerBoundary.push(outerSegment);
  }

  return { innerBoundary, outerBoundary };
}

// Helper function to check if a point is on the road
export function isPointOnRoad(
  point: Vec2,
  level: LevelConfig,
): boolean {
  const halfWidthSquared = Math.pow(level.trackWidth / 2, 2);
  
  for (let i = 0; i < level.trackPath.length - 1; i++) {
    const current = level.trackPath[i];
    const next = level.trackPath[i + 1];

    // Calculate the squared distance from point to line segment
    const distSq = vec.pointToLineDistanceSquared(point, current, next);

    // If point is within half track width of any segment, it's on the road
    if (distSq <= halfWidthSquared) {
      return true;
    }
  }

  return false;
}

// This function is now provided by Vector2.pointToLineDistanceSquared in utils/math.ts
