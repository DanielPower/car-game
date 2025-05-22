import { SimpleWasmAIAdapter } from './SimpleWasmAIAdapter';
import type { CarAI } from '../CarAI';

/**
 * Loads a simple WebAssembly AI implementation
 * @param wasmPath Path to the WASM file
 * @returns A promise that resolves to the loaded AI instance
 */
export async function loadSimpleAI(wasmPath: string): Promise<CarAI> {
  try {
    console.log(`Loading Simple AI from ${wasmPath}...`);
    
    const ai = await SimpleWasmAIAdapter.loadAI(wasmPath);
    
    console.log('Simple AI loaded successfully!');
    return ai;
  } catch (error) {
    console.error('Failed to load Simple AI:', error);
    throw error;
  }
}

/**
 * Load the Rust simple AI example
 */
export async function loadRustSimpleAI(): Promise<CarAI> {
  return loadSimpleAI('./car_ai_simple.wasm');
}

/**
 * Load the C++ simple AI example
 */
export async function loadCppSimpleAI(): Promise<CarAI> {
  return loadSimpleAI('./cpp_car_ai_simple.wasm');
}

/**
 * Load the Go simple AI example
 */
export async function loadGoSimpleAI(): Promise<CarAI> {
  return loadSimpleAI('./go_car_ai_simple.wasm');
}