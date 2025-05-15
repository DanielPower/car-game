import { Car } from './car';
import { Road } from './road';
import { InputHandler } from './input';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private car: Car;
  private road: Road;
  private inputHandler: InputHandler;
  private lastTime: number = 0;
  private running: boolean = false;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    
    this.road = new Road(this.canvas.width, this.canvas.height);
    this.car = new Car(
      this.canvas.width / 2, 
      this.canvas.height - 100, 
      40, 
      80
    );
    this.inputHandler = new InputHandler();
  }

  start(): void {
    this.running = true;
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private gameLoop(timestamp: number): void {
    if (!this.running) return;
    
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    this.update(deltaTime / 1000);
    this.render();
    
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private update(deltaTime: number): void {
    this.car.update(this.inputHandler.keys, deltaTime);
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.road.draw(this.ctx);
    this.car.draw(this.ctx);
  }
}
