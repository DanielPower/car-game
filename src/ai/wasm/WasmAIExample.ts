import { CarAI } from '../CarAI';
import { BinaryWasmAIAdapter } from './BinaryWasmAIAdapter';

/**
 * Example demonstrating how to load and use a WebAssembly AI implementation
 */
export class WasmAIExample {
  /**
   * Load an AI implementation from a WebAssembly file
   */
  static async loadAI(wasmUrl: string): Promise<CarAI> {
    try {
      console.log(`Loading AI from ${wasmUrl}...`);
      
      // Use the BinaryWasmAIAdapter to load the AI
      const ai = await BinaryWasmAIAdapter.loadAI(wasmUrl);
      
      console.log('AI loaded successfully!');
      return ai;
    } catch (error) {
      console.error('Failed to load AI:', error);
      throw error;
    }
  }

  /**
   * Example function showing how to register a WebAssembly AI
   * in your game's AI registry or selection system
   */
  static async registerWasmAI(
    name: string, 
    wasmUrl: string, 
    aiRegistry: Map<string, CarAI>
  ): Promise<void> {
    try {
      // Load the AI implementation
      const ai = await BinaryWasmAIAdapter.loadAI(wasmUrl);
      
      // Register the AI with the provided name
      aiRegistry.set(name, ai);
      
      console.log(`AI "${name}" registered successfully`);
    } catch (error) {
      console.error(`Failed to register AI "${name}":`, error);
      throw error;
    }
  }

  /**
   * Example showing how to use a WebAssembly AI in your game loop
   */
  static runGameWithWasmAI(
    gameLoop: (ai: CarAI, deltaTime: number) => void,
    wasmUrl: string
  ): void {
    // Load the AI
    BinaryWasmAIAdapter.loadAI(wasmUrl)
      .then(ai => {
        let lastTime = performance.now();
        
        // Set up the game loop
        function loop() {
          const currentTime = performance.now();
          const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
          lastTime = currentTime;
          
          // Run the game loop with the AI
          gameLoop(ai, deltaTime);
          
          // Request the next frame
          requestAnimationFrame(loop);
        }
        
        // Start the game loop
        requestAnimationFrame(loop);
      })
      .catch(error => {
        console.error('Failed to start game with WebAssembly AI:', error);
      });
  }
}