// Simple AI implementation for the car game
// This is designed to be compiled to WebAssembly

// Input buffer - 9 doubles (72 bytes)
// [0]: x position
// [1]: y position
// [2]: speed
// [3]: rotation
// [4]: width
// [5]: height
// [6]: roadWidth
// [7]: roadHeight
// [8]: deltaTime

// Output buffer - 4 doubles (32 bytes)
// [0]: accelerate (non-zero = true)
// [1]: brake (non-zero = true)
// [2]: turnLeft (non-zero = true)
// [3]: turnRight (non-zero = true)

// Memory layout:
// 0-71: Input buffer (9 doubles)
// 72-103: Output buffer (4 doubles)

// We'll use a static memory area for our buffers
static double input_buffer[9];
static double output_buffer[4];

// Allocate memory for input - returns pointer to input buffer
__attribute__((export_name("allocate_input")))
double* allocate_input() {
  return input_buffer;
}

// Allocate memory for output - returns pointer to output buffer
__attribute__((export_name("allocate_output")))
double* allocate_output() {
  return output_buffer;
}

// Process the input and produce output
__attribute__((export_name("process")))
void process() {
  // Use our static buffers
  double* input = input_buffer;
  double* output = output_buffer;
  
  // Extract input values
  double x = input[0];
  double y = input[1];
  double speed = input[2];
  double rotation = input[3];
  double width = input[4];
  double height = input[5];
  double roadWidth = input[6];
  double roadHeight = input[7];
  double deltaTime = input[8];
  
  // Simple AI logic: stay in the center of the road
  double roadCenterX = roadWidth / 2;
  
  // Accelerate if going slow, brake if going too fast
  output[0] = speed < 200 ? 1.0 : 0.0;  // accelerate
  output[1] = speed > 300 ? 1.0 : 0.0;  // brake
  
  // Turn towards the center of the road
  if (x < roadCenterX - 10) {
    output[2] = 0.0;  // turnLeft
    output[3] = 1.0;  // turnRight
  } else if (x > roadCenterX + 10) {
    output[2] = 1.0;  // turnLeft
    output[3] = 0.0;  // turnRight
  } else {
    output[2] = 0.0;  // turnLeft
    output[3] = 0.0;  // turnRight
  }
}

// Cleanup function (not really needed with this approach)
__attribute__((export_name("cleanup")))
void cleanup() {
  // Nothing to clean up with this approach
}
