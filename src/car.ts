import * as RAPIER from "@dimforge/rapier2d-compat";
import { COLLISION_GROUPS } from "./game";
import type { CarAI } from "./ai/CarAI";
import * as vec from "./utils/math";
import type { Vec2, LevelConfig } from "./types";
import { isPointOnRoad } from "./utils/road";

interface WheelConfig {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  wheelType: "front" | "rear";
}

const applyLateralFriction = (
  wheel: RAPIER.RigidBody,
  gripStrength: number,
) => {
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
  wheel.applyImpulse(
    new RAPIER.Vector2(lateralImpulse.x, lateralImpulse.y),
    true,
  );
};

type WheelBody = RAPIER.RigidBody & {
  userData: { type: "wheel"; wheelType: "front" | "rear" };
};

export class Car {
  world: RAPIER.World;
  carBody: RAPIER.RigidBody;
  carCollider: RAPIER.Collider;
  wheels: WheelBody[];
  wheelColliders: RAPIER.Collider[];
  joints: RAPIER.ImpulseJoint[];
  inputController: CarAI;
  physicsScale: number;
  level: LevelConfig;
  carWidth: number = 50;
  carHeight: number = 20;
  wheelWidth: number = 20;
  wheelHeight: number = 10;
  carMass: number = 10;
  wheelMass: number = 1;

  constructor({
    world,
    inputController,
    x,
    y,
    physicsScale,
    level,
  }: {
    world: RAPIER.World;
    inputController: CarAI;
    x: number;
    y: number;
    physicsScale: number;
    level: LevelConfig;
  }) {
    this.world = world;
    this.inputController = inputController;
    this.physicsScale = physicsScale;
    this.level = level;

    const carBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y);
    this.carBody = this.world.createRigidBody(carBodyDesc);
    this.carBody.setAdditionalMass(this.carMass, false);

    const carColliderDesc = RAPIER.ColliderDesc.cuboid(
      this.carWidth / this.physicsScale / 2,
      this.carHeight / this.physicsScale / 2,
    )
      .setCollisionGroups(
        // Car is in CAR group and can collide with WALL group but not WHEEL group
        (COLLISION_GROUPS.CAR << 16) | COLLISION_GROUPS.WALL,
      )
      .setFriction(0.2);
    this.carCollider = this.world.createCollider(carColliderDesc, this.carBody);

    this.wheels = [];
    this.wheelColliders = [];
    this.joints = [];

    const wheelConfigs: WheelConfig[] = [
      {
        offsetX: -20,
        offsetY: -13,
        width: this.wheelWidth,
        height: this.wheelHeight,
        wheelType: "rear",
      },
      {
        offsetX: -20,
        offsetY: 13,
        width: this.wheelWidth,
        height: this.wheelHeight,
        wheelType: "rear",
      },
      {
        offsetX: 20,
        offsetY: -10,
        width: this.wheelWidth,
        height: this.wheelHeight,
        wheelType: "front",
      },
      {
        offsetX: 20,
        offsetY: 10,
        width: this.wheelWidth,
        height: this.wheelHeight,
        wheelType: "front",
      },
    ];

