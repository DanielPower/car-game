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
        let y = INPUT_BUFFER[1];
        let speed = INPUT_BUFFER[2];
        let _rotation = INPUT_BUFFER[3];
        let _width = INPUT_BUFFER[4];
        let _height = INPUT_BUFFER[5];
        let road_width = INPUT_BUFFER[6];
        let _road_height = INPUT_BUFFER[7];
        let _delta_time = INPUT_BUFFER[8];
        
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
