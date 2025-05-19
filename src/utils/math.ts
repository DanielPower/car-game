import { Vec2 } from "../types";

/**
 * Vector utility functions for 2D physics operations
 */

/**
 * Calculate the length (magnitude) of a vector
 */
export function length(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Calculate the squared length of a vector (more efficient when only comparing distances)
 */
export function lengthSquared(v: Vec2): number {
  return v.x * v.x + v.y * v.y;
}

/**
 * Normalize a vector (create a unit vector in the same direction)
 */
export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len === 0) return { x: 0, y: 0 };
  return {
    x: v.x / len,
    y: v.y / len,
  };
}

/**
 * Calculate the normal vector (perpendicular vector) to the given vector
 */
export function normal(v: Vec2): Vec2 {
  return {
    x: -v.y,
    y: v.x,
  };
}

/**
 * Add two vectors
 */
export function add(a: Vec2, b: Vec2): Vec2 {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

/**
 * Subtract vector b from vector a
 */
export function subtract(a: Vec2, b: Vec2): Vec2 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
}

/**
 * Multiply a vector by a scalar
 */
export function multiply(v: Vec2, scalar: number): Vec2 {
  return {
    x: v.x * scalar,
    y: v.y * scalar,
  };
}

/**
 * Calculate the dot product of two vectors
 */
export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * Calculate distance between two points
 */
export function distance(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate squared distance between two points (more efficient)
 */
export function distanceSquared(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}

/**
 * Calculate the angle of a vector in radians
 */
export function angle(v: Vec2): number {
  return Math.atan2(v.y, v.x);
}

/**
 * Create a vector from an angle and magnitude
 */
export function fromAngle(angle: number, magnitude: number = 1): Vec2 {
  return {
    x: Math.cos(angle) * magnitude,
    y: Math.sin(angle) * magnitude,
  };
}

/**
 * Calculate minimum squared distance from point to line segment
 */
export function pointToLineDistanceSquared(
  point: Vec2,
  lineStart: Vec2,
  lineEnd: Vec2
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    // Line segment is a point
    return distanceSquared(point, lineStart);
  }

  // Calculate projection of point onto line segment
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq
    )
  );

  // Calculate closest point on line segment
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;

  // Calculate squared distance to closest point
  return distanceSquared(point, { x: projX, y: projY });
}