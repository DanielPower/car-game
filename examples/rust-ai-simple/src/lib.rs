// Simple WebAssembly Car AI Example
// This AI uses direct function parameters and packed return values

// Helper function for logging (imported from JavaScript)
#[link(wasm_import_module = "env")]
extern "C" {
    fn consoleLog(value: f32);
}

// Main AI processing function
#[no_mangle]
pub extern "C" fn process(
    x: f32,
    y: f32,
    speed: f32,
    rotation: f32,
    car_width: f32,
    car_height: f32,
    road_width: f32,
    road_height: f32,
    next_waypoint_x: f32,
    next_waypoint_y: f32,
    delta_time: f32,
) -> u32 {
    // Calculate direction to next waypoint
    let dx = next_waypoint_x - x;
    let dy = next_waypoint_y - y;
    let target_angle = dy.atan2(dx);
    
    // Calculate steering to turn toward waypoint
    let angle_diff = target_angle - rotation;
    let steering_angle = angle_diff.clamp(-1.0, 1.0);
    
    // Speed control
    let target_speed = 15.0;
    let accelerate = speed < target_speed;
    let brake = speed > target_speed * 1.5;
    
    // Debug logging
    unsafe {
        consoleLog(steering_angle);
    }
    
    // Pack return value:
    // Bit 31: accelerate
    // Bit 30: brake
    // Bits 15-0: steering angle as signed 16-bit integer
    let mut packed: u32 = 0;
    
    if accelerate {
        packed |= 0x80000000;
    }
    
    if brake {
        packed |= 0x40000000;
    }
    
    // Convert steering angle (-1.0 to 1.0) to signed 16-bit integer
    let steering_int = (steering_angle * 32767.0) as i16;
    packed |= (steering_int as u16) as u32;
    
    packed
}