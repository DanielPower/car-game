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
  turnLeft: boolean;
  turnRight: boolean;
}

export interface CarAI {
  process(input: CarAIInput): CarAIOutput;
}
