import { Car } from './car';
import { Road } from './road';
import { PlayerAI } from './ai/PlayerAI';
import { SimpleAI } from './ai/SimpleAI';
import { loadWasmAI } from './ai/loadWasmAI';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private playerCar: Car | null = null;
  private aiCars: Car[] = [];
  private road: Road;
  private lastTime: number = 0;
  private running: boolean = false;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    
    this.road = new Road(this.canvas.width, this.canvas.height);
    
    // Initialize cars with AI controllers
    this.initializeCars();
  }
  
  private async initializeCars() {
    try {
      // Create player car with PlayerAI
      this.playerCar = new Car(
        this.canvas.width / 2, 
        this.canvas.height - 100, 
        40, 
        80,
        'blue'
      );
      
      // Set up the PlayerAI controller directly
      const playerAI = new PlayerAI();
      this.playerCar.setAI(playerAI);
      
      // Create the first AI car with SimpleAI (positioned on the left)
      const aiCar1 = new Car(
        this.canvas.width / 2 - 150,
        this.canvas.height - 300,
        40,
        80,
        'red'
      );
      
      // Set up the SimpleAI directly
      const simpleAI = new SimpleAI();
      aiCar1.setAI(simpleAI);
      this.aiCars.push(aiCar1);
      
      // Create the second AI car with WASM AI (positioned on the right)
      // We'll try to load a WASM AI, but handle the case where the file doesn't exist yet
      try {
        const aiCar2 = new Car(
          this.canvas.width / 2 + 150,
          this.canvas.height - 300,
          40,
          80,
          'green'
        );
        
        // Load WASM AI using the dedicated function
        const wasmAI = await loadWasmAI('/wasm/sample_ai.wasm');
        aiCar2.setAI(wasmAI);
        this.aiCars.push(aiCar2);
        console.log('WASM AI loaded successfully');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('WASM AI not available yet:', errorMessage);
      }
      
      console.log('Cars initialized successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to initialize cars:', errorMessage);
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
    if (this.playerCar) {
      this.playerCar.update(deltaTime);
    }
    
    // Update AI cars
    for (const aiCar of this.aiCars) {
      aiCar.update(deltaTime);
    }
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.road.draw(this.ctx);
    
    // Draw player car
    if (this.playerCar) {
      this.playerCar.draw(this.ctx);
    }
    
    // Draw AI cars
    for (const aiCar of this.aiCars) {
      aiCar.draw(this.ctx);
    }
  }
}
