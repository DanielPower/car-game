import { CarAI, CarAIInput, CarAIOutput } from "../CarAI";

// Define the structure of a simple WebAssembly AI module
interface SimpleWasmAIModule {
  // Process game state and return AI decisions as a packed 32-bit integer
  // Return format: [accelerate(1bit)][brake(1bit)][unused(14bits)][steering(16bits)]
  process: (
    x: number,
    y: number,
    speed: number,
    rotation: number,
    carWidth: number,
    carHeight: number,
    roadWidth: number,
    roadHeight: number,
    deltaTime: number
  ) => number;
}

/**
 * Simple adapter for WebAssembly-based AI implementations
 * Uses direct function calls with numeric parameters and return values
 */
export class SimpleWasmAIAdapter implements CarAI {
  private wasmModule: SimpleWasmAIModule;

  constructor(wasmModule: SimpleWasmAIModule) {
    this.wasmModule = wasmModule;
  }

  /**
   * Static factory method to load a simple WASM AI implementation
   */
  static async loadAI(wasmUrl: string): Promise<SimpleWasmAIAdapter> {
    try {
      const result = await WebAssembly.instantiateStreaming(
        fetch(wasmUrl),
        {
          env: {
            // Helper function for logging
            consoleLog: (value: number) => {
              console.log(`[WASM AI]: ${value}`);
            },
            // Math functions that might not be available in some languages
            sin: Math.sin,
            cos: Math.cos,
            atan2: Math.atan2,
            sqrt: Math.sqrt,
            pow: Math.pow,
            abs: Math.abs,
            min: Math.min,
            max: Math.max,
          }
        }
      );
      
      const wasmModule = result.instance.exports as unknown as SimpleWasmAIModule;
      
      if (!wasmModule.process) {
        throw new Error("WASM module missing required export: process");
      }
      
      return new SimpleWasmAIAdapter(wasmModule);
    } catch (error) {
      console.error("Failed to load simple WASM AI module:", error);
      throw new Error(`Failed to load AI: ${error}`);
    }
  }

  /**
   * Process game state and get AI decisions
   */
  process(input: CarAIInput): CarAIOutput {
    // Call the WASM function with all parameters
    const packed = this.wasmModule.process(
      input.x,
      input.y,
      input.speed,
      input.rotation,
      input.width,
      input.height,
      input.roadWidth,
      input.roadHeight,
      input.deltaTime
    );
    
    // Unpack the return value
    // Bit 31: accelerate (1 = true, 0 = false)
    // Bit 30: brake (1 = true, 0 = false)
    // Bits 15-0: steering angle as signed 16-bit integer (-32768 to 32767)
    //           mapped to -1.0 to 1.0
    
    const accelerate = (packed & 0x80000000) !== 0;
    const brake = (packed & 0x40000000) !== 0;
    
    // Extract steering as signed 16-bit value
    const steeringInt = (packed << 16) >> 16; // Sign extend
    const steeringAngle = steeringInt / 32767.0;
    
    return {
      accelerate,
      brake,
      steeringAngle: Math.max(-1, Math.min(1, steeringAngle))
    };
  }

  /**
   * Clean up resources (minimal cleanup needed for this simple adapter)
   */
  dispose(): void {
    // No resources to clean up
  }
}