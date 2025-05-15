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

A sample C implementation is provided in `src/ai/c-sample/c_sample.c`. You can use this as a starting point for your own AI.

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
// Load your AI using the loadWasmAI function
const myAI = await loadWasmAI('/wasm/your_ai.wasm');
car.setAI(myAI);
```

## Evaluation Criteria

AIs will be evaluated based on:

1. Lap time
2. Ability to avoid obstacles
3. Smoothness of driving
4. Code efficiency

## Submission Guidelines

### AI Interface
Your AI must implement the `CarAI` interface, which includes the following:

```typescript
interface CarAIInput {
  x: number;          // Car's x position
  y: number;          // Car's y position
  speed: number;      // Car's current speed
  rotation: number;   // Car's rotation in radians
  width: number;      // Car's width
  height: number;     // Car's height
  roadWidth: number;  // Width of the road
  roadHeight: number; // Height of the road
  deltaTime: number;  // Time since last update in seconds
}

interface CarAIOutput {
  accelerate: boolean; // Whether to accelerate
  brake: boolean;      // Whether to brake
  turnLeft: boolean;   // Whether to turn left
  turnRight: boolean;  // Whether to turn right
}
```

### WebAssembly Submission (Preferred Method)
Your AI should be compiled to a standalone WebAssembly (WASM) file for submission. This allows you to write your AI in languages like C, C++, or Rust. Your WASM module must export the following:

1. **Memory**: Your module must export its memory as `memory`

2. **Functions**:
```
// Allocate memory for input data (returns a pointer to the input buffer)
export double* allocate_input();

// Allocate memory for output data (returns a pointer to the output buffer)
export double* allocate_output();

// Process input data and produce output
export void process();

// Clean up any resources (optional)
export void cleanup();
```

### Memory Layout

The input and output buffers use the following memory layout:

**Input Buffer** (9 double values):
1. x position
2. y position
3. speed
4. rotation
5. width
6. height
7. roadWidth
8. roadHeight
9. deltaTime

**Output Buffer** (4 double values):
1. accelerate (non-zero means true)
2. brake (non-zero means true)
3. turnLeft (non-zero means true)
4. turnRight (non-zero means true)

### Sample AI Implementations

We provide sample AI implementations in multiple languages to help you get started:

#### C Sample (`src/ai/c-sample`)

A basic implementation in C that demonstrates the core concepts.

```c
#include <stdlib.h>
#include <math.h>

// Structure for input data
typedef struct {
  double x;
  double y;
  double speed;
  double rotation;
  double width;
  double height;
  double roadWidth;
  double roadHeight;
  double deltaTime;
} CarAIInput;

// Structure for output data
typedef struct {
  double accelerate;
  double brake;
  double turnLeft;
  double turnRight;
} CarAIOutput;

// Global pointers to input and output data
CarAIInput* input = NULL;
CarAIOutput* output = NULL;

// Allocate memory for input data
double* allocate_input() {
  input = (CarAIInput*)malloc(sizeof(CarAIInput));
  return (double*)input;
}

// Allocate memory for output data
double* allocate_output() {
  output = (CarAIOutput*)malloc(sizeof(CarAIOutput));
  return (double*)output;
}

// Process input data and produce output
void process() {
  if (!input || !output) return;
  
  // Simple AI logic: stay in the center of the road
  double roadCenterX = input->roadWidth / 2;
  double distanceFromCenter = fabs(input->x - roadCenterX);
  
  // Accelerate if going slow, brake if going too fast
  output->accelerate = input->speed < 200 ? 1.0 : 0.0;
  output->brake = input->speed > 300 ? 1.0 : 0.0;
  
  // Turn towards the center of the road
  if (input->x < roadCenterX - 10) {
    output->turnLeft = 0.0;
    output->turnRight = 1.0;
  } else if (input->x > roadCenterX + 10) {
    output->turnLeft = 1.0;
    output->turnRight = 0.0;
  } else {
    output->turnLeft = 0.0;
    output->turnRight = 0.0;
  }
}

// Clean up resources
void cleanup() {
  if (input) {
    free(input);
    input = NULL;
  }
  if (output) {
    free(output);
    output = NULL;
  }
}
```

#### Rust Sample (`src/ai/rust-sample`)

A Rust implementation that shows how to create an AI in a memory-safe language:

```rust
// Sample AI implementation in Rust for the car game

