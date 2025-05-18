import * as RAPIER from "@dimforge/rapier2d-compat";
import { Car } from "./car";
import { PlayerAI } from "./ai/PlayerAI";

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cars: Car[] = [];
  world!: RAPIER.World; // Using definite assignment assertion
  physicsScale: number = 30; // pixels per meter

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    
    // Initialize Rapier physics world
    RAPIER.init().then(() => {
      const gravity = { x: 0, y: 0 };
      this.world = new RAPIER.World(gravity);
      
      this.cars.push(
        new Car({
          world: this.world,
          inputController: new PlayerAI(),
          x: 100 / this.physicsScale,
          y: 100 / this.physicsScale,
          physicsScale: this.physicsScale
        }),
      );
    });
  }

  update(dt: number): void {
    if (this.world) {
      this.world.step();
      for (const car of this.cars) {
        car.update(dt);
      }
    }
  }

  draw(): void {
    if (!this.world) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Custom rendering of the physics world
    for (const car of this.cars) {
      car.draw(this.ctx);
    }
  }
}
