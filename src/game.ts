import { Car } from './car';
import { Road } from './road';
import { InputHandler } from './input';
import { AIFactory, AIType } from './ai/AIFactory';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private playerCar: Car;
  private aiCars: Car[] = [];
  private road: Road;
  private inputHandler: InputHandler;
  private lastTime: number = 0;
  private running: boolean = false;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    
    this.road = new Road(this.canvas.width, this.canvas.height);
    
    // Create player car
    this.playerCar = new Car(
      this.canvas.width / 2, 
      this.canvas.height - 100, 
      40, 
      80,
      'blue'
    );
    
    this.inputHandler = new InputHandler();
    
    // Initialize AI cars
    this.initializeAICars();
  }
  
  private async initializeAICars() {
    try {
      // Create an AI car with SimpleAI
      const aiCar1 = new Car(
        this.canvas.width / 2 - 100,
        this.canvas.height - 300,
        40,
        80,
        'red'
      );
      
      // Set up the SimpleAI
      const simpleAI = await AIFactory.createAI(AIType.SIMPLE);
      aiCar1.setAI(simpleAI);
      this.aiCars.push(aiCar1);
      
      // In a real competition, you would load WASM AI here
      // Example (commented out as we don't have the WASM file yet):
      /*
      const aiCar2 = new Car(
        this.canvas.width / 2 + 100,
        this.canvas.height - 300,
        40,
        80,
        'green'
      );
      
      const wasmAI = await AIFactory.createAI(AIType.WASM, { 
        wasmUrl: '/wasm/sample_ai.wasm' 
      });
      aiCar2.setAI(wasmAI);
      this.aiCars.push(aiCar2);
      */
      
      console.log('AI cars initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI cars:', error);
    }
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
    // Update player car
    this.playerCar.update(this.inputHandler.keys, deltaTime);
    
    // Update AI cars
    for (const aiCar of this.aiCars) {
      aiCar.update(new Set(), deltaTime); // Empty keys set as AI controls the car
    }
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.road.draw(this.ctx);
    
    // Draw player car
    this.playerCar.draw(this.ctx);
    
    // Draw AI cars
    for (const aiCar of this.aiCars) {
      aiCar.draw(this.ctx);
    }
  }
}
