#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <math.h>
#include <emscripten.h>

// No level config needed anymore

// AI implementation
void process_ai(
    float x,
    float y,
    float speed,
    float rotation,
    float car_width,
    float car_height,
    float road_width,
    float road_height,
    float delta_time,
    bool* accelerate,
    bool* brake,
    float* steering_angle
) {
    // This is where you implement your AI logic
    
    // Simple example: accelerate if speed is low, steer toward center of road
    float center_x = road_width / 2.0f;
    float position_error = x - center_x;
    
    // Calculate steering angle to move toward center
    // Negative value steers left, positive steers right
    float angle = -position_error / center_x;
    
    // Clamp steering angle to valid range [-1, 1]
    if (angle < -1.0f) angle = -1.0f;
    if (angle > 1.0f) angle = 1.0f;
    
    *accelerate = speed < 10.0f;
    *brake = speed > 20.0f;
    *steering_angle = angle;
}

// WebAssembly interface implementations
extern "C" {
        // No initialization needed anymore

    // Process game state and write AI decisions to output buffer
    EMSCRIPTEN_KEEPALIVE void process(
        float x,
        float y,
        float speed,
        float rotation,
        float car_width,
        float car_height,
        float road_width,
        float road_height,
        float delta_time,
        uint8_t* output_ptr
    ) {
        bool accelerate, brake;
        float steering_angle;
        
        // Process the AI
        process_ai(
            x, y, speed, rotation, car_width, car_height,
            road_width, road_height, delta_time,
            &accelerate, &brake, &steering_angle
        );
        
        // Write output directly to the provided memory location
        // Layout: [accelerate (4 bytes), brake (4 bytes), steering_angle (4 bytes)]
        uint32_t* accelerate_ptr = (uint32_t*)output_ptr;
        *accelerate_ptr = accelerate ? 1 : 0;
        
        uint32_t* brake_ptr = (uint32_t*)(output_ptr + 4);
        *brake_ptr = brake ? 1 : 0;
        
        float* steering_ptr = (float*)(output_ptr + 8);
        *steering_ptr = steering_angle;
    }

    // Memory management functions (optional)
    EMSCRIPTEN_KEEPALIVE void* allocate(size_t size) {
        return malloc(size);
    }

    EMSCRIPTEN_KEEPALIVE void deallocate(void* ptr, size_t size) {
        free(ptr);
    }
}