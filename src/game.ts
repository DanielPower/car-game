import Matter from "matter-js";
import { Car } from "./car";
import { PlayerAI } from "./ai/PlayerAI";

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cars: Car[] = [];
  engine: Matter.Engine;
  render: Matter.Render;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
    });
    this.render = Matter.Render.create({
      canvas: this.canvas,
      engine: this.engine,
    });
    this.cars.push(
      new Car({
        engine: this.engine,
        inputController: new PlayerAI(),
        x: 100,
        y: 100,
      }),
    );
  }

  update(dt: number): void {
    Matter.Engine.update(this.engine, dt);
    for (const car of this.cars) {
      car.update(dt);
    }
  }

  draw(): void {
    Matter.Render.world(this.render);
  }
}
