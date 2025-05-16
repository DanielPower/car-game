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
      
      // Create imports object with WASI stubs for TinyGo compatibility
      // These stubs provide the minimum implementation of the WebAssembly System Interface (WASI)
      // required by TinyGo-compiled WebAssembly modules to function in the browser environment
      const imports = {
        // WASI preview1 API stubs - required for TinyGo compatibility
        wasi_snapshot_preview1: {
          proc_exit: () => {}, // Process exit function (no-op in browser)
          fd_write: () => { return 0; }, // File descriptor write
          fd_close: () => { return 0; }, // File descriptor close
          fd_seek: () => { return 0; }, // File descriptor seek
          fd_read: () => { return 0; }, // File descriptor read
          environ_sizes_get: () => { return 0; }, // Get environment sizes
          environ_get: () => { return 0; }, // Get environment variables
          clock_time_get: () => { return 0; }, // Get clock time
          random_get: () => { return 0; }, // Get random bytes
          sched_yield: () => { return 0; } // Yield scheduler
        },
        env: {
          // Environment variables can be added here if needed
        }
      };
      
      // Instantiate the module with the imports
      const instance = await WebAssembly.instantiate(module, imports);
      
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
