// AssemblyScript implementation of SimpleAI
// This will be compiled to WebAssembly

// Memory layout:
// Input buffer - 9 f64 values (72 bytes)
// [0]: x position
// [1]: y position
// [2]: speed
// [3]: rotation
// [4]: width
// [5]: height
// [6]: roadWidth
// [7]: roadHeight
// [8]: deltaTime

// Output buffer - 4 f64 values (32 bytes)
// [0]: accelerate (non-zero = true)
// [1]: brake (non-zero = true)
// [2]: turnLeft (non-zero = true)
// [3]: turnRight (non-zero = true)

// Create memory for input and output buffers
// Each f64 is 8 bytes
const INPUT_SIZE = 9;
const OUTPUT_SIZE = 4;

// Static memory allocation
let inputBuffer = new StaticArray<f64>(INPUT_SIZE);
let outputBuffer = new StaticArray<f64>(OUTPUT_SIZE);

// Export functions required by the game engine

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
