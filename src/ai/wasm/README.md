# WebAssembly Binary Interface for Car Game

This document describes the binary interface for implementing AI drivers in WebAssembly for the Car Game AI competition.

## Overview

The Car Game WebAssembly Binary Interface allows you to implement your car AI in any language that compiles to WebAssembly. Your AI will be loaded into the game, and the game will call your AI's functions to get your car's controls.

## Required Exports

Your WebAssembly module must export the following function:

### `process(x: number, y: number, speed: number, rotation: number, carWidth: number, carHeight: number, roadWidth: number, roadHeight: number, deltaTime: number, outputPtr: number): void`

This function is called every game tick to get your car's controls.

Parameters:
- `x`: Car's X position
- `y`: Car's Y position
- `speed`: Car's current speed
- `rotation`: Car's rotation in radians
- `carWidth`: Car's width
- `carHeight`: Car's height
- `roadWidth`: Width of the road
- `roadHeight`: Height of the road
- `deltaTime`: Time since last frame in seconds
- `outputPtr`: A pointer to the memory location where you should write your output data

### Optional Exports

- `allocate(size: number): number`: Allocates memory and returns a pointer
- `deallocate(ptr: number, size: number): void`: Frees previously allocated memory

## Output Data Format

Your AI should write its output to the memory location specified by `outputPtr` in the following binary format:

1. `outputPtr + 0`: Accelerate flag (4 bytes, uint32, 0 = false, 1 = true)
2. `outputPtr + 4`: Brake flag (4 bytes, uint32, 0 = false, 1 = true)
3. `outputPtr + 8`: Steering angle (4 bytes, float32, -1.0 = full left, 1.0 = full right)

Total output size: 12 bytes

## Implementation Examples

We provide examples for implementing the Car AI in various languages:

- [Rust Example](../../examples/rust-ai-binary/)
- [C++ Example](../../examples/cpp-ai-binary/)
- [Go Example (TinyGo)](../../examples/go-ai-binary/)

## Language-Specific Guidance

### Rust

The Rust implementation should access and manipulate memory directly using pointers.

### C/C++

Use Emscripten to compile your code to WebAssembly.

### Go

Use TinyGo with the WebAssembly target. Standard Go's WebAssembly output is too large for this application.

### AssemblyScript

Use the `@assemblyscript/loader` package for memory management.

## Debugging

To debug your AI, you can use the following methods:

1. Add a `consoleLog` import function:
   ```js
   env: {
     consoleLog: (ptr, len) => {
       const memory = new Uint8Array(wasmModule.memory.buffer);
       const text = new TextDecoder().decode(memory.slice(ptr, ptr + len));
       console.log(`[WASM AI]: ${text}`);
     }
   }
   ```

2. Then in your code, call this function to log messages to the browser console.

## Performance Considerations

1. Direct memory access is faster than JSON parsing
2. Fixed memory layout allows for predictable access patterns
3. No need for serialization/deserialization libraries
4. Minimize memory allocations and deallocations

## Testing Your AI

1. Build your WebAssembly module
2. Load it into the game using the `BinaryWasmAIAdapter`
3. Test your AI against the provided tracks

## Submission Guidelines

1. Submit only the compiled WebAssembly (.wasm) file
2. Your module must implement all required exports
3. Your module should not exceed 1MB in size
4. Your AI must complete each track within the time limits

## Example Usage

```javascript
// In your game code
import { BinaryWasmAIAdapter } from './ai/wasm/BinaryWasmAIAdapter';

// Load an AI implementation
const ai = await BinaryWasmAIAdapter.loadAI('path/to/your-ai.wasm');

// Use the AI in your game loop
function gameLoop(deltaTime) {
  // Get car state
  const carState = {
    x: car.x,
    y: car.y,
    speed: car.speed,
    rotation: car.rotation,
    width: car.width,
    height: car.height,
    roadWidth: level.roadWidth,
    roadHeight: level.roadHeight,
    deltaTime: deltaTime
  };
  
  // Get AI decisions
  const controls = ai.process(carState);
  
  // Apply controls to the car
  car.accelerate = controls.accelerate;
  car.brake = controls.brake;
  car.steeringAngle = controls.steeringAngle;
  
  // Update car physics, etc.
}
```