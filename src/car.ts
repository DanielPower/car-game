import * as RAPIER from "@dimforge/rapier2d-compat";
import type { CarAI } from "./ai/CarAI";

const applyLateralFriction = (wheel: RAPIER.RigidBody, gripStrength: number) => {
  const velocity = wheel.linvel();

  // Get the wheel's right vector
  const angle = wheel.rotation();
  const right = {
    x: Math.cos(angle + Math.PI / 2),
    y: Math.sin(angle + Math.PI / 2),
  };

  // Project velocity onto right vector
  const lateralSpeed = velocity.x * right.x + velocity.y * right.y;

  // Compute desired impulse to cancel that motion
  const mass = wheel.mass();
  const impulse = -lateralSpeed * mass;

  // Cap impulse to simulate slipping
  const maxImpulse = gripStrength * mass;
  const clippedImpulse = Math.max(-maxImpulse, Math.min(impulse, maxImpulse));

  const lateralImpulse = {
    x: right.x * clippedImpulse,
    y: right.y * clippedImpulse,
  };

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
    // Create collision groups (in Rapier, we use collision groups differently)
    const carGroup = 1;
    
    // Car body rigid body descriptor
    const carBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y);
    this.carBody = this.world.createRigidBody(carBodyDesc);
    
    // Car body collider
    const carColliderDesc = RAPIER.ColliderDesc.cuboid(50/this.physicsScale/2, 20/this.physicsScale/2)
      .setCollisionGroups(carGroup)
      .setFriction(0.2);
    this.carCollider = this.world.createCollider(carColliderDesc, this.carBody);
    
    // Create rear wheels
    this.rearWheels = [];
    this.rearColliders = [];
    
    // Left rear wheel
    const leftRearWheelDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x - 20/this.physicsScale, y - 13/this.physicsScale);
    const leftRearWheel = this.world.createRigidBody(leftRearWheelDesc);
    const leftRearColliderDesc = RAPIER.ColliderDesc.cuboid(20/this.physicsScale/2, 10/this.physicsScale/2)
      .setCollisionGroups(carGroup)
      .setFriction(0.7);
    const leftRearCollider = this.world.createCollider(leftRearColliderDesc, leftRearWheel);
    this.rearWheels.push(leftRearWheel);
    this.rearColliders.push(leftRearCollider);
    
    // Right rear wheel
    const rightRearWheelDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x - 20/this.physicsScale, y + 13/this.physicsScale);
    const rightRearWheel = this.world.createRigidBody(rightRearWheelDesc);
    const rightRearColliderDesc = RAPIER.ColliderDesc.cuboid(20/this.physicsScale/2, 10/this.physicsScale/2)
      .setCollisionGroups(carGroup)
      .setFriction(0.7);
    const rightRearCollider = this.world.createCollider(rightRearColliderDesc, rightRearWheel);
    this.rearWheels.push(rightRearWheel);
    this.rearColliders.push(rightRearCollider);
    
    // Create front wheels
    this.frontWheels = [];
    this.frontColliders = [];
    
    // Left front wheel
    const leftFrontWheelDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x + 20/this.physicsScale, y - 10/this.physicsScale);
    const leftFrontWheel = this.world.createRigidBody(leftFrontWheelDesc);
    const leftFrontColliderDesc = RAPIER.ColliderDesc.cuboid(20/this.physicsScale/2, 10/this.physicsScale/2)
      .setCollisionGroups(carGroup)
      .setFriction(0.7);
    const leftFrontCollider = this.world.createCollider(leftFrontColliderDesc, leftFrontWheel);
    this.frontWheels.push(leftFrontWheel);
    this.frontColliders.push(leftFrontCollider);
    
    // Right front wheel
    const rightFrontWheelDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x + 20/this.physicsScale, y + 10/this.physicsScale);
    const rightFrontWheel = this.world.createRigidBody(rightFrontWheelDesc);
    const rightFrontColliderDesc = RAPIER.ColliderDesc.cuboid(20/this.physicsScale/2, 10/this.physicsScale/2)
      .setCollisionGroups(carGroup)
      .setFriction(0.7);
    const rightFrontCollider = this.world.createCollider(rightFrontColliderDesc, rightFrontWheel);
    this.frontWheels.push(rightFrontWheel);
    this.frontColliders.push(rightFrontCollider);
    
    // Create joints (constraints)
    this.joints = [];
    
    // Left rear joint
    const leftRearJointDesc = RAPIER.JointData.revolute(
      new RAPIER.Vector2(-20/this.physicsScale, -13/this.physicsScale),
      new RAPIER.Vector2(0, 0)
    );
    const leftRearJoint = this.world.createImpulseJoint(leftRearJointDesc, this.carBody, this.rearWheels[0], true);
    this.joints.push(leftRearJoint);
    
    // Right rear joint
    const rightRearJointDesc = RAPIER.JointData.revolute(
      new RAPIER.Vector2(-20/this.physicsScale, 13/this.physicsScale),
      new RAPIER.Vector2(0, 0)
    );
    const rightRearJoint = this.world.createImpulseJoint(rightRearJointDesc, this.carBody, this.rearWheels[1], true);
    this.joints.push(rightRearJoint);
    
    // Left front joint
    const leftFrontJointDesc = RAPIER.JointData.revolute(
      new RAPIER.Vector2(20/this.physicsScale, -10/this.physicsScale),
      new RAPIER.Vector2(0, 0)
    );
    const leftFrontJoint = this.world.createImpulseJoint(leftFrontJointDesc, this.carBody, this.frontWheels[0], true);
    this.joints.push(leftFrontJoint);
    
    // Right front joint
    const rightFrontJointDesc = RAPIER.JointData.revolute(
      new RAPIER.Vector2(20/this.physicsScale, 10/this.physicsScale),
      new RAPIER.Vector2(0, 0)
    );
    const rightFrontJoint = this.world.createImpulseJoint(rightFrontJointDesc, this.carBody, this.frontWheels[1], true);
    this.joints.push(rightFrontJoint);
  }

  update(dt: number) {
    const carPosition = this.carBody.translation();
    const carRotation = this.carBody.rotation();
    const carVelocity = this.carBody.linvel();
    const speed = Math.sqrt(carVelocity.x * carVelocity.x + carVelocity.y * carVelocity.y);
    
    const inputs = this.inputController.process({
      x: carPosition.x * this.physicsScale,
      y: carPosition.y * this.physicsScale,
      speed: speed * this.physicsScale,
      rotation: carRotation,
      width: 50,
      height: 20,
      roadWidth: 800,
      roadHeight: 600,
      deltaTime: dt,
    });

    // Set wheel angles
    [...this.rearWheels, ...this.frontWheels].forEach((wheel) => {
      wheel.setRotation(carRotation, true);
    });
    
    // Handle steering
    this.frontWheels.forEach((wheel) => {
      if (inputs.turnLeft) {
        wheel.setRotation(carRotation - Math.PI / 5, true);
      }
      if (inputs.turnRight) {
        wheel.setRotation(carRotation + Math.PI / 5, true);
      }
    });
    
    // Apply lateral friction to all wheels
    [...this.rearWheels, ...this.frontWheels].forEach((wheel) => {
      applyLateralFriction(wheel, 0.1 * dt);
    });
    
    // Apply drive force to rear wheels
    this.rearWheels.forEach((wheel) => {
      if (inputs.accelerate) {
        const driveForce = 0.1 * dt; // Tune this
        const forward = {
          x: Math.cos(wheel.rotation()) * driveForce,
          y: Math.sin(wheel.rotation()) * driveForce,
        };
        wheel.applyImpulse(new RAPIER.Vector2(forward.x, forward.y), true);
      }
    });
  }

  // Draw the car and wheels
  draw(ctx: CanvasRenderingContext2D) {
    // Draw car body
    const carPos = this.carBody.translation();
    const carAngle = this.carBody.rotation();
    const carWidth = 50;
    const carHeight = 20;
    
    ctx.save();
    ctx.translate(carPos.x * this.physicsScale, carPos.y * this.physicsScale);
    ctx.rotate(carAngle);
    
    // Car body
    ctx.fillStyle = '#3498db';
    ctx.fillRect(-carWidth/2, -carHeight/2, carWidth, carHeight);
    
    ctx.restore();
    
    // Draw wheels
    const wheelWidth = 20;
    const wheelHeight = 10;
    
    // Draw rear wheels
    this.rearWheels.forEach(wheel => {
      const wheelPos = wheel.translation();
      const wheelAngle = wheel.rotation();
      
      ctx.save();
      ctx.translate(wheelPos.x * this.physicsScale, wheelPos.y * this.physicsScale);
      ctx.rotate(wheelAngle);
      
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(-wheelWidth/2, -wheelHeight/2, wheelWidth, wheelHeight);
      
      ctx.restore();
    });
    
    // Draw front wheels
    this.frontWheels.forEach(wheel => {
      const wheelPos = wheel.translation();
      const wheelAngle = wheel.rotation();
      
      ctx.save();
      ctx.translate(wheelPos.x * this.physicsScale, wheelPos.y * this.physicsScale);
      ctx.rotate(wheelAngle);
      
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(-wheelWidth/2, -wheelHeight/2, wheelWidth, wheelHeight);
      
      ctx.restore();
    });
  }
}
