export interface CarAIInput {
  x: number;
  y: number;
  speed: number;
  rotation: number;
  width: number;
  height: number;
  
  roadWidth: number;
  roadHeight: number;
  
  deltaTime: number;
  
  obstacles?: { x: number; y: number; width: number; height: number }[];
}

export interface CarAIOutput {
  accelerate: boolean;
  brake: boolean;
  steeringAngle: number; // -1 (full left) to 1 (full right)
}

export interface CarAI {
  process(input: CarAIInput): CarAIOutput;
}
