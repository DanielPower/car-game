# WebAssembly Car AI Interface

This document describes how to implement AI drivers in WebAssembly for the Car Game AI competition.

## Quick Start

```javascript
import { SimpleWasmAIAdapter } from './ai/wasm/SimpleWasmAIAdapter';

const ai = await SimpleWasmAIAdapter.loadAI('./my-ai.wasm');
```

## How It Works

Your WebAssembly module exports a single function that takes game state as parameters and returns control commands as a packed integer.

### Required Export

```rust
#[no_mangle]
pub extern "C" fn process(
    x: f32,                // Car's X position
    y: f32,                // Car's Y position  
    speed: f32,            // Car's current speed
    rotation: f32,         // Car's rotation in radians
    car_width: f32,        // Car's width
    car_height: f32,       // Car's height
    road_width: f32,       // Road width
    road_height: f32,      // Road height
    next_waypoint_x: f32,  // Next waypoint X position
    next_waypoint_y: f32,  // Next waypoint Y position
    delta_time: f32        // Time since last frame
) -> u32;
```

### Return Value Format

Return a 32-bit unsigned integer with packed control values:
- Bit 31: accelerate (1 = true, 0 = false)
- Bit 30: brake (1 = true, 0 = false)  
- Bits 15-0: steering angle as signed 16-bit integer (-32768 to 32767 maps to -1.0 to 1.0)

### Example Implementation

```rust
#[no_mangle]
pub extern "C" fn process(
    x: f32, y: f32, speed: f32, rotation: f32,
    car_width: f32, car_height: f32,
    road_width: f32, road_height: f32,
    next_waypoint_x: f32, next_waypoint_y: f32, delta_time: f32
) -> u32 {
    // Steer toward next waypoint
    let dx = next_waypoint_x - x;
    let dy = next_waypoint_y - y;
    let target_angle = dy.atan2(dx);
    let angle_diff = target_angle - rotation;
    let steering_angle = angle_diff.clamp(-1.0, 1.0);
    
    // Speed control
    let accelerate = speed < 15.0;
    let brake = speed > 20.0;
    
    // Pack return value
    let mut packed: u32 = 0;
    if accelerate { packed |= 0x80000000; }
    if brake { packed |= 0x40000000; }
    packed |= ((steering_angle * 32767.0) as i16 as u16) as u32;
    
    packed
}
```

## Examples

- [Rust Example](../../examples/rust-ai-simple/)
- [C++ Example](../../examples/cpp-ai-simple/)

## Building

### Rust
```bash
cargo build --target wasm32-unknown-unknown --release
```

### C++
```bash
emcc -O3 -s WASM=1 car_ai.cpp -o car_ai.wasm
```

## Debugging

Use the `consoleLog` import for debugging:

```rust
#[link(wasm_import_module = "env")]
extern "C" {
    fn consoleLog(value: f32);
}

// In your code
unsafe { consoleLog(steering_angle); }
```

## Using in Game

```javascript
import { SimpleWasmAIAdapter } from './ai/wasm/SimpleWasmAIAdapter';

const ai = await SimpleWasmAIAdapter.loadAI('./car_ai.wasm');

// In game loop
const controls = ai.process({
  x: car.x,
  y: car.y,
  speed: car.speed,
  rotation: car.rotation,
  width: car.width,
  height: car.height,
  roadWidth: level.roadWidth,
  roadHeight: level.roadHeight,
  nextWaypointX: nextWaypoint.x,
  nextWaypointY: nextWaypoint.y,
  deltaTime: deltaTime
});

car.accelerate = controls.accelerate;
car.brake = controls.brake;
car.steeringAngle = controls.steeringAngle;
```