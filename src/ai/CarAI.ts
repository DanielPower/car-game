export interface CarAIInput {
  x: number;
  y: number;
  speed: number;
  rotation: number;
  width: number;
  height: number;

  roadWidth: number;
  roadHeight: number;

  // Next waypoint/checkpoint location
  nextWaypointX: number;
  nextWaypointY: number;

  deltaTime: number;
}

export interface CarAIOutput {
  accelerate: boolean;
  brake: boolean;
  steeringAngle: number; // -1 (full left) to 1 (full right)
}

export interface CarAI {
  process(input: CarAIInput): CarAIOutput;
}
