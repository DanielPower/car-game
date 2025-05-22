use std::mem;

// =====================================
// AI Implementation
// =====================================

struct MyCarAI {}

impl MyCarAI {
    fn new() -> Self {
        Self {}
    }

    fn process(
        &self,
        x: f32,
        y: f32,
        speed: f32,
        rotation: f32,
        car_width: f32,
        car_height: f32,
        road_width: f32,
        road_height: f32,
        delta_time: f32,
    ) -> (bool, bool, f32) {
        // This is where you implement your AI logic
        
        // Simple example: accelerate if speed is low, steer toward center of road
        let center_x = road_width / 2.0;
        let position_error = x - center_x;
        
        // Calculate steering angle to move toward center
        // Negative value steers left, positive steers right
        let steering_angle = (-position_error / center_x).max(-1.0).min(1.0);
        
        // Return tuple of (accelerate, brake, steering_angle)
        (speed < 10.0, speed > 20.0, steering_angle)
    }
}

// =====================================
// WebAssembly Interface
// =====================================

// Global AI instance
static mut AI_INSTANCE: Option<MyCarAI> = None;

// Helper function for logging (uses the imported consoleLog function)
#[link(wasm_import_module = "env")]
extern "C" {
    fn consoleLog(ptr: *const u8, len: usize);
}

fn log(message: &str) {
    let bytes = message.as_bytes();
    unsafe {
        consoleLog(bytes.as_ptr(), bytes.len());
    }
}

// Process game state and write AI decisions to output buffer
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
    delta_time: f32,
    output_ptr: *mut u8,
) {
    // Initialize AI instance if it doesn't exist yet
    unsafe {
        if AI_INSTANCE.is_none() {
            AI_INSTANCE = Some(MyCarAI::new());
            log("Initialized AI instance");
        }
    }
    
    // Get the AI instance and process the input
    if let Some(ai) = unsafe { &AI_INSTANCE } {
        let (accelerate, brake, steering_angle) = ai.process(
            x, y, speed, rotation, car_width, car_height,
            road_width, road_height, delta_time
        );
        
        // Write output to the provided buffer
        unsafe {
            // Cast output_ptr to various types to write different data
            let accelerate_ptr = output_ptr as *mut u32;
            *accelerate_ptr = if accelerate { 1 } else { 0 };
            
            let brake_ptr = (output_ptr as usize + 4) as *mut u32;
            *brake_ptr = if brake { 1 } else { 0 };
            
            let steering_ptr = (output_ptr as usize + 8) as *mut f32;
            *steering_ptr = steering_angle;
        }
    }
}

// Memory management functions (optional)
#[no_mangle]
pub extern "C" fn allocate(size: usize) -> *mut u8 {
    let mut buffer = Vec::with_capacity(size);
    let ptr = buffer.as_mut_ptr();
    mem::forget(buffer);
    ptr
}

#[no_mangle]
pub extern "C" fn deallocate(ptr: *mut u8, size: usize) {
    unsafe {
        let _ = Vec::from_raw_parts(ptr, 0, size);
    }
}