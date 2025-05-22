#include <cmath>
#include <algorithm>

// Helper function for logging (imported from JavaScript)
extern "C" {
    void consoleLog(float value);
}

// Main AI processing function
extern "C" unsigned int process(
    float x,
    float y,
    float speed,
    float rotation,
    float car_width,
    float car_height,
    float road_width,
    float road_height,
    float delta_time
) {
    // Simple AI logic: stay in center of road
    float center_x = road_width / 2.0f;
    float position_error = x - center_x;
    float normalized_error = position_error / center_x;
    
    // Calculate steering to move toward center
    float steering_angle = -normalized_error * 2.0f;
    steering_angle = std::max(-1.0f, std::min(1.0f, steering_angle));
    
    // Speed control
    const float target_speed = 15.0f;
    bool accelerate = speed < target_speed;
    bool brake = speed > target_speed * 1.5f;
    
    // Debug logging
    consoleLog(steering_angle);
    
    // Pack return value:
    // Bit 31: accelerate
    // Bit 30: brake
    // Bits 15-0: steering angle as signed 16-bit integer
    unsigned int packed = 0;
    
    if (accelerate) {
        packed |= 0x80000000;
    }
    
    if (brake) {
        packed |= 0x40000000;
    }
    
    // Convert steering angle (-1.0 to 1.0) to signed 16-bit integer
    short steering_int = static_cast<short>(steering_angle * 32767.0f);
    packed |= static_cast<unsigned short>(steering_int);
    
    return packed;
}