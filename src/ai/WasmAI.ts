import type { CarAI, CarAIInput, CarAIOutput } from './CarAI';
import { WasmLoader } from './WasmLoader';
import type { WasmModule } from './WasmLoader';

export class WasmAI implements CarAI {
  private wasmModule: WasmModule | null = null;
  private inputPtr: number = 0;
  private outputPtr: number = 0;
  private memory: WebAssembly.Memory | null = null;

  constructor(private wasmUrl: string) {}

  async initialize(): Promise<void> {
    try {
      this.wasmModule = await WasmLoader.loadWasm(this.wasmUrl);
      
      // Check if the required functions exist
      const exports = this.wasmModule.instance.exports;
      if (typeof exports.allocate_input !== 'function' || 
          typeof exports.allocate_output !== 'function' || 
          typeof exports.process !== 'function') {
        throw new Error('WASM module does not export required functions');
      }
      
      // Get memory from the module
      this.memory = exports.memory as WebAssembly.Memory;
      if (!this.memory) {
        throw new Error('WASM module does not export memory');
      }
      
      // Allocate memory for input and output
      this.inputPtr = (exports.allocate_input as CallableFunction)() as number;
      this.outputPtr = (exports.allocate_output as CallableFunction)() as number;
      
      // Note: WebAssembly pointers can be 0, which is a valid address
      // So we only check if they're undefined or null
      if (this.inputPtr === undefined || this.inputPtr === null ||
          this.outputPtr === undefined || this.outputPtr === null) {
        throw new Error('Failed to allocate memory in WASM module');
      }
      
      console.log('WASM AI initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WASM AI:', error);
      throw error;
    }
  }

  process(input: CarAIInput): CarAIOutput {
    if (!this.wasmModule || !this.memory || !this.inputPtr || !this.outputPtr) {
      throw new Error('WASM AI not initialized');
    }
    
    // Get memory as Float64Array
    const f64Memory = new Float64Array(this.memory.buffer);
    
    // Write input values to memory
    f64Memory[this.inputPtr/8 + 0] = input.x;
    f64Memory[this.inputPtr/8 + 1] = input.y;
    f64Memory[this.inputPtr/8 + 2] = input.speed;
    f64Memory[this.inputPtr/8 + 3] = input.rotation;
    f64Memory[this.inputPtr/8 + 4] = input.width;
    f64Memory[this.inputPtr/8 + 5] = input.height;
    f64Memory[this.inputPtr/8 + 6] = input.roadWidth;
    f64Memory[this.inputPtr/8 + 7] = input.roadHeight;
    f64Memory[this.inputPtr/8 + 8] = input.deltaTime;
    
    // Call the process function
    (this.wasmModule.instance.exports.process as CallableFunction)();
    
    // Read output values from memory
    return {
      accelerate: f64Memory[this.outputPtr/8 + 0] > 0,
      brake: f64Memory[this.outputPtr/8 + 1] > 0,
      turnLeft: f64Memory[this.outputPtr/8 + 2] > 0,
      turnRight: f64Memory[this.outputPtr/8 + 3] > 0
    };
  }
  
  // Clean up resources when done
  cleanup(): void {
    if (this.wasmModule) {
      try {
        const cleanup = this.wasmModule.instance.exports.cleanup;
        if (typeof cleanup === 'function') {
          (cleanup as CallableFunction)();
        }
      } catch (error) {
        console.error('Error during WASM cleanup:', error);
      }
    }
  }
}