    wheelConfigs.forEach((config) => {
      this.createWheel(x, y, config);
    });
  }

  private createWheel(carX: number, carY: number, config: WheelConfig): void {
    const wheelX = carX + config.offsetX / this.physicsScale;
    const wheelY = carY + config.offsetY / this.physicsScale;
    const wheelDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(wheelX, wheelY)
      .setUserData({ type: "wheel", wheelType: config.wheelType });
    const wheel = this.world.createRigidBody(wheelDesc) as WheelBody;
    wheel.setAdditionalMass(this.wheelMass, false);

    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      config.width / this.physicsScale / 2,
      config.height / this.physicsScale / 2,
    )
      .setCollisionGroups(
        // Wheel is in WHEEL group and can collide with WALL group but not CAR group
        (COLLISION_GROUPS.WHEEL << 16) | COLLISION_GROUPS.WALL,
      )
      .setFriction(0.7);
    const collider = this.world.createCollider(colliderDesc, wheel);

    this.wheels.push(wheel);
    this.wheelColliders.push(collider);

    // Create joint to attach wheel to car body
    const jointDesc = RAPIER.JointData.revolute(
      new RAPIER.Vector2(
        config.offsetX / this.physicsScale,
        config.offsetY / this.physicsScale,
      ),
      new RAPIER.Vector2(0, 0),
    );
    const joint = this.world.createImpulseJoint(
      jointDesc,
      this.carBody,
      wheel,
      true,
    );
    this.joints.push(joint);
  }

  getWheelPosition(wheel: RAPIER.RigidBody): Vec2 {
    const pos = wheel.translation();
    return {
      x: pos.x * this.physicsScale,
      y: pos.y * this.physicsScale,
    };
  }

  isWheelOnRoad(wheel: RAPIER.RigidBody): boolean {
    const wheelPos = this.getWheelPosition(wheel);
    return isPointOnRoad(wheelPos, this.level);
  }

  update(dt: number, nextWaypoint?: { x: number; y: number }): void {
    const carPosition = this.carBody.translation();
    const carRotation = this.carBody.rotation();
    const carVelocity = this.carBody.linvel();
    const speed = vec.length({ x: carVelocity.x, y: carVelocity.y });

    // Use default waypoint if none provided (center of road ahead)
    const defaultWaypoint = {
      x: carPosition.x * this.physicsScale,
      y: (carPosition.y * this.physicsScale) + 100
    };

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
      nextWaypointX: nextWaypoint?.x ?? defaultWaypoint.x,
      nextWaypointY: nextWaypoint?.y ?? defaultWaypoint.y,
      deltaTime: dt
    });

    const steeringRadians = (inputs.steeringAngle * Math.PI) / 5; // scale -1...1 to -π/5...π/5
    this.wheels.forEach((wheel, index) => {
      const isOnRoad = this.isWheelOnRoad(wheel);
      const wheelFriction = isOnRoad
        ? this.level.roadFriction
        : this.level.offRoadFriction;

      this.wheelColliders[index].setFriction(wheelFriction);

      wheel.setRotation(carRotation, true);
      if (wheel.userData.wheelType === "front") {
        if (inputs.steeringAngle !== 0) {
          wheel.setRotation(carRotation + steeringRadians, true);
        }
      }

      const driveForce = 0.07 * dt;
      if (inputs.accelerate && wheel.userData.wheelType === "rear") {
        const forward = vec.fromAngle(wheel.rotation(), driveForce);
        wheel.applyImpulse(new RAPIER.Vector2(forward.x, forward.y), true);
      }
      if (wheel.userData.wheelType === "front") {
        applyLateralFriction(wheel, wheelFriction * 0.1 * dt);
      }
      if (wheel.userData.wheelType === "rear") {
        applyLateralFriction(wheel, wheelFriction * 0.07 * dt);
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.drawCarBody(ctx);
    this.drawWheels(ctx);
  }

  private drawCarBody(ctx: CanvasRenderingContext2D): void {
    const carPos = this.carBody.translation();
    const carAngle = this.carBody.rotation();

    ctx.save();
    ctx.translate(carPos.x * this.physicsScale, carPos.y * this.physicsScale);
    ctx.rotate(carAngle);

    // Main car body
    ctx.fillStyle = "#3498db";
    ctx.fillRect(
      -this.carWidth / 2,
      -this.carHeight / 2,
      this.carWidth,
      this.carHeight,
    );

    // Wheel status indicators
    this.wheels.forEach((wheel, index) => {
      const isOnRoad = this.isWheelOnRoad(wheel);

      // Position indicators at corners
      const offsetX = index < 2 ? -this.carWidth / 3 : this.carWidth / 3;
      const offsetY =
        index % 2 === 0 ? -this.carHeight / 3 : this.carHeight / 3;

      // Green for on-road, red for off-road
      ctx.fillStyle = isOnRoad ? "#2ecc71" : "#e74c3c";
      ctx.beginPath();
      ctx.arc(offsetX, offsetY, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  private drawWheels(ctx: CanvasRenderingContext2D): void {
    this.wheels.forEach((wheel) => {
      const wheelPos = wheel.translation();
      const wheelAngle = wheel.rotation();
      const isOnRoad = this.isWheelOnRoad(wheel);

      ctx.save();
      ctx.translate(
        wheelPos.x * this.physicsScale,
        wheelPos.y * this.physicsScale,
      );
      ctx.rotate(wheelAngle);

      // Border color indicates terrain (green=road, red=off-road)
      const borderColor = isOnRoad ? "#2ecc71" : "#e74c3c";
      const fillColor = "#2c3e50";

      // Draw wheel border
      ctx.fillStyle = borderColor;
      ctx.fillRect(
        -this.wheelWidth / 2 - 2,
        -this.wheelHeight / 2 - 2,
        this.wheelWidth + 4,
        this.wheelHeight + 4,
      );

      // Draw wheel center
      ctx.fillStyle = fillColor;
      ctx.fillRect(
        -this.wheelWidth / 2,
        -this.wheelHeight / 2,
        this.wheelWidth,
        this.wheelHeight,
      );

      // Draw friction indicator
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -this.wheelHeight / 2);
      ctx.lineTo(0, this.wheelHeight / 2);
      ctx.stroke();

      ctx.restore();
    });
  }
}