// Static buffers for input and output
static mut INPUT_BUFFER: [f64; 9] = [0.0; 9];
static mut OUTPUT_BUFFER: [f64; 4] = [0.0; 4];

// Export functions for the game to call
#[no_mangle]
pub extern "C" fn allocate_input() -> *mut f64 {
    unsafe { INPUT_BUFFER.as_mut_ptr() }
}

#[no_mangle]
pub extern "C" fn allocate_output() -> *mut f64 {
    unsafe { OUTPUT_BUFFER.as_mut_ptr() }
}

#[no_mangle]
pub extern "C" fn process() {
    unsafe {
        // Extract input values
        let x = INPUT_BUFFER[0];
        let speed = INPUT_BUFFER[2];
        let road_width = INPUT_BUFFER[6];
        
        // Simple AI logic: stay in the center of the road
        let road_center_x = road_width / 2.0;
        
        // Accelerate if going slow, brake if going too fast
        OUTPUT_BUFFER[0] = if speed < 200.0 { 1.0 } else { 0.0 }; // accelerate
        OUTPUT_BUFFER[1] = if speed > 300.0 { 1.0 } else { 0.0 }; // brake
        
        // Turn towards the center of the road
        if x < road_center_x - 10.0 {
            OUTPUT_BUFFER[2] = 0.0; // turnLeft
            OUTPUT_BUFFER[3] = 1.0; // turnRight
        } else if x > road_center_x + 10.0 {
            OUTPUT_BUFFER[2] = 1.0; // turnLeft
            OUTPUT_BUFFER[3] = 0.0; // turnRight
        } else {
            OUTPUT_BUFFER[2] = 0.0; // turnLeft
            OUTPUT_BUFFER[3] = 0.0; // turnRight
        }
    }
}

#[no_mangle]
pub extern "C" fn cleanup() {
    // Nothing to clean up with this approach
}
```

#### Go Sample (`src/ai/go-sample`)

A Go implementation that demonstrates WebAssembly integration:

```go
package main

// Sample AI implementation in Go for the car game

// Static buffers for input and output
var inputBuffer [9]float64
var outputBuffer [4]float64

//export allocate_input
func allocate_input() *float64 {
	return &inputBuffer[0]
}

//export allocate_output
func allocate_output() *float64 {
	return &outputBuffer[0]
}

//export process
func process() {
	// Extract input values
	x := inputBuffer[0]
	speed := inputBuffer[2]
	roadWidth := inputBuffer[6]
	
	// Simple AI logic: stay in the center of the road
	roadCenterX := roadWidth / 2.0
	
	// Accelerate if going slow, brake if going too fast
	if speed < 200.0 {
		outputBuffer[0] = 1.0 // accelerate
	} else {
		outputBuffer[0] = 0.0
	}
	
	if speed > 300.0 {
		outputBuffer[1] = 1.0 // brake
	} else {
		outputBuffer[1] = 0.0
	}
	
	// Turn towards the center of the road
	if x < roadCenterX-10.0 {
		outputBuffer[2] = 0.0 // turnLeft
		outputBuffer[3] = 1.0 // turnRight
	} else if x > roadCenterX+10.0 {
		outputBuffer[2] = 1.0 // turnLeft
		outputBuffer[3] = 0.0 // turnRight
	} else {
		outputBuffer[2] = 0.0 // turnLeft
		outputBuffer[3] = 0.0 // turnRight
	}
}

//export cleanup
func cleanup() {
	// Nothing to clean up with this approach
}

// Required main function for Go WebAssembly
func main() {}
```

### Building Your AI
To build your AI, you'll need to compile it to a standalone WebAssembly file. The sample AIs include build scripts for different languages.

#### C Build Script

```bash
#!/bin/bash
# Compile the C code to a standalone WebAssembly file
emcc sample_ai.c \
    -o ../../../public/wasm/sample_ai.wasm \
    -s WASM=1 \
    -s STANDALONE_WASM \
    -s INITIAL_MEMORY=65536 \
    -s TOTAL_STACK=16384 \
    -s EXPORTED_FUNCTIONS=[] \
    -s EXPORTED_RUNTIME_METHODS=[] \
    --no-entry \
    -O3
