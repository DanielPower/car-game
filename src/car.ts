import Matter from "matter-js";
import type { CarAI } from "./ai/CarAI";

const applyLateralFriction = (wheel: Matter.Body, gripStrength: number) => {
  const velocity = wheel.velocity;

  // Get the wheel's right vector
  const angle = wheel.angle;
  const right = {
    x: Math.cos(angle + Math.PI / 2),
    y: Math.sin(angle + Math.PI / 2),
  };

  // Project velocity onto right vector
  const lateralSpeed = velocity.x * right.x + velocity.y * right.y;

  // Compute desired impulse to cancel that motion
  const impulse = -lateralSpeed * wheel.mass;

  // Cap impulse to simulate slipping
  const maxImpulse = gripStrength * wheel.mass;
  const clippedImpulse = Math.max(-maxImpulse, Math.min(impulse, maxImpulse));

  const lateralImpulse = {
    x: right.x * clippedImpulse,
    y: right.y * clippedImpulse,
  };

  Matter.Body.applyForce(wheel, wheel.position, lateralImpulse);
};

export class Car {
  engine: Matter.Engine;
  carBody: Matter.Body;
  rearWheels: Matter.Body[];
  frontWheels: Matter.Body[];
  constraints: Matter.Constraint[];
  inputController: CarAI;
  constructor({
    engine,
    inputController,
    x,
    y,
  }: {
    engine: Matter.Engine;
    inputController: CarAI;
    x: number;
    y: number;
  }) {
    this.engine = engine;
    this.inputController = inputController;
    const group = Matter.Body.nextGroup(true);
    this.carBody = Matter.Bodies.rectangle(x, y, 50, 20, {
      label: "car",
      collisionFilter: { group: group },
    });
    this.rearWheels = [
      Matter.Bodies.rectangle(x - 20, y - 13, 20, 10, {
        label: "wheel",
        collisionFilter: { group: group },
      }),
      Matter.Bodies.rectangle(x - 20, y + 13, 20, 10, {
        label: "wheel",
        collisionFilter: { group: group },
      }),
    ];
    this.frontWheels = [
      Matter.Bodies.rectangle(x + 20, y - 10, 20, 10, {
        label: "wheel",
        collisionFilter: { group: group },
      }),
      Matter.Bodies.rectangle(x + 20, y + 10, 20, 10, {
        label: "wheel",
        collisionFilter: { group: group },
      }),
    ];
    this.constraints = [
      Matter.Constraint.create({
        bodyA: this.carBody,
        bodyB: this.rearWheels[0],
        pointA: { x: -20, y: -13 },
        pointB: { x: 0, y: 0 },
      }),
      Matter.Constraint.create({
        bodyA: this.carBody,
        bodyB: this.rearWheels[1],
        pointA: { x: -20, y: 13 },
        pointB: { x: 0, y: 0 },
      }),
      Matter.Constraint.create({
        bodyA: this.carBody,
        bodyB: this.frontWheels[0],
        pointA: { x: 20, y: -10 },
        pointB: { x: 0, y: 0 },
      }),
      Matter.Constraint.create({
        bodyA: this.carBody,
        bodyB: this.frontWheels[1],
        pointA: { x: 20, y: 10 },
        pointB: { x: 0, y: 0 },
      }),
    ];
    Matter.Composite.add(engine.world, [
      this.carBody,
      ...this.rearWheels,
      ...this.frontWheels,
      ...this.constraints,
    ]);
  }

  update(dt: number) {
    const inputs = this.inputController.process({
      x: this.carBody.position.x,
      y: this.carBody.position.y,
      speed: this.carBody.speed,
      rotation: this.carBody.angle,
      width: 50,
      height: 20,
      roadWidth: 800,
      roadHeight: 600,
      deltaTime: dt,
    });

    [...this.rearWheels, ...this.frontWheels].forEach((wheel) => {
      Matter.Body.setAngle(wheel, this.carBody.angle);
    });
    this.frontWheels.forEach((wheel) => {
      if (inputs.turnLeft) {
        Matter.Body.setAngle(wheel, this.carBody.angle - Math.PI / 5);
      }
      if (inputs.turnRight) {
        Matter.Body.setAngle(wheel, this.carBody.angle + Math.PI / 5);
      }
    });
    [...this.rearWheels, ...this.frontWheels].forEach((wheel) => {
      applyLateralFriction(wheel, 0.0002 * dt);
    });
    this.rearWheels.forEach((wheel) => {
      if (inputs.accelerate) {
        const driveForce = 0.0001 * dt; // Tune this
        const forward = {
          x: Math.cos(wheel.angle) * driveForce,
          y: Math.sin(wheel.angle) * driveForce,
        };
        Matter.Body.applyForce(wheel, wheel.position, forward);
      }
    });
  }
}
