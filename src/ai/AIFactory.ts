import type { CarAI } from './CarAI';
import { SimpleAI } from './SimpleAI';
import { WasmAI } from './WasmAI';

export enum AIType {
  SIMPLE = 'simple',
  WASM = 'wasm'
}

export class AIFactory {
  private static wasmAIs: Map<string, WasmAI> = new Map();
  
  static async createAI(type: AIType, options?: { wasmUrl?: string }): Promise<CarAI> {
    switch (type) {
      case AIType.SIMPLE:
        return new SimpleAI();
        
      case AIType.WASM:
        if (!options?.wasmUrl) {
          throw new Error('WASM URL is required for WASM AI');
        }
        
        // Check if we've already created this WASM AI
        if (this.wasmAIs.has(options.wasmUrl)) {
          return this.wasmAIs.get(options.wasmUrl)!;
        }
        
        // Create and initialize a new WASM AI
        const wasmAI = new WasmAI(options.wasmUrl);
        await wasmAI.initialize();
        
        // Cache the WASM AI
        this.wasmAIs.set(options.wasmUrl, wasmAI);
        
        return wasmAI;
        
      default:
        throw new Error(`Unknown AI type: ${type}`);
    }
  }
}
