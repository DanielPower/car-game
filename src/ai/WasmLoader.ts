// Interface for Emscripten-generated module
export interface EmscriptenModule {
  _allocate_input: () => number;
  _allocate_output: () => number;
  _process: () => void;
  _cleanup: () => void;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  HEAPF64: Float64Array;
  asm: any;
  memory: WebAssembly.Memory;
}

export interface WasmModule {
  instance: WebAssembly.Instance;
}

export class WasmLoader {
  private static cache: Map<string, WasmModule> = new Map();

  static async loadWasm(url: string): Promise<WasmModule> {
    // Check if the module is already cached
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    try {
      // Fetch the WASM file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch WASM module: ${response.statusText}`);
      }
      
      // Get the binary data
      const wasmBytes = await response.arrayBuffer();
      
      // Compile the module
      const module = await WebAssembly.compile(wasmBytes);
      
      // Instantiate the module with empty imports
      // This makes it language-agnostic - the WASM file must include everything it needs
      const instance = await WebAssembly.instantiate(module, {});
      
      // Create and cache the module wrapper
      const wasmModule: WasmModule = { instance };
      this.cache.set(url, wasmModule);
      
      return wasmModule;
    } catch (error) {
      console.error("Error loading WASM module:", error);
      throw error;
    }
  }
}
