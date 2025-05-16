import { Car } from './car';
import { Road } from './road';
import { Wall } from './wall';
import { PlayerAI } from './ai/PlayerAI';
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
    
    // Create a circuit track by default
    this.road = new Road(this.canvas.width, this.canvas.height, 'circuit');
    
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
      
      // Create the first AI car with AssemblyScript WebAssembly AI (positioned on the left)
      try {
        const aiCar1 = new Car(
          this.canvas.width / 2 - 150,
          this.canvas.height - 300,
          40,
          80,
          'red'
        );
        
        // Load AssemblyScript WASM AI using the dedicated function
        const assemblyScriptAI = await loadWasmAI('/wasm/simple_ai.wasm');
        aiCar1.setAI(assemblyScriptAI);
        this.aiCars.push(aiCar1);
        console.log('AssemblyScript WASM AI loaded successfully');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('AssemblyScript WASM AI not available yet:', errorMessage);
      }
      
      // Create the second AI car with C WASM AI (positioned on the right)
      try {
        const aiCar2 = new Car(
          this.canvas.width / 2 + 120,
          this.canvas.height - 300,
          40,
          80,
          'green'
        );
        
        // Load C WASM AI using the dedicated function
        const cWasmAI = await loadWasmAI('/wasm/c_sample.wasm');
        aiCar2.setAI(cWasmAI);
        this.aiCars.push(aiCar2);
        console.log('C WASM AI loaded successfully');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('C WASM AI not available yet:', errorMessage);
      }
      
      // Create the third AI car with Rust WASM AI (positioned on the right)
      try {
        const aiCar3 = new Car(
          this.canvas.width / 2 + 180,
          this.canvas.height - 300,
          40,
          80,
          'orange'
        );
        
        // Load Rust WASM AI using the dedicated function
        const rustWasmAI = await loadWasmAI('/wasm/rust_sample.wasm');
        aiCar3.setAI(rustWasmAI);
        this.aiCars.push(aiCar3);
        console.log('Rust WASM AI loaded successfully');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('Rust WASM AI not available yet:', errorMessage);
      }
      
      // Note: We've removed the Go WASM AI implementation as it requires further work
      // We're focusing on the C and Rust implementations for now
      
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
    const walls = this.road.getWalls();
    
    // Update player car
    if (this.playerCar) {
      this.playerCar.update(deltaTime, walls);
    }
    
    // Update AI cars
    for (const aiCar of this.aiCars) {
      aiCar.update(deltaTime, walls);
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
