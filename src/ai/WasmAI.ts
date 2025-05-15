import type { CarAI, CarAIInput, CarAIOutput } from './CarAI';
import { WasmLoader } from './WasmLoader';
import type { WasmModule } from './WasmLoader';

export class WasmAI implements CarAI {
  private wasmModule: WasmModule | null = null;
  private inputBuffer: Float64Array | null = null;
  private outputBuffer: Float64Array | null = null;
  private memory: WebAssembly.Memory | null = null;

  constructor(private wasmUrl: string) {}

  async initialize(): Promise<void> {
    try {
      this.wasmModule = await WasmLoader.loadWasm(this.wasmUrl);
      
      // Get the memory from the WASM module
      this.memory = (this.wasmModule.instance.exports.memory as WebAssembly.Memory) || 
                   (this.wasmModule.instance.exports.__wasm_memory as WebAssembly.Memory);
      
      if (!this.memory) {
        throw new Error('WASM module does not export memory');
      }
      
      // Create views into the memory for input and output
      const exports = this.wasmModule.instance.exports;
      
      // Check if the required functions exist
      if (typeof exports.allocate_input !== 'function' || 
          typeof exports.allocate_output !== 'function' || 
          typeof exports.process !== 'function') {
        throw new Error('WASM module does not export required functions');
      }
      
      // Allocate memory for input and output
      const inputPtr = (exports.allocate_input as Function)();
      const outputPtr = (exports.allocate_output as Function)();
      
      // Create views into the memory
      this.inputBuffer = new Float64Array(this.memory.buffer, inputPtr, 10); // Size depends on CarAIInput fields
      this.outputBuffer = new Float64Array(this.memory.buffer, outputPtr, 4); // Size depends on CarAIOutput fields
      
      console.log('WASM AI initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WASM AI:', error);
      throw error;
    }
  }

  process(input: CarAIInput): CarAIOutput {
    if (!this.wasmModule || !this.inputBuffer || !this.outputBuffer) {
      throw new Error('WASM AI not initialized');
    }
    
    // Fill the input buffer with data from the input object
    this.inputBuffer[0] = input.x;
    this.inputBuffer[1] = input.y;
    this.inputBuffer[2] = input.speed;
    this.inputBuffer[3] = input.rotation;
    this.inputBuffer[4] = input.width;
    this.inputBuffer[5] = input.height;
    this.inputBuffer[6] = input.roadWidth;
    this.inputBuffer[7] = input.roadHeight;
    this.inputBuffer[8] = input.deltaTime;
    // Additional data can be added as needed
    
    // Call the process function in the WASM module
    (this.wasmModule.instance.exports.process as Function)();
    
    // Read the output from the output buffer
    return {
      accelerate: this.outputBuffer[0] > 0,
      brake: this.outputBuffer[1] > 0,
      turnLeft: this.outputBuffer[2] > 0,
      turnRight: this.outputBuffer[3] > 0
    };
  }
}