```

#### Rust Build Script

```bash
#!/bin/bash
# Build the Rust project in release mode targeting WebAssembly
cargo build --release --target wasm32-unknown-unknown

# Copy the compiled WebAssembly file to the public directory
cp target/wasm32-unknown-unknown/release/rust_sample.wasm ../../../public/wasm/
```

#### AssemblyScript Sample AI

Here's an example of implementing the AI in AssemblyScript:

```typescript
// Static memory allocation
let inputBuffer = new StaticArray<f64>(9);
let outputBuffer = new StaticArray<f64>(4);

// Return a pointer to the input buffer
export function allocate_input(): usize {
  return changetype<usize>(inputBuffer);
}

// Return a pointer to the output buffer
export function allocate_output(): usize {
  return changetype<usize>(outputBuffer);
}

// Process the input data and produce output
export function process(): void {
  // Simple AI logic: stay in the middle of the road and maintain speed
  const roadCenter = inputBuffer[6] / 2; // roadWidth / 2
  const carPositionX = inputBuffer[0]; // x position
  
  // Calculate if the car needs to turn to stay in the center
  const distanceFromCenter = carPositionX - roadCenter;
  const turnThreshold: f64 = 50; // How far from center before turning
  
  // Simple logic for controlling the car
  const turnLeft = distanceFromCenter > turnThreshold ? 1.0 : 0.0;
  const turnRight = distanceFromCenter < -turnThreshold ? 1.0 : 0.0;
  const accelerate = inputBuffer[2] < 200.0 ? 1.0 : 0.0; // Maintain a moderate speed
  const brake = inputBuffer[2] > 250.0 ? 1.0 : 0.0; // Brake if going too fast
  
  // Set output values
  outputBuffer[0] = accelerate;
  outputBuffer[1] = brake;
  outputBuffer[2] = turnLeft;
  outputBuffer[3] = turnRight;
}

// Cleanup function (not needed for this implementation)
export function cleanup(): void {
  // Nothing to clean up
}
```

#### AssemblyScript Build Script

```bash
#!/bin/bash
# Install AssemblyScript if needed
npm install -g assemblyscript

# Compile the AssemblyScript code to WebAssembly
npx asc simple_ai.ts --target release -o ../../../public/wasm/simple_ai.wasm --use abort= --optimize
```

#### Future Language Support

We plan to add support for more languages in the future, such as Go and others. Stay tuned for updates!

#### Note on Other Languages

Any language that can compile to standalone WebAssembly should work with our system. The key requirements are:

1. The WebAssembly module must export the following functions:
   - `allocate_input`: Returns a pointer to memory for input data
   - `allocate_output`: Returns a pointer to memory for output data
   - `process`: Processes the input data and writes to the output buffer

2. The memory layout must match our expected format:
   - Input: 9 consecutive 64-bit floats (72 bytes)
   - Output: 4 consecutive 64-bit floats (32 bytes)

### Alternative: JavaScript Submission
If you prefer to write your AI in JavaScript or TypeScript, you can implement the `CarAI` interface directly. We recommend using AssemblyScript (shown above) for the best performance, but direct JavaScript implementation is also possible.

## Setting Up Your Development Environment

### Prerequisites
- [Emscripten](https://emscripten.org/docs/getting_started/downloads.html) (for WebAssembly compilation)
- [Node.js](https://nodejs.org/) (for running the game)

### Testing Your AI
1. Place your compiled WASM file in the `public/wasm/` directory with a unique name (e.g., `your_ai_name.wasm`).
2. Update the game configuration to load your AI by modifying the URL in `game.ts`.
3. Run the game with `npm start` and observe how your AI performs.

## Evaluation
Your AI will be evaluated based on the following criteria:

1. **Speed**: How quickly your AI can complete the race track.
2. **Safety**: Whether your AI can avoid crashing into walls or other cars.
3. **Efficiency**: How efficiently your AI uses the available controls.

## Submission Process
1. Fork the repository.
2. Implement your AI in the language of your choice.
3. Compile your AI to a standalone WebAssembly file.
4. Submit a pull request with your AI implementation (just the WASM file and source code).

## Timeline
- **Submission Deadline**: [Date]
- **Evaluation Period**: [Date Range]
- **Results Announcement**: [Date]

## Questions?
If you have any questions, please open an issue in the repository or contact the competition organizers.

Good luck!
Good luck, and may the best AI win!
