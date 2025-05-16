import type { CarAI } from './ai/CarAI';
import { Wall } from './wall';

interface Vector2D {
  x: number;
  y: number;
}

export class Car {
  // Position and dimensions
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private color: string;
  
  // Physics properties
  private velocity: Vector2D = { x: 0, y: 0 };
  private acceleration: Vector2D = { x: 0, y: 0 };
  private maxSpeed: number = 400;  // Increased max speed
  private enginePower: number = 1500;  // Significantly increased for much faster acceleration
  private brakeForce: number = 800;  // Increased for better braking
  
  // Rotation
  private rotation: number = 0;
  private angularVelocity: number = 0;
  private steeringPower: number = 6;  // Increased for even better steering
  private maxAngularVelocity: number = 6;  // Increased to match steering power
  
  // Friction and drift properties
  private lateralFriction: number = 6;  // Further reduced for more drift
  private longitudinalFriction: number = 0.2;  // Further reduced for less forward friction
  private angularFriction: number = 2;  // Further reduced for smoother turning
  
  // Collision properties
  private mass: number = 20;  // kg - dramatically reduced for ultra-responsive physics
  private restitution: number = 0.6;  // Bounciness (0-1) - increased for more bounce
  private collisionDamping: number = 0.5;  // Reduces velocity after collision
  
  // AI controller
  private ai: CarAI | null = null;
  
  // Collision state
  private lastCollisionTime: number = 0;
  private collisionCooldown: number = 0.1;  // seconds

  constructor(x: number, y: number, width: number, height: number, color: string = 'red') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }
  
  setAI(ai: CarAI): void {
    this.ai = ai;
  }

  update(deltaTime: number, walls: Wall[]): void {
    if (!this.ai) {
      console.warn('Car has no AI controller assigned');
      return;
    }
    
    // Prepare input for AI
    const input = {
      x: this.x,
      y: this.y,
      speed: this.getSpeed(),
      rotation: this.rotation,
      width: this.width,
      height: this.height,
      roadWidth: 800, // Should come from road
      roadHeight: 600, // Should come from road
      deltaTime: deltaTime
    };
    
    // Get AI decision
    const output = this.ai.process(input);
    
    // Reset acceleration
    this.acceleration = { x: 0, y: 0 };
    
    // Calculate forward direction vector based on rotation
    const forwardX = Math.sin(this.rotation);
    const forwardY = -Math.cos(this.rotation);
    
    // Apply AI controls
    if (output.accelerate) {
      // Add force in the forward direction
      // Apply extra boost when starting from standstill
      const startBoost = this.getSpeed() < 5 ? 2.0 : 1.0;
      this.acceleration.x += forwardX * this.enginePower * startBoost / this.mass;
      this.acceleration.y += forwardY * this.enginePower * startBoost / this.mass;
    }
    
    if (output.brake) {
      // Add braking force in the opposite direction of velocity
      const speed = this.getSpeed();
      if (speed > 0.1) {
        const brakingForceMagnitude = this.brakeForce / this.mass;
        this.acceleration.x -= (this.velocity.x / speed) * brakingForceMagnitude;
        this.acceleration.y -= (this.velocity.y / speed) * brakingForceMagnitude;
      }
    }
    
    // Apply steering
    let steeringInput = 0;
    if (output.turnLeft) steeringInput -= 1;
    if (output.turnRight) steeringInput += 1;
    
    // Steering effectiveness is proportional to speed but with a minimum value
    const speed = this.getSpeed();
    const steeringEffectiveness = Math.min(1, Math.max(0.1, speed / 50));
    
    // Apply angular acceleration based on steering input
    const angularAcceleration = steeringInput * this.steeringPower * steeringEffectiveness;
    this.angularVelocity += angularAcceleration * deltaTime;
    
    // Apply physics
    this.applyPhysics(deltaTime);
    
    // Check for collisions with walls
    this.checkWallCollisions(walls);
    
    // Update position and rotation
    this.updatePosition(deltaTime);
  }

  private applyPhysics(deltaTime: number): void {
    // Calculate current forward and lateral directions
    const forwardX = Math.sin(this.rotation);
    const forwardY = -Math.cos(this.rotation);
    const rightX = Math.cos(this.rotation);
    const rightY = Math.sin(this.rotation);
    
    // Project velocity onto forward and lateral directions
    const forwardVelocity = this.velocity.x * forwardX + this.velocity.y * forwardY;
    const lateralVelocity = this.velocity.x * rightX + this.velocity.y * rightY;
    
    // Apply friction in forward direction (only if there's significant velocity)
    let forwardFrictionForce = 0;
    if (Math.abs(forwardVelocity) > 0.1) {
      forwardFrictionForce = -forwardVelocity * this.longitudinalFriction;
    }
    
    // Apply friction in lateral direction (only if there's significant velocity)
    let lateralFrictionForce = 0;
    if (Math.abs(lateralVelocity) > 0.1) {
      lateralFrictionForce = -lateralVelocity * this.lateralFriction;
    }
    
    // Convert friction forces back to world coordinates
    this.acceleration.x += forwardFrictionForce * forwardX + lateralFrictionForce * rightX;
    this.acceleration.y += forwardFrictionForce * forwardY + lateralFrictionForce * rightY;
    
    // Apply angular friction (only if there's significant angular velocity)
    if (Math.abs(this.angularVelocity) > 0.01) {
      const angularFrictionForce = -this.angularVelocity * this.angularFriction;
      this.angularVelocity += angularFrictionForce * deltaTime;
    }
    
    // Update velocity based on acceleration
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    
    // Apply a minimum velocity threshold to prevent getting stuck at very low speeds
    const speed = this.getSpeed();
    if (speed > 0 && speed < 10) {
      // If speed is low but not zero, give it a boost in its current direction
      // The boost is stronger at lower speeds
      const boostFactor = (10 - speed) * 2 * deltaTime;
      this.velocity.x += (this.velocity.x / speed) * boostFactor;
      this.velocity.y += (this.velocity.y / speed) * boostFactor;
    }
    
    // Limit speed
    const finalSpeed = this.getSpeed();
    if (finalSpeed > this.maxSpeed) {
      this.velocity.x = (this.velocity.x / finalSpeed) * this.maxSpeed;
      this.velocity.y = (this.velocity.y / finalSpeed) * this.maxSpeed;
    }
    
    // Limit angular velocity
    this.angularVelocity = Math.max(-this.maxAngularVelocity, Math.min(this.maxAngularVelocity, this.angularVelocity));
  }

  private updatePosition(deltaTime: number): void {
    // Update position based on velocity
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;
    
    // Update rotation based on angular velocity
    this.rotation += this.angularVelocity * deltaTime;
    
    // Normalize rotation to keep it between 0 and 2π
    this.rotation = this.rotation % (2 * Math.PI);
    if (this.rotation < 0) this.rotation += 2 * Math.PI;
  }
  
  private checkWallCollisions(walls: Wall[]): void {
    // Get car corners in world space
    const corners = this.getCorners();
    
    // Check collision with each wall
    for (const wall of walls) {
      if (this.checkCollisionWithWall(corners, wall)) {
        // Handle collision response
        this.handleWallCollision(wall);
        break; // Only handle one collision per frame for simplicity
      }
    }
  }
  
  private checkCollisionWithWall(corners: Vector2D[], wall: Wall): boolean {
    // Simple collision check: if any corner is inside the wall, we have a collision
    for (const corner of corners) {
      if (wall.containsPoint(corner.x, corner.y)) {
        return true;
      }
    }
    
    // Check if any wall edge intersects with any car edge
    const carEdges = [
      [corners[0], corners[1]],
      [corners[1], corners[2]],
      [corners[2], corners[3]],
      [corners[3], corners[0]]
    ];
    
    const wallEdges = wall.getEdges();
    
    for (const carEdge of carEdges) {
      for (const wallEdge of wallEdges) {
        if (this.linesIntersect(carEdge[0], carEdge[1], wallEdge[0], wallEdge[1])) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  private linesIntersect(
    a1: Vector2D, a2: Vector2D, 
    b1: Vector2D, b2: Vector2D
  ): boolean {
    // Line segment intersection check
    const denominator = ((b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y));
    
    if (denominator === 0) {
      return false; // Lines are parallel
    }
    
    const ua = ((b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)) / denominator;
    const ub = ((a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)) / denominator;
    
    return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1);
  }
  
  private handleWallCollision(wall: Wall): void {
    // Avoid multiple collisions in a short time
    const currentTime = performance.now() / 1000;
    if (currentTime - this.lastCollisionTime < this.collisionCooldown) {
      return;
    }
    
    this.lastCollisionTime = currentTime;
    
    // Get wall normal based on car's position
    const normal = wall.getNormal(this.x, this.y);
    
    // Calculate reflection vector
    const dotProduct = this.velocity.x * normal.x + this.velocity.y * normal.y;
    
    // Apply impulse based on reflection
    this.velocity.x -= (1 + this.restitution) * dotProduct * normal.x;
    this.velocity.y -= (1 + this.restitution) * dotProduct * normal.y;
    
    // Apply collision damping
    this.velocity.x *= this.collisionDamping;
    this.velocity.y *= this.collisionDamping;
    
    // Add some angular velocity based on collision angle
    const impactAngle = Math.atan2(normal.y, normal.x) - this.rotation;
    this.angularVelocity += Math.sin(impactAngle) * 2;
  }
  
  private getCorners(): Vector2D[] {
    // Calculate car corners based on position, rotation, width, and height
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    
    return [
      { // Top-left
        x: this.x + (-halfWidth * cos - halfHeight * sin),
        y: this.y + (-halfWidth * sin + halfHeight * cos)
      },
      { // Top-right
        x: this.x + (halfWidth * cos - halfHeight * sin),
        y: this.y + (halfWidth * sin + halfHeight * cos)
      },
      { // Bottom-right
        x: this.x + (halfWidth * cos + halfHeight * sin),
        y: this.y + (halfWidth * sin - halfHeight * cos)
      },
      { // Bottom-left
        x: this.x + (-halfWidth * cos + halfHeight * sin),
        y: this.y + (-halfWidth * sin - halfHeight * cos)
      }
    ];
  }
  
  // Get current speed (magnitude of velocity)
  getSpeed(): number {
    return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
  }
  
  // Get car position
  getPosition(): Vector2D {
    return { x: this.x, y: this.y };
  }
  
  // Get car dimensions
  getDimensions(): { width: number, height: number } {
    return { width: this.width, height: this.height };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    // Car body
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    // Car details (windows, lights, etc.)
    ctx.fillStyle = 'lightblue';
    ctx.fillRect(-this.width / 2 + 5, -this.height / 2 + 5, this.width - 10, this.height / 3);
    
    // Headlights
    ctx.fillStyle = 'yellow';
    ctx.fillRect(-this.width / 2 + 5, -this.height / 2 + this.height - 10, 8, 5);
    ctx.fillRect(this.width / 2 - 13, -this.height / 2 + this.height - 10, 8, 5);
    
    // Draw tire marks if drifting
    if (this.isDrifting()) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-this.width / 2, this.height / 2);
      ctx.lineTo(-this.width / 2, this.height / 2 + 5);
      ctx.moveTo(this.width / 2, this.height / 2);
      ctx.lineTo(this.width / 2, this.height / 2 + 5);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  // Check if the car is drifting
  private isDrifting(): boolean {
    // Calculate lateral directions
    const rightX = Math.cos(this.rotation);
    const rightY = Math.sin(this.rotation);
    
    // Project velocity onto lateral direction
    const lateralVelocity = Math.abs(this.velocity.x * rightX + this.velocity.y * rightY);
    
    // Car is drifting if lateral velocity is significant
    return lateralVelocity > 50;
  }
}
