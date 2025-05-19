import RAPIER from "@dimforge/rapier2d-compat";
import { LevelConfig, Vec2 } from "../types";
import { pointToLineDistanceSquared } from "./math";
import * as vec from "./math";
import { COLLISION_GROUPS } from "../game";

export function isPointOnRoad(point: Vec2, level: LevelConfig): boolean {
  const halfWidthSquared = Math.pow(level.trackWidth / 2, 2);

  for (let i = 0; i < level.trackPath.length - 1; i++) {
    const current = level.trackPath[i];
    const next = level.trackPath[i + 1];

    const distSq = pointToLineDistanceSquared(point, current, next);
    if (distSq <= halfWidthSquared) {
      return true;
    }
  }

  return false;
}

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
      new RAPIER.Vector2(
        innerPoint1.x / physicsScale,
        innerPoint1.y / physicsScale,
      ),
      new RAPIER.Vector2(
        innerPoint2.x / physicsScale,
        innerPoint2.y / physicsScale,
      ),
    )
    .setFriction(level.roadFriction)
    .setCollisionGroups(
      // Track boundary is in TRACK group and can collide with CAR and WHEEL groups
      (COLLISION_GROUPS.TRACK << 16) | (COLLISION_GROUPS.CAR | COLLISION_GROUPS.WHEEL)
    );

    const innerSegment = world.createCollider(innerSegmentDesc);
    innerBoundary.push(innerSegment);

    // Create colliders for outer boundary segment
    const outerSegmentDesc = RAPIER.ColliderDesc.segment(
      new RAPIER.Vector2(
        outerPoint1.x / physicsScale,
        outerPoint1.y / physicsScale,
      ),
      new RAPIER.Vector2(
        outerPoint2.x / physicsScale,
        outerPoint2.y / physicsScale,
      ),
    )
    .setFriction(level.roadFriction)
    .setCollisionGroups(
      // Track boundary is in TRACK group and can collide with CAR and WHEEL groups
      (COLLISION_GROUPS.TRACK << 16) | (COLLISION_GROUPS.CAR | COLLISION_GROUPS.WHEEL)
    );

    const outerSegment = world.createCollider(outerSegmentDesc);
    outerBoundary.push(outerSegment);
  }

  return { innerBoundary, outerBoundary };
}
