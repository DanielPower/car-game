import type { CarAI } from './ai/CarAI';

export class Car {
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private speed: number = 0;
  private maxSpeed: number = 300;
  private acceleration: number = 200;
  private deceleration: number = 150;
  private brakeForce: number = 400;
  private friction: number = 50;
  private rotation: number = 0;
  private rotationSpeed: number = 3;
  private ai: CarAI | null = null;
  private color: string;

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

  update(keys: Set<string>, deltaTime: number): void {
    if (this.ai) {
      this.handleAI(deltaTime);
    } else {
      this.handleInput(keys, deltaTime);
    }
    
    this.applyPhysics(deltaTime);
    this.updatePosition(deltaTime);
  }

  private handleAI(deltaTime: number): void {
    if (!this.ai) return;
    
    // Prepare input for AI
    const input = {
      x: this.x,
      y: this.y,
      speed: this.speed,
      rotation: this.rotation,
      width: this.width,
      height: this.height,
      roadWidth: 800, // Should come from road
      roadHeight: 600, // Should come from road
      deltaTime: deltaTime
    };
    
    // Get AI decision
    const output = this.ai.process(input);
    
    // Apply AI controls
    if (output.accelerate) {
      this.speed += this.acceleration * deltaTime;
    }
    
    if (output.brake) {
      if (this.speed > 0) {
        this.speed -= this.brakeForce * deltaTime;
      } else if (this.speed < 0) {
        this.speed += this.brakeForce * deltaTime;
      }
    }
    
    if (Math.abs(this.speed) > 0.1) {
      if (output.turnLeft) {
        this.rotation -= this.rotationSpeed * deltaTime * Math.sign(this.speed);
      }
      
      if (output.turnRight) {
        this.rotation += this.rotationSpeed * deltaTime * Math.sign(this.speed);
      }
    }
  }

  private handleInput(keys: Set<string>, deltaTime: number): void {
    if (keys.has('ArrowUp')) {
      this.speed += this.acceleration * deltaTime;
    }
    
    if (keys.has('ArrowDown')) {
      this.speed -= this.deceleration * deltaTime;
    }
    
    if (keys.has(' ')) { // Space bar for braking
      if (this.speed > 0) {
        this.speed -= this.brakeForce * deltaTime;
      } else if (this.speed < 0) {
        this.speed += this.brakeForce * deltaTime;
      }
    }
    
    if (Math.abs(this.speed) > 0.1) {
      if (keys.has('ArrowLeft')) {
        this.rotation -= this.rotationSpeed * deltaTime * Math.sign(this.speed);
      }
      
      if (keys.has('ArrowRight')) {
        this.rotation += this.rotationSpeed * deltaTime * Math.sign(this.speed);
      }
    }
  }

  private applyPhysics(deltaTime: number): void {
    if (Math.abs(this.speed) < 0.1) {
      this.speed = 0;
    } else {
      const frictionForce = Math.sign(this.speed) * this.friction * deltaTime;
      this.speed -= frictionForce;
    }
    
    this.speed = Math.max(-this.maxSpeed / 2, Math.min(this.maxSpeed, this.speed));
  }

  private updatePosition(deltaTime: number): void {
    const moveX = Math.sin(this.rotation) * this.speed * deltaTime;
    const moveY = Math.cos(this.rotation) * this.speed * deltaTime;
    
    this.x += moveX;
    this.y -= moveY;
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
    
    ctx.restore();
  }
}
