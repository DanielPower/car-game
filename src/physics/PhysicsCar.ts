import * as Matter from 'matter-js';
import type { CarAI, CarAIInput, CarAIOutput } from '../ai/CarAI';

export class PhysicsCar {
  // Car parts
  private carBody: Matter.Body;
  private wheels: {
    frontLeft: Matter.Body;
    frontRight: Matter.Body;
    rearLeft: Matter.Body;
    rearRight: Matter.Body;
  };
  private constraints: {
    frontLeft: Matter.Constraint;
    frontRight: Matter.Constraint;
    rearLeft: Matter.Constraint;
    rearRight: Matter.Constraint;
  };
  private composite: Matter.Composite;
  
  // Car dimensions
  private width: number;
  private height: number;
  private wheelBase: number; // Distance between front and rear wheels
  private trackWidth: number; // Distance between left and right wheels
  private wheelSize: number;
  private color: string;
  
  // Physics properties
  private maxSpeed: number = 3.0;
  private enginePower: number = 0.0015;
  private reverseEnginePower: number = 0.001;
  private brakePower: number = 0.02;
  private steeringAngle: number = 0.5; // Max steering angle in radians (about 28 degrees)
  private currentSteeringAngle: number = 0;
  private steeringSpeed: number = 0.05; // How quickly steering angle changes
  
  // AI controller
  private ai: CarAI | null = null;

  constructor(world: Matter.World, x: number, y: number, width: number, height: number, color: string = 'red') {
    this.width = width;
    this.height = height;
    this.color = color;
    
    // Calculate wheel dimensions based on car size
    this.wheelBase = height * 0.6;
    this.trackWidth = width * 0.8;
    this.wheelSize = width * 0.15;
    
    // Create composite to hold all car parts
    this.composite = Matter.Composite.create({ label: 'car' });
    
    // Create car body (chassis) - low friction since it doesn't touch the ground
    this.carBody = Matter.Bodies.rectangle(x, y, width, height, {
      collisionFilter: { group: -1 }, // Negative group means it won't collide with other bodies in the same group
      frictionAir: 0.01,
      friction: 0.0001, // Very low friction since it doesn't touch the ground
      restitution: 0.2,
      density: 0.002,
      chamfer: { radius: 10 },
      render: { fillStyle: color }
    });
    
    // Calculate wheel positions
    const halfTrackWidth = this.trackWidth / 2;
    const halfWheelBase = this.wheelBase / 2;
    
    // Create wheels with high friction
    this.wheels = {
      // Front wheels
      frontLeft: Matter.Bodies.circle(
        x - halfTrackWidth,
        y - halfWheelBase,
        this.wheelSize,
        {
          collisionFilter: { group: -1 },
          friction: 2.5,
          frictionAir: 0.01,
          density: 0.0015,
          restitution: 0.05,
          render: { fillStyle: '#333333' }
        }
      ),
      frontRight: Matter.Bodies.circle(
        x + halfTrackWidth,
        y - halfWheelBase,
        this.wheelSize,
        {
          collisionFilter: { group: -1 },
          friction: 2.5,
          frictionAir: 0.01,
          density: 0.0015,
          restitution: 0.05,
          render: { fillStyle: '#333333' }
        }
      ),
      
      // Rear wheels (drive wheels)
      rearLeft: Matter.Bodies.circle(
        x - halfTrackWidth,
        y + halfWheelBase,
        this.wheelSize,
        {
          collisionFilter: { group: -1 },
          friction: 2.0,
          frictionAir: 0.01,
          density: 0.0015,
          restitution: 0.05,
          render: { fillStyle: '#333333' }
        }
      ),
      rearRight: Matter.Bodies.circle(
        x + halfTrackWidth,
        y + halfWheelBase,
        this.wheelSize,
        {
          collisionFilter: { group: -1 },
          friction: 2.0,
          frictionAir: 0.01,
          density: 0.0015,
          restitution: 0.05,
          render: { fillStyle: '#333333' }
        }
      )
    };
    
    // Create constraints to attach wheels to the car body
    const stiffness = 0.2;
    const damping = 0.5;
    
    this.constraints = {
      frontLeft: Matter.Constraint.create({
        bodyA: this.carBody,
        bodyB: this.wheels.frontLeft,
        pointA: { x: -halfTrackWidth, y: -halfWheelBase },
        pointB: { x: 0, y: 0 },
        stiffness: stiffness,
        damping: damping,
        length: 0
      }),
      frontRight: Matter.Constraint.create({
        bodyA: this.carBody,
        bodyB: this.wheels.frontRight,
        pointA: { x: halfTrackWidth, y: -halfWheelBase },
        pointB: { x: 0, y: 0 },
        stiffness: stiffness,
        damping: damping,
        length: 0
      }),
      rearLeft: Matter.Constraint.create({
        bodyA: this.carBody,
        bodyB: this.wheels.rearLeft,
        pointA: { x: -halfTrackWidth, y: halfWheelBase },
        pointB: { x: 0, y: 0 },
        stiffness: stiffness,
        damping: damping,
        length: 0
      }),
      rearRight: Matter.Constraint.create({
        bodyA: this.carBody,
        bodyB: this.wheels.rearRight,
        pointA: { x: halfTrackWidth, y: halfWheelBase },
        pointB: { x: 0, y: 0 },
        stiffness: stiffness,
        damping: damping,
        length: 0
      })
    };
    
    // Add all parts to the composite
    Matter.Composite.add(this.composite, [
      this.carBody,
      this.wheels.frontLeft,
      this.wheels.frontRight,
      this.wheels.rearLeft,
      this.wheels.rearRight,
      this.constraints.frontLeft,
      this.constraints.frontRight,
      this.constraints.rearLeft,
      this.constraints.rearRight
    ]);
    
    // Add the composite to the world
    Matter.Composite.add(world, this.composite);
    
    // Set initial angle
    Matter.Body.setAngle(this.carBody, Math.PI * 1.5); // Point upward initially
  }

