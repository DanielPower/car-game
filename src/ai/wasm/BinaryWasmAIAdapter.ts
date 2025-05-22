import { CarAI, CarAIInput, CarAIOutput } from "../CarAI";

// Define the structure of a WebAssembly AI module with binary interface
interface BinaryWasmAIModule {
  memory: WebAssembly.Memory;
  // Process game state and return AI decisions using direct memory
  process: (
    x: number, 
    y: number, 
    speed: number, 
    rotation: number, 
    carWidth: number, 
    carHeight: number,
    roadWidth: number, 
    roadHeight: number, 
    deltaTime: number,
    outputPtr: number
  ) => void;
  // Optional memory management functions
  allocate?: (size: number) => number;
  deallocate?: (ptr: number, size: number) => void;
}

// Output buffer structure (12 bytes total):
// Offset 0: accelerate (4 bytes, 0 = false, 1 = true)
// Offset 4: brake (4 bytes, 0 = false, 1 = true)
// Offset 8: steeringAngle (4 bytes, float32, -1.0 to 1.0)
const OUTPUT_BUFFER_SIZE = 12;

/**
 * Adapter for WebAssembly-based AI implementations using binary data exchange
 * Handles memory management and direct data transfer between JS and WASM
 */
export class BinaryWasmAIAdapter implements CarAI {
  private wasmModule: BinaryWasmAIModule;
  private outputPtr: number;
  private outputView: DataView | null = null;

  constructor(wasmModule: BinaryWasmAIModule) {
    this.wasmModule = wasmModule;
    
    // Allocate fixed output buffer in WebAssembly memory
    this.outputPtr = this.allocateOutputBuffer();
  }

  /**
   * Static factory method to load a WASM AI implementation
   */
  static async loadAI(wasmUrl: string): Promise<BinaryWasmAIAdapter> {
    try {
      // Instantiate the WebAssembly module from the URL
      const result = await WebAssembly.instantiateStreaming(
        fetch(wasmUrl),
        {
          // Define imports available to the WASM module (can be extended)
          env: {
            // Helper function for logging
            consoleLog: (ptr: number, len: number) => {
              const memory = new Uint8Array((result.instance.exports as any).memory.buffer);
              const text = new TextDecoder().decode(memory.slice(ptr, ptr + len));
              console.log(`[WASM AI]: ${text}`);
            }
          }
        }
      );
      
      // Cast exports to our expected interface
      const wasmModule = result.instance.exports as unknown as BinaryWasmAIModule;
      
      return new BinaryWasmAIAdapter(wasmModule);
    } catch (error) {
      console.error("Failed to load WASM AI module:", error);
      throw new Error(`Failed to load AI: ${error}`);
    }
  }



  /**
   * Process game state and get AI decisions
   */
  process(input: CarAIInput): CarAIOutput {
    // Ensure we have a valid output view (memory might have been reallocated)
    this.ensureOutputView();
    
    // Call process function with all input parameters directly
    this.wasmModule.process(
      input.x,
      input.y,
      input.speed,
      input.rotation,
      input.width,
      input.height,
      input.roadWidth,
      input.roadHeight,
      input.deltaTime,
      this.outputPtr
    );
    
    // Read output from WebAssembly memory using DataView
    const accelerate = this.outputView!.getUint32(0, true) !== 0;
    const brake = this.outputView!.getUint32(4, true) !== 0;
    const steeringAngle = this.outputView!.getFloat32(8, true);
    
    return {
      accelerate,
      brake,
      steeringAngle
    };
  }

  /**
   * Allocate output buffer in WebAssembly memory
   */
  private allocateOutputBuffer(): number {
    // If the module provides an allocate function, use it
    if (this.wasmModule.allocate) {
      return this.wasmModule.allocate(OUTPUT_BUFFER_SIZE);
    }
    
    // Otherwise, use a fixed memory location
    // This assumes the WASM module has reserved this memory location
    return 1024; // Using a fixed offset that should be safe in most modules
  }

  /**
   * Create or update the DataView for reading output values
   */
  private ensureOutputView(): void {
    // Get the current memory buffer (may change if memory is grown)
    const buffer = this.wasmModule.memory.buffer;
    
    // Create a new DataView if we don't have one or if memory has changed
    if (!this.outputView || this.outputView.buffer !== buffer) {
      this.outputView = new DataView(buffer, this.outputPtr, OUTPUT_BUFFER_SIZE);
    }
  }

  /**
   * Clean up resources when this adapter is no longer needed
   */
  dispose(): void {
    // Free output buffer if the module supports it
    if (this.wasmModule.deallocate) {
      this.wasmModule.deallocate(this.outputPtr, OUTPUT_BUFFER_SIZE);
    }
  }
}