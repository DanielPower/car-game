package main

import (
	"math"
	"unsafe"
)

// main is required for the TinyGo WebAssembly compiler
func main() {}

//export process
func process(
	x, y float32,
	speed, rotation float32,
	carWidth, carHeight float32,
	roadWidth, roadHeight float32,
	deltaTime float32,
	outputPtr uintptr,
) {
	// This is where you implement your AI logic
	
	// Simple example: accelerate if speed is low, steer toward center of road
	centerX := roadWidth / 2.0
	positionError := x - centerX
	
	// Calculate steering angle to move toward center
	// Negative value steers left, positive steers right
	steeringAngle := float32(-positionError / centerX)
	
	// Clamp steering angle to valid range [-1, 1]
	steeringAngle = float32(math.Max(-1.0, math.Min(1.0, float64(steeringAngle))))
	
	// Determine control outputs
	accelerate := speed < 10.0
	brake := speed > 20.0
	
	// Write output directly to the provided memory location
	// Layout: [accelerate (4 bytes), brake (4 bytes), steering_angle (4 bytes)]
	
	// Write accelerate (uint32, 0 or 1)
	acceleratePtr := (*uint32)(unsafe.Pointer(outputPtr))
	if accelerate {
		*acceleratePtr = 1
	} else {
		*acceleratePtr = 0
	}
	
	// Write brake (uint32, 0 or 1)
	brakePtr := (*uint32)(unsafe.Pointer(outputPtr + 4))
	if brake {
		*brakePtr = 1
	} else {
		*brakePtr = 0
	}
	
	// Write steering angle (float32)
	steeringPtr := (*float32)(unsafe.Pointer(outputPtr + 8))
	*steeringPtr = steeringAngle
}

// Helper function to log a message (implemented in JS)
//go:wasmimport env consoleLog
func _consoleLog(ptr uintptr, len int)

func logMessage(format string, args ...interface{}) {
	// This is a simplified logging mechanism - in a real implementation
	// you would want to use fmt.Sprintf and properly handle the conversion
	// Since this is just an example, we'll keep it simple
	message := format
	messagePtr := &message
	_consoleLog(uintptr(unsafe.Pointer(messagePtr)), len(message))
}