# Car Game AI Examples

This directory contains example implementations of Car Game AI in various programming languages using WebAssembly.

## Available Examples

- **rust-ai-simple/** - Rust implementation
- **cpp-ai-simple/** - C++ implementation

## Quick Start

Each example directory contains a `Makefile` with the following targets:

```bash
make build    # Build the AI
make clean    # Clean build artifacts
make install  # Copy to public directory
```

## Prerequisites

### For Rust Examples
- Rust toolchain (`rustup`)
- wasm32-unknown-unknown target: `rustup target add wasm32-unknown-unknown`

### For C++ Examples
- Emscripten: https://emscripten.org/

## Creating Your Own AI

### Step 1: Copy an Example

```bash
cp -r rust-ai-simple my-ai
cd my-ai
```

### Step 2: Implement Your AI Logic

Edit the main file to implement your AI strategy. The AI receives car state as function parameters and returns control commands as a packed integer.

### Step 3: Build and Test

```bash
make build
make install
```

### Step 4: Use in the Game

```javascript
import { SimpleWasmAIAdapter } from './ai/wasm/SimpleWasmAIAdapter';

const ai = await SimpleWasmAIAdapter.loadAI('./my-ai.wasm');
```

## AI Development Tips

1. **Start Simple**: Begin with basic steering toward the center of the road
2. **Add Speed Control**: Implement acceleration and braking logic
3. **Debug Often**: Use the `consoleLog` function to output debug values
4. **Test in Browser**: Use the browser console to see debug output
5. **Iterate**: Refine your algorithm based on performance

## Example AI Strategy

```rust
// Stay in center of road
let center_x = road_width / 2.0;
let position_error = x - center_x;
let steering_angle = -position_error / center_x;

// Speed management
let accelerate = speed < 15.0;
let brake = speed > 20.0;
```

## Interface Details

Your AI exports one function:

```rust
#[no_mangle]
pub extern "C" fn process(
    x: f32, y: f32, speed: f32, rotation: f32,
    car_width: f32, car_height: f32,
    road_width: f32, road_height: f32, delta_time: f32
) -> u32
```

Return format (packed 32-bit integer):
- Bit 31: accelerate (1 = true, 0 = false)
- Bit 30: brake (1 = true, 0 = false)  
- Bits 15-0: steering angle (-32768 to 32767 maps to -1.0 to 1.0)

## Troubleshooting

### Module Won't Load
- Check that you're building with the correct WebAssembly target
- Verify your module exports the `process` function
- Ensure the function signature matches exactly

### Poor Performance
- Profile your AI logic for expensive operations
- Avoid complex calculations in the main loop
- Use simple algorithms for real-time performance

### Debugging
- Use the `consoleLog` import function for numeric debugging
- Check browser console for error messages
- Start with simple logic and add complexity gradually