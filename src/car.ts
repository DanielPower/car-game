import * as RAPIER from "@dimforge/rapier2d-compat";
import type { CarAI } from "./ai/CarAI";
import { isPointOnRoad } from "./levels/level1";
import * as vec from "./utils/math";
import type { Vec2 } from "./types";

interface WheelConfig {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  isFront: boolean;
}

/**
 * Apply lateral friction to a wheel to simulate tire grip
 */
const applyLateralFriction = (wheel: RAPIER.RigidBody, gripStrength: number) => {
  const velocity = wheel.linvel();
  const angle = wheel.rotation();
  
  // Get the wheel's right vector (perpendicular to forward direction)
  const right = vec.fromAngle(angle + Math.PI / 2);

  // Project velocity onto right vector to get lateral speed
  const lateralSpeed = vec.dot({ x: velocity.x, y: velocity.y }, right);

  // Compute impulse needed to counter lateral movement
  const mass = wheel.mass();
  const impulse = -lateralSpeed * mass;

  // Cap impulse to simulate slipping when exceeding grip
  const maxImpulse = gripStrength * mass;
  const clippedImpulse = Math.max(-maxImpulse, Math.min(impulse, maxImpulse));

  // Apply impulse to counter lateral movement
  const lateralImpulse = vec.multiply(right, clippedImpulse);
  wheel.applyImpulse(new RAPIER.Vector2(lateralImpulse.x, lateralImpulse.y), true);
};

export class Car {
  world: RAPIER.World;
  carBody: RAPIER.RigidBody;
  carCollider: RAPIER.Collider;
  rearWheels: RAPIER.RigidBody[];
  rearColliders: RAPIER.Collider[];
  frontWheels: RAPIER.RigidBody[];
  frontColliders: RAPIER.Collider[];
  joints: RAPIER.ImpulseJoint[];
  inputController: CarAI;
  physicsScale: number;
  // Car dimensions
  carWidth: number = 50;
  carHeight: number = 20;
  wheelWidth: number = 20;
  wheelHeight: number = 10;

  constructor({
    world,
    inputController,
    x,
    y,
    physicsScale,
  }: {
    world: RAPIER.World;
    inputController: CarAI;
    x: number;
    y: number;
    physicsScale: number;
  }) {
    this.world = world;
    this.inputController = inputController;
    this.physicsScale = physicsScale;
    
    // Create collision groups
    const carGroup = 1;
    
    // Create car body
    const carBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y);
    this.carBody = this.world.createRigidBody(carBodyDesc);
    
    // Car body collider
    const carColliderDesc = RAPIER.ColliderDesc.cuboid(
      this.carWidth / this.physicsScale / 2, 
      this.carHeight / this.physicsScale / 2
    )
    .setCollisionGroups(carGroup)
    .setFriction(0.2);
    this.carCollider = this.world.createCollider(carColliderDesc, this.carBody);
    
    // Initialize arrays
    this.rearWheels = [];
    this.rearColliders = [];
    this.frontWheels = [];
    this.frontColliders = [];
    this.joints = [];
    
    // Wheel configurations
    const wheelConfigs: WheelConfig[] = [
      // Rear wheels
      { offsetX: -20, offsetY: -13, width: this.wheelWidth, height: this.wheelHeight, isFront: false },
      { offsetX: -20, offsetY: 13, width: this.wheelWidth, height: this.wheelHeight, isFront: false },
      // Front wheels
      { offsetX: 20, offsetY: -10, width: this.wheelWidth, height: this.wheelHeight, isFront: true },
      { offsetX: 20, offsetY: 10, width: this.wheelWidth, height: this.wheelHeight, isFront: true },
    ];
    
    // Create all wheels
    wheelConfigs.forEach(config => {
      this.createWheel(x, y, config, carGroup);
    });
  }
  
  /**
   * Create a wheel with the given configuration
   */
  private createWheel(carX: number, carY: number, config: WheelConfig, carGroup: number): void {
    // Create wheel rigid body
    const wheelX = carX + config.offsetX / this.physicsScale;
    const wheelY = carY + config.offsetY / this.physicsScale;
    const wheelDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(wheelX, wheelY);
    const wheel = this.world.createRigidBody(wheelDesc);
    
    // Create wheel collider
    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      config.width / this.physicsScale / 2,
      config.height / this.physicsScale / 2
    )
    .setCollisionGroups(carGroup)
    .setFriction(0.7);
    const collider = this.world.createCollider(colliderDesc, wheel);
    
    // Add wheel to appropriate arrays
    if (config.isFront) {
      this.frontWheels.push(wheel);
      this.frontColliders.push(collider);
    } else {
      this.rearWheels.push(wheel);
      this.rearColliders.push(collider);
    }
    
    // Create joint to attach wheel to car body
    const jointDesc = RAPIER.JointData.revolute(
      new RAPIER.Vector2(config.offsetX / this.physicsScale, config.offsetY / this.physicsScale),
      new RAPIER.Vector2(0, 0)
    );
    const joint = this.world.createImpulseJoint(jointDesc, this.carBody, wheel, true);
    this.joints.push(joint);
  }

  /**
   * Set friction for a specific wheel
   */
  setWheelFriction(collider: RAPIER.Collider, friction: number): void {
    collider.setFriction(friction);
  }
  
  /**
   * Get the position of a wheel in world space (pixels)
   */
  getWheelPosition(wheel: RAPIER.RigidBody): Vec2 {
    const pos = wheel.translation();
    return {
      x: pos.x * this.physicsScale,
      y: pos.y * this.physicsScale
    };
  }
  
  /**
   * Check if a wheel is currently on the road
   */
  isWheelOnRoad(wheel: RAPIER.RigidBody): boolean {
    const wheelPos = this.getWheelPosition(wheel);
    return isPointOnRoad(wheelPos, this.inputController.levelData);
  }
  
  /**
   * Get all wheels as a single array
   */
  getAllWheels(): RAPIER.RigidBody[] {
    return [...this.rearWheels, ...this.frontWheels];
  }
  
  /**
   * Get wheel collider for a given wheel index (counting all wheels)
   */
  getWheelCollider(wheelIndex: number): RAPIER.Collider {
    return wheelIndex < this.rearWheels.length
      ? this.rearColliders[wheelIndex]
      : this.frontColliders[wheelIndex - this.rearWheels.length];
  }

  update(dt: number): void {
    const carPosition = this.carBody.translation();
    const carRotation = this.carBody.rotation();
    const carVelocity = this.carBody.linvel();
    const speed = vec.length({ x: carVelocity.x, y: carVelocity.y });
    
    // Process AI/player inputs
    const inputs = this.inputController.process({
      x: carPosition.x * this.physicsScale,
      y: carPosition.y * this.physicsScale,
      speed: speed * this.physicsScale,
      rotation: carRotation,
      width: this.carWidth,
      height: this.carHeight,
      roadWidth: 800,
      roadHeight: 600,
      deltaTime: dt,
      level: this.inputController.levelData,
    });

    // Set base wheel angles to match car rotation
    this.getAllWheels().forEach((wheel) => {
      wheel.setRotation(carRotation, true);
    });
    
    // Apply steering to front wheels
    if (inputs.steeringAngle !== 0) {
      const steeringRadians = inputs.steeringAngle * Math.PI / 5; // scale -1...1 to -π/5...π/5
      this.frontWheels.forEach((wheel) => {
        wheel.setRotation(carRotation + steeringRadians, true);
      });
    }
    
    // Apply friction to all wheels based on terrain
    this.getAllWheels().forEach((wheel, index) => {
      const isOnRoad = this.isWheelOnRoad(wheel);
      const wheelFriction = isOnRoad 
        ? this.inputController.levelData.roadFriction
        : this.inputController.levelData.offRoadFriction;
      
      // Update physics friction
      const collider = this.getWheelCollider(index);
      this.setWheelFriction(collider, wheelFriction);
      
      // Apply lateral friction for grip simulation
      applyLateralFriction(wheel, wheelFriction * 0.1 * dt);
    });
    
    // Apply drive force to rear wheels
    if (inputs.accelerate) {
      const driveForce = 0.1 * dt;
      this.rearWheels.forEach((wheel) => {
        const forward = vec.fromAngle(wheel.rotation(), driveForce);
        wheel.applyImpulse(
          new RAPIER.Vector2(forward.x, forward.y), 
          true
        );
      });
    }
  }

  /**
   * Draw the car and wheels
   */
  draw(ctx: CanvasRenderingContext2D): void {
    this.drawCarBody(ctx);
    this.drawWheels(ctx);
  }
  
  /**
   * Draw the car body with wheel status indicators
   */
  private drawCarBody(ctx: CanvasRenderingContext2D): void {
    const carPos = this.carBody.translation();
    const carAngle = this.carBody.rotation();
    
    ctx.save();
    ctx.translate(carPos.x * this.physicsScale, carPos.y * this.physicsScale);
    ctx.rotate(carAngle);
    
    // Main car body
    ctx.fillStyle = '#3498db';
    ctx.fillRect(-this.carWidth/2, -this.carHeight/2, this.carWidth, this.carHeight);
    
    // Wheel status indicators
    this.getAllWheels().forEach((wheel, index) => {
      const isOnRoad = this.isWheelOnRoad(wheel);
      
      // Position indicators at corners
      const offsetX = index < 2 ? -this.carWidth/3 : this.carWidth/3;
      const offsetY = index % 2 === 0 ? -this.carHeight/3 : this.carHeight/3;
      
      // Green for on-road, red for off-road
      ctx.fillStyle = isOnRoad ? '#2ecc71' : '#e74c3c';
      ctx.beginPath();
      ctx.arc(offsetX, offsetY, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  }
  
  /**
   * Draw all wheels with terrain indicators
   */
  private drawWheels(ctx: CanvasRenderingContext2D): void {
    this.getAllWheels().forEach((wheel) => {
      const wheelPos = wheel.translation();
      const wheelAngle = wheel.rotation();
      const isOnRoad = this.isWheelOnRoad(wheel);
      
      ctx.save();
      ctx.translate(wheelPos.x * this.physicsScale, wheelPos.y * this.physicsScale);
      ctx.rotate(wheelAngle);
      
      // Border color indicates terrain (green=road, red=off-road)
      const borderColor = isOnRoad ? '#2ecc71' : '#e74c3c';
      const fillColor = '#2c3e50';
      
      // Draw wheel border
      ctx.fillStyle = borderColor;
      ctx.fillRect(
        -this.wheelWidth/2 - 2, 
        -this.wheelHeight/2 - 2, 
        this.wheelWidth + 4, 
        this.wheelHeight + 4
      );
      
      // Draw wheel center
      ctx.fillStyle = fillColor;
      ctx.fillRect(
        -this.wheelWidth/2, 
        -this.wheelHeight/2, 
        this.wheelWidth, 
        this.wheelHeight
      );
      
      // Draw friction indicator
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -this.wheelHeight/2);
      ctx.lineTo(0, this.wheelHeight/2);
      ctx.stroke();
      
      ctx.restore();
    });
  }
}
