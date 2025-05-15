# Car Game AI Competition

This document provides guidelines for creating and submitting your AI for the car racing competition.

## Overview

In this competition, participants create AI drivers that control cars in a top-down racing game. The AI must navigate the track efficiently while avoiding obstacles and other cars.

## Submission Format

All submissions must be compiled to WebAssembly (WASM) format. This allows participants to write their AI in any language that can compile to WASM, including:

- C/C++
- Rust
- AssemblyScript
- Go
- and many others

## AI Interface

Your AI must implement the following interface:

### Required Exports

Your WebAssembly module must export these functions:

1. `allocate_input`: Allocates memory for the input data
2. `allocate_output`: Allocates memory for the output data
3. `process`: Processes the input data and produces output control signals
4. `cleanup`: (Optional) Cleans up any allocated resources

### Input Data Structure

The input data provided to your AI will have the following structure:

```c
typedef struct {
    double x;           // Car's x position
    double y;           // Car's y position
    double speed;       // Current speed
    double rotation;    // Current rotation angle (in radians)
    double width;       // Car width
    double height;      // Car height
    double roadWidth;   // Width of the road
    double roadHeight;  // Height of the road
    double deltaTime;   // Time elapsed since last frame
    // Additional fields may be added in the future
} CarAIInput;
```

### Output Data Structure

Your AI must produce output with the following structure:

```c
typedef struct {
    double accelerate;  // 1.0 to accelerate, 0.0 otherwise
    double brake;       // 1.0 to brake, 0.0 otherwise
    double turnLeft;    // 1.0 to turn left, 0.0 otherwise
    double turnRight;   // 1.0 to turn right, 0.0 otherwise
} CarAIOutput;
```

## Sample Implementation

A sample C implementation is provided in `src/ai/wasm-sample/sample_ai.c`. You can use this as a starting point for your own AI.

## Building Your AI

### C/C++ with Emscripten

1. Install Emscripten: https://emscripten.org/docs/getting_started/downloads.html
2. Compile your code:

```bash
emcc your_ai.c \
    -o your_ai.wasm \
    -s WASM=1 \
    -s EXPORTED_FUNCTIONS="['_allocate_input', '_allocate_output', '_process', '_cleanup', '_malloc', '_free']" \
    -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap']" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -O3
```

### Rust

1. Install Rust and wasm-pack: https://rustwasm.github.io/wasm-pack/installer/
2. Create a new library with wasm-bindgen
3. Implement the required functions
4. Build with `wasm-pack build`

## Testing Your AI

1. Place your compiled WASM file in the `public/wasm/` directory
2. Update the game code to load your AI:

```typescript
const myAI = await AIFactory.createAI(AIType.WASM, { 
  wasmUrl: '/wasm/your_ai.wasm' 
});
car.setAI(myAI);
```

## Evaluation Criteria

AIs will be evaluated based on:

1. Lap time
2. Ability to avoid obstacles
3. Smoothness of driving
4. Code efficiency

## Submission Guidelines

1. Submit your compiled WASM file
2. Include source code for verification
3. Provide a brief description of your approach
4. Document any special instructions for loading your AI

Good luck, and may the best AI win!
