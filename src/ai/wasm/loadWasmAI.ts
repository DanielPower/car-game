import { BinaryWasmAIAdapter } from './BinaryWasmAIAdapter';
import type { CarAI } from '../CarAI';

/**
 * Loads the Rust WebAssembly AI implementation
 * @returns A promise that resolves to the loaded AI instance
 */
export async function loadRustAI(): Promise<CarAI> {
  try {
    // Path is relative to where the game is being served from
    const wasmPath = './car_ai_binary.wasm';
    console.log(`Loading Rust AI from ${wasmPath}...`);
    
    // Use the BinaryWasmAIAdapter to load the AI
    const ai = await BinaryWasmAIAdapter.loadAI(wasmPath);
    
    console.log('Rust AI loaded successfully!');
    return ai;
  } catch (error) {
    console.error('Failed to load Rust AI:', error);
    throw error;
  }
}