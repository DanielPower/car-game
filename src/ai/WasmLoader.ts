export interface WasmModule {
  instance: WebAssembly.Instance;
  module: WebAssembly.Module;
}

export class WasmLoader {
  private static cache: Map<string, WasmModule> = new Map();

  static async loadWasm(url: string): Promise<WasmModule> {
    // Check if the module is already cached
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    try {
      // Fetch the wasm file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch WASM module: ${response.statusText}`);
      }

      // Compile and instantiate the module
      const buffer = await response.arrayBuffer();
      const module = await WebAssembly.compile(buffer);
      const instance = await WebAssembly.instantiate(module, {
        env: {
          // Environment functions that can be called from WASM
          // These will be available to the WASM module
          memory: new WebAssembly.Memory({ initial: 256, maximum: 512 }),
        }
      });

      // Cache the module
      const wasmModule = { instance, module };
      this.cache.set(url, wasmModule);
      
      return wasmModule;
    } catch (error) {
      console.error("Error loading WASM module:", error);
      throw error;
    }
  }
}
