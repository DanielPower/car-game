import * as Matter from 'matter-js';
import type { CarAI, CarAIInput, CarAIOutput } from '../ai/CarAI';

export class PhysicsCar {
  // Matter.js objects
  private body: Matter.Body;
  
  // Car properties
  private width: number;
  private height: number;
  private color: string;
  private maxSpeed: number = 2.0; // Further reduced max speed
  private enginePower: number = 0.008; // Further reduced engine power
  private reverseEnginePower: number = 0.006; // Power for reversing (slightly less than forward)
  private brakePower: number = 0.02; // Reduced brake power
  private frictionAir: number = 0.12; // Significantly increased air friction
  private angularFriction: number = 0.15; // Increased angular friction
  private steeringPower: number = 0.01; // Further reduced steering power
  
  // AI controller
  private ai: CarAI | null = null;

  constructor(world: Matter.World, x: number, y: number, width: number, height: number, color: string = 'red') {
    this.width = width;
    this.height = height;
    this.color = color;

    // Create a rectangular body for the car
    this.body = Matter.Bodies.rectangle(x, y, width, height, {
      frictionAir: this.frictionAir,
      friction: 0.04, // Increased ground friction
      restitution: 0.1, // Reduced bounciness
      density: 0.0025, // Slightly increased density for more weight
      chamfer: { radius: 5 }, // Slightly rounded corners
    });

    // Add the body to the world
    Matter.Composite.add(world, this.body);
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
      x: this.body.position.x,
      y: this.body.position.y,
      speed: this.getSpeed(),
      rotation: this.body.angle,
      width: this.width,
      height: this.height,
      roadWidth: 800, // Should come from road
      roadHeight: 600, // Should come from road
      deltaTime: deltaTime
    };

    // Get AI decision
    const output = this.ai.process(input);

    // Apply forces based on AI output
    this.applyControls(output);
  }

  private applyControls(controls: CarAIOutput): void {
    // Get the forward direction vector based on car's angle
    const forwardX = Math.sin(this.body.angle);
    const forwardY = -Math.cos(this.body.angle);

    // Calculate current velocity in car's local frame
    const velocity = this.body.velocity;
    const currentSpeed = this.getSpeed();
    
    // Calculate dot product to determine if car is moving forward or backward
    const dotProduct = forwardX * velocity.x + forwardY * velocity.y;
    const isMovingForward = dotProduct > 0;

    // Apply acceleration force
    if (controls.accelerate) {
      // Apply less force at higher speeds for more control
      const speedFactor = Math.max(0.4, 1 - (currentSpeed / this.maxSpeed));
      const forceMagnitude = this.enginePower * this.body.mass * speedFactor;
      
      Matter.Body.applyForce(
        this.body,
        this.body.position,
        { x: forwardX * forceMagnitude, y: forwardY * forceMagnitude }
      );
    }

    // Apply reverse force or braking force
    if (controls.brake) {
      if (currentSpeed < 0.2) {
        // If nearly stopped, apply reverse force
        const reverseForceMagnitude = this.reverseEnginePower * this.body.mass;
        Matter.Body.applyForce(
          this.body,
          this.body.position,
          { 
            x: -forwardX * reverseForceMagnitude, 
            y: -forwardY * reverseForceMagnitude 
          }
        );
      } else {
        // If moving, apply braking force in the opposite direction of current velocity
        const brakeForceMagnitude = this.brakePower * this.body.mass;

        // Only apply braking if speed is significant
        if (currentSpeed > 0.1) {
          const normalizedVelocityX = velocity.x / currentSpeed;
          const normalizedVelocityY = velocity.y / currentSpeed;

          Matter.Body.applyForce(
            this.body,
            this.body.position,
            { 
              x: -normalizedVelocityX * brakeForceMagnitude, 
              y: -normalizedVelocityY * brakeForceMagnitude 
            }
          );
        }
      }
    }

    // Apply steering torque
    let steeringInput = 0;
    if (controls.turnLeft) steeringInput -= 1;
    if (controls.turnRight) steeringInput += 1;

    // Steering effectiveness is proportional to speed but with a minimum value
    const steeringEffectiveness = Math.min(1, Math.max(0.3, currentSpeed / 2));
    
    // Reduce steering power at very high speeds
    const highSpeedFactor = currentSpeed > this.maxSpeed * 0.8 ? 0.7 : 1.0;
    
    // Apply torque for steering
    const torque = steeringInput * this.steeringPower * steeringEffectiveness * highSpeedFactor;
    Matter.Body.setAngularVelocity(this.body, this.body.angularVelocity + torque);

    // Apply angular friction (more when not steering)
    const angularDamping = steeringInput === 0 ? this.angularFriction * 1.2 : this.angularFriction;
    Matter.Body.setAngularVelocity(
      this.body, 
      this.body.angularVelocity * (1 - angularDamping)
    );

    // Limit maximum speed
    if (currentSpeed > this.maxSpeed) {
      const ratio = this.maxSpeed / currentSpeed;
      Matter.Body.setVelocity(this.body, {
        x: this.body.velocity.x * ratio,
        y: this.body.velocity.y * ratio
      });
    }
  }

  getSpeed(): number {
    const velocity = this.body.velocity;
    return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  }

  getPosition(): Matter.Vector {
    return this.body.position;
  }
  
  getAngle(): number {
    return this.body.angle;
  }
  
  draw(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.body.position;
    const angle = this.body.angle;
    
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
    // Get the car's forward direction
    const forwardX = Math.sin(this.body.angle);
    const forwardY = -Math.cos(this.body.angle);
    
    // Get the car's velocity direction
    const velocity = this.body.velocity;
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
    return angle > 0.2; // About 11.5 degrees
  }
}
