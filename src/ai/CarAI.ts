export interface CarAIInput {
  // Car state
  x: number;
  y: number;
  speed: number;
  rotation: number;
  width: number;
  height: number;
  
  // Environment information
  roadWidth: number;
  roadHeight: number;
  
  // Time information
  deltaTime: number;
  
  // Any additional data needed for AI decision making
  obstacles?: { x: number; y: number; width: number; height: number }[];
}

export interface CarAIOutput {
  // Control signals
  accelerate: boolean;
  brake: boolean;
  turnLeft: boolean;
  turnRight: boolean;
}

export interface CarAI {
  // Process input data and return control signals
  process(input: CarAIInput): CarAIOutput;
}