  setAI(ai: CarAI): void {
    this.ai = ai;
  }

  update(deltaTime: number): void {
    if (!this.ai) {
      console.warn('Car has no AI controller assigned');
      return;
    }

    // Prepare input for AI
    const input: CarAIInput = {
      x: this.carBody.position.x,
      y: this.carBody.position.y,
      speed: this.getSpeed(),
      rotation: this.carBody.angle,
      width: this.width,
      height: this.height,
      roadWidth: 800, // Should come from road
      roadHeight: 600, // Should come from road
      deltaTime: deltaTime
    };

    // Get AI decision
    const output = this.ai.process(input);

    // Apply forces based on AI output
    this.applyControls(output, deltaTime);
    
    // Update wheel positions and angles based on steering
    this.updateWheels();
  }

  private applyControls(controls: CarAIOutput, deltaTime: number): void {
    // Update steering angle based on input
    this.updateSteering(controls, deltaTime);
    
    // Get the forward direction vector of the car body
    const carAngle = this.carBody.angle;
    const forwardX = Math.sin(carAngle);
    const forwardY = -Math.cos(carAngle);
    
    // Calculate current speed
    const currentSpeed = this.getSpeed();
    
    // Calculate the car's current direction of travel
    const velocity = this.carBody.velocity;
    const dotProduct = forwardX * velocity.x + forwardY * velocity.y;
    const isMovingForward = dotProduct > 0;
    
    // Apply drive force to rear wheels (only when not braking)
    if (controls.accelerate && !controls.brake) {
      // Apply less force at higher speeds
      const speedFactor = Math.max(0.3, 1 - (currentSpeed / this.maxSpeed));
      const forceMagnitude = this.enginePower * speedFactor;
      
      // Apply force to both rear wheels
      this.applyForceToWheel(this.wheels.rearLeft, forwardX, forwardY, forceMagnitude);
      this.applyForceToWheel(this.wheels.rearRight, forwardX, forwardY, forceMagnitude);
    }
    
    // Apply reverse force or braking
    if (controls.brake) {
      // If nearly stopped or moving very slowly, apply reverse force
      if (currentSpeed < 0.3) {
        const reverseForceMagnitude = this.reverseEnginePower;
        this.applyForceToWheel(this.wheels.rearLeft, -forwardX, -forwardY, reverseForceMagnitude);
        this.applyForceToWheel(this.wheels.rearRight, -forwardX, -forwardY, reverseForceMagnitude);
      } 
      // If moving forward at moderate speed, apply braking
      else if (isMovingForward) {
        // Calculate braking force based on current speed
        // More gentle braking at higher speeds to prevent shaking
        const brakeFactor = Math.min(1, 0.7 + (currentSpeed / this.maxSpeed) * 0.3);
        const brakeForceMagnitude = this.brakePower * brakeFactor;
        
        // Apply braking as a velocity reduction rather than a force
        // This creates smoother deceleration without shaking
        const brakeRatio = Math.max(0, 1 - (brakeForceMagnitude * deltaTime * 10));
        
        // Apply to car body and all wheels
        Matter.Body.setVelocity(this.carBody, {
          x: velocity.x * brakeRatio,
          y: velocity.y * brakeRatio
        });
        
        // Apply to all wheels
        Object.values(this.wheels).forEach(wheel => {
          Matter.Body.setVelocity(wheel, {
            x: wheel.velocity.x * brakeRatio,
            y: wheel.velocity.y * brakeRatio
          });
        });
      }
      // If moving backward, apply forward force to slow down
      else if (!isMovingForward && currentSpeed > 0.3) {
        const brakeForceMagnitude = this.brakePower * 0.8;
        this.applyForceToWheel(this.wheels.rearLeft, forwardX, forwardY, brakeForceMagnitude);
        this.applyForceToWheel(this.wheels.rearRight, forwardX, forwardY, brakeForceMagnitude);
      }
    }
    
    // Limit maximum speed
    if (currentSpeed > this.maxSpeed) {
      const ratio = this.maxSpeed / currentSpeed;
      Matter.Body.setVelocity(this.carBody, {
        x: this.carBody.velocity.x * ratio,
        y: this.carBody.velocity.y * ratio
      });
      
      // Also limit wheel velocities
      Object.values(this.wheels).forEach(wheel => {
        Matter.Body.setVelocity(wheel, {
          x: wheel.velocity.x * ratio,
          y: wheel.velocity.y * ratio
        });
      });
    }
  }
  
  private updateSteering(controls: CarAIOutput, deltaTime: number): void {
    // Calculate target steering angle based on input
    let targetAngle = 0;
    
    if (controls.turnLeft) targetAngle = -this.steeringAngle;
    if (controls.turnRight) targetAngle = this.steeringAngle;
    
    // Gradually adjust current steering angle toward target
    const steeringDelta = this.steeringSpeed * deltaTime * 60; // Normalize by 60fps
    
    if (this.currentSteeringAngle < targetAngle) {
      this.currentSteeringAngle = Math.min(targetAngle, this.currentSteeringAngle + steeringDelta);
    } else if (this.currentSteeringAngle > targetAngle) {
      this.currentSteeringAngle = Math.max(targetAngle, this.currentSteeringAngle - steeringDelta);
    }
  }
  
  private updateWheels(): void {
    // Apply steering angle to front wheels
    const carAngle = this.carBody.angle;
    
    // Set front wheel angles based on steering
    Matter.Body.setAngle(this.wheels.frontLeft, carAngle + this.currentSteeringAngle);
    Matter.Body.setAngle(this.wheels.frontRight, carAngle + this.currentSteeringAngle);
    
    // Keep rear wheels aligned with car body
    Matter.Body.setAngle(this.wheels.rearLeft, carAngle);
    Matter.Body.setAngle(this.wheels.rearRight, carAngle);
    
    // Apply steering forces to create rotation
    if (Math.abs(this.currentSteeringAngle) > 0.01) {
      const speed = this.getSpeed();
      
      // Only apply steering when the car is moving
      if (speed > 0.1) {
        // Calculate the car's forward direction
        const carForwardX = Math.sin(carAngle);
        const carForwardY = -Math.cos(carAngle);
        
        // Calculate how much torque to apply based on speed and steering angle
        // Slower speeds allow for sharper turns
        const torqueFactor = 0.0004 * Math.min(1, 3 / speed); // Doubled for more responsive steering
        const torque = this.currentSteeringAngle * torqueFactor * speed;
        
        // Apply torque to the car body to make it rotate
        Matter.Body.setAngularVelocity(
          this.carBody,
          this.carBody.angularVelocity + torque
        );
        
        // Calculate how much the front wheels resist sideways motion
        // This creates the effect of the wheels gripping the road
        const wheelGrip = 0.5; // Increased from 0.2 for much better traction
        
        // Calculate the car's current velocity
        const velocity = this.carBody.velocity;
        
        // Calculate the component of velocity in the car's forward direction
        const forwardVelocity = carForwardX * velocity.x + carForwardY * velocity.y;
        
        // Calculate the new velocity that's more aligned with the car's orientation
        // This simulates the wheels gripping the road and preventing excessive sliding
        const newVelocityX = velocity.x * (1 - wheelGrip) + carForwardX * forwardVelocity * wheelGrip;
        const newVelocityY = velocity.y * (1 - wheelGrip) + carForwardY * forwardVelocity * wheelGrip;
        
        // Apply the adjusted velocity
        Matter.Body.setVelocity(this.carBody, { x: newVelocityX, y: newVelocityY });
        
        // Update wheel velocities to match the car body's movement
        Object.values(this.wheels).forEach(wheel => {
          // Calculate wheel's position relative to car body
          const relativeX = wheel.position.x - this.carBody.position.x;
          const relativeY = wheel.position.y - this.carBody.position.y;
          
          // Calculate wheel's velocity due to car's angular velocity
          const angularContribX = -this.carBody.angularVelocity * relativeY;
          const angularContribY = this.carBody.angularVelocity * relativeX;
          
          // Set wheel velocity to match car's velocity plus angular contribution
          Matter.Body.setVelocity(wheel, {
            x: newVelocityX + angularContribX,
            y: newVelocityY + angularContribY
          });
        });
      }
    }
  }
  
  private applyForceToWheel(wheel: Matter.Body, dirX: number, dirY: number, magnitude: number): void {
    Matter.Body.applyForce(wheel, wheel.position, {
      x: dirX * magnitude,
      y: dirY * magnitude
    });
  }
  
  // Note: The old applyBrakingForce method has been removed as it's no longer used.
  // Braking is now handled directly in the applyControls method using velocity reduction.

  getSpeed(): number {
    return Math.sqrt(
      this.carBody.velocity.x * this.carBody.velocity.x + 
      this.carBody.velocity.y * this.carBody.velocity.y
    );
  }

  getPosition(): Matter.Vector {
    return this.carBody.position;
  }
  
  getAngle(): number {
    return this.carBody.angle;
  }
  
  draw(ctx: CanvasRenderingContext2D): void {
    // Draw car body
    this.drawBody(ctx);
    
    // Draw wheels
    this.drawWheel(ctx, this.wheels.frontLeft);
    this.drawWheel(ctx, this.wheels.frontRight);
    this.drawWheel(ctx, this.wheels.rearLeft);
    this.drawWheel(ctx, this.wheels.rearRight);
  }
  
  private drawBody(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.carBody.position;
    const angle = this.carBody.angle;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
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
    
    ctx.restore();
  }
  
  private drawWheel(ctx: CanvasRenderingContext2D, wheel: Matter.Body): void {
    const { x, y } = wheel.position;
    const angle = wheel.angle;
    const radius = this.wheelSize;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Wheel body
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheel details (hub and spokes)
    ctx.fillStyle = '#888888';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Spokes
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const spokeAngle = i * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(spokeAngle) * radius, Math.sin(spokeAngle) * radius);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  isDrifting(): boolean {
    // Get the car's forward direction
    const forwardX = Math.sin(this.carBody.angle);
    const forwardY = -Math.cos(this.carBody.angle);
    
    // Get the car's velocity direction
    const velocity = this.carBody.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    
    if (speed < 1) return false;
    
    // Normalize velocity
    const normalizedVelocityX = velocity.x / speed;
    const normalizedVelocityY = velocity.y / speed;
    
    // Calculate the dot product between forward direction and velocity direction
    const dotProduct = forwardX * normalizedVelocityX + forwardY * normalizedVelocityY;
    
    // Calculate the angle between forward direction and velocity direction
    const angle = Math.acos(Math.min(1, Math.max(-1, dotProduct)));
    
    // Car is drifting if the angle is significant
    return angle > 0.3; // About 17 degrees
  }
}
