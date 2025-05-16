package main

// Sample AI implementation in Go for the car game

// Static buffers for input and output
var inputBuffer [9]float64
var outputBuffer [4]float64

//export allocate_input
func allocate_input() *float64 {
	return &inputBuffer[0]
}

//export allocate_output
func allocate_output() *float64 {
	return &outputBuffer[0]
}

//export process
func process() {
	// Extract input values
	x := inputBuffer[0]
	// y is not used in this simple AI
	// _ = inputBuffer[1]
	speed := inputBuffer[2]
	// rotation is not used in this simple AI
	// _ = inputBuffer[3]
	roadWidth := inputBuffer[6]
	// roadHeight and deltaTime are not used in this simple AI
	// _ = inputBuffer[7]
	// _ = inputBuffer[8]
	
	// Simple AI logic: stay in the center of the road
	roadCenterX := roadWidth / 2.0
	
	// Accelerate if going slow, brake if going too fast
	if speed < 200.0 {
		outputBuffer[0] = 1.0 // accelerate
	} else {
		outputBuffer[0] = 0.0
	}
	
	if speed > 300.0 {
		outputBuffer[1] = 1.0 // brake
	} else {
		outputBuffer[1] = 0.0
	}
	
	// Turn towards the center of the road
	if x < roadCenterX-10.0 {
		outputBuffer[2] = 0.0 // turnLeft
		outputBuffer[3] = 1.0 // turnRight
	} else if x > roadCenterX+10.0 {
		outputBuffer[2] = 1.0 // turnLeft
		outputBuffer[3] = 0.0 // turnRight
	} else {
		outputBuffer[2] = 0.0 // turnLeft
		outputBuffer[3] = 0.0 // turnRight
	}
	
	// Add a bit more intelligence: slow down for turns
	// This is a simple enhancement over the basic sample
	distanceFromCenter := abs(x - roadCenterX)
	if distanceFromCenter > roadWidth/4.0 && speed > 150.0 {
		outputBuffer[1] = 1.0 // brake when far from center and going fast
	}
}

// Helper function to calculate absolute value
func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}

//export cleanup
func cleanup() {
	// Nothing to clean up with this approach
}

// Required main function for Go WebAssembly
func main() {}
