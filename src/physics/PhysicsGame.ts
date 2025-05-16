import * as Matter from 'matter-js';
import { PhysicsCar } from './PhysicsCar';
import { PhysicsRoad } from './PhysicsRoad';
import { PlayerAI } from '../ai/PlayerAI';
import { loadWasmAI } from '../ai/loadWasmAI';

export class PhysicsGame {
  // Canvas and rendering
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // Matter.js physics engine
  private engine: Matter.Engine;
  private world: Matter.World;
  private runner: Matter.Runner;
  
  // Game objects
  private playerCar: PhysicsCar | null = null;
  private aiCars: PhysicsCar[] = [];
  private road: PhysicsRoad;
  
  // Game state
  private running: boolean = false;
  private lastTime: number = 0;
  
  constructor() {
    // Get canvas and context
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    
    // Create Matter.js engine and world
    this.engine = Matter.Engine.create({
      // Lower gravity for better car control
      gravity: { x: 0, y: 0 }
    });
    this.world = this.engine.world;
    
    // Create runner for physics simulation
    this.runner = Matter.Runner.create({
      delta: 1000 / 60, // Target 60 FPS
      isFixed: true
    });
    
    // Create road with walls
    this.road = new PhysicsRoad(this.world, this.canvas.width, this.canvas.height, 'circuit');
    
    // Initialize cars with AI controllers
    this.initializeCars();
  }
  
  private async initializeCars() {
    try {
      // Create player car with PlayerAI
      this.playerCar = new PhysicsCar(
        this.world,
        this.canvas.width / 2, 
        this.canvas.height - 100, 
        40, 
        80,
        'blue'
      );
      
      // Set up the PlayerAI controller
      const playerAI = new PlayerAI();
      this.playerCar.setAI(playerAI);
      
      // Create the first AI car with AssemblyScript WebAssembly AI (positioned on the left)
      try {
        const aiCar1 = new PhysicsCar(
          this.world,
          this.canvas.width / 2 - 150,
          this.canvas.height - 300,
          40,
          80,
          'red'
        );
        
        // Load AssemblyScript WASM AI
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
        const aiCar2 = new PhysicsCar(
          this.world,
          this.canvas.width / 2 + 120,
          this.canvas.height - 300,
          40,
          80,
          'green'
        );
        
        // Load C WASM AI
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
        const aiCar3 = new PhysicsCar(
          this.world,
          this.canvas.width / 2 + 180,
          this.canvas.height - 300,
          40,
          80,
          'orange'
        );
        
        // Load Rust WASM AI
        const rustWasmAI = await loadWasmAI('/wasm/rust_sample.wasm');
        aiCar3.setAI(rustWasmAI);
        this.aiCars.push(aiCar3);
        console.log('Rust WASM AI loaded successfully');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('Rust WASM AI not available yet:', errorMessage);
      }
      
      console.log('Cars initialized successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to initialize cars:', errorMessage);
    }
  }
  
  start(): void {
    this.running = true;
    
    // Start the physics engine
    Matter.Runner.run(this.runner, this.engine);
    
    // Start the game loop
    requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  private gameLoop(timestamp: number): void {
    if (!this.running) return;
    
    // Calculate delta time in seconds
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    
    this.update(deltaTime);
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
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw road and walls
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
