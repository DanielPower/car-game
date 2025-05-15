import type { CarAI, CarAIInput, CarAIOutput } from './CarAI';

export class SimpleAI implements CarAI {
  process(input: CarAIInput): CarAIOutput {
    // Simple AI logic: stay in the middle of the road and maintain speed
    const roadCenter = input.roadWidth / 2;
    const carPositionX = input.x;
    
    // Calculate if the car needs to turn to stay in the center
    const distanceFromCenter = carPositionX - roadCenter;
    const turnThreshold = 50; // How far from center before turning
    
    // Simple logic for controlling the car
    const turnLeft = distanceFromCenter > turnThreshold;
    const turnRight = distanceFromCenter < -turnThreshold;
    const accelerate = input.speed < 200; // Maintain a moderate speed
    const brake = input.speed > 250; // Brake if going too fast
    
    return {
      accelerate,
      brake,
      turnLeft,
      turnRight
    };
  }
}
