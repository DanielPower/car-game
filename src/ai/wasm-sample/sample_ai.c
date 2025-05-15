#include <stdlib.h>
#include <math.h>
#include <emscripten.h>

// Structure to match our TypeScript CarAIInput
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
    // Additional fields can be added as needed
} CarAIInput;

// Structure to match our TypeScript CarAIOutput
typedef struct {
    double accelerate;
    double brake;
    double turnLeft;
    double turnRight;
} CarAIOutput;

// Global pointers to our input and output structures
static CarAIInput* input = NULL;
static CarAIOutput* output = NULL;

// Function to allocate memory for input
EMSCRIPTEN_KEEPALIVE
double* allocate_input() {
    if (input == NULL) {
        input = (CarAIInput*)malloc(sizeof(CarAIInput));
    }
    return (double*)input;
}

// Function to allocate memory for output
EMSCRIPTEN_KEEPALIVE
double* allocate_output() {
    if (output == NULL) {
        output = (CarAIOutput*)malloc(sizeof(CarAIOutput));
    }
    return (double*)output;
}

// Main processing function that will be called from TypeScript
EMSCRIPTEN_KEEPALIVE
void process() {
    if (input == NULL || output == NULL) {
        return;
    }
    
    // Simple AI logic similar to SimpleAI.ts
    double roadCenter = input->roadWidth / 2;
    double distanceFromCenter = input->x - roadCenter;
    double turnThreshold = 50.0;
    
    // Determine control signals
    output->turnLeft = (distanceFromCenter > turnThreshold) ? 1.0 : 0.0;
    output->turnRight = (distanceFromCenter < -turnThreshold) ? 1.0 : 0.0;
    output->accelerate = (input->speed < 200.0) ? 1.0 : 0.0;
    output->brake = (input->speed > 250.0) ? 1.0 : 0.0;
}

// Clean up function
EMSCRIPTEN_KEEPALIVE
void cleanup() {
    if (input != NULL) {
        free(input);
        input = NULL;
    }
    if (output != NULL) {
        free(output);
        output = NULL;
    }
}
