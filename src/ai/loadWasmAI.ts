import { WasmAI } from './WasmAI';

// Cache for loaded WASM AIs to avoid reloading the same module
const wasmAICache: Map<string, WasmAI> = new Map();

/**
 * Loads a WebAssembly AI implementation from the given URL
 * @param wasmUrl URL to the WebAssembly module
 * @returns A Promise that resolves to a WasmAI instance
 */
export async function loadWasmAI(wasmUrl: string): Promise<WasmAI> {
  // Check if we've already loaded this WASM AI
  if (wasmAICache.has(wasmUrl)) {
    return wasmAICache.get(wasmUrl)!;
  }
  
  try {
    // Create and initialize a new WASM AI
    const wasmAI = new WasmAI(wasmUrl);
    await wasmAI.initialize();
    
    // Cache the WASM AI
    wasmAICache.set(wasmUrl, wasmAI);
    
    return wasmAI;
  } catch (error) {
    console.error(`Failed to load WASM AI from ${wasmUrl}:`, error);
    throw error;
  }
}
