import type { CarAI, CarAIInput, CarAIOutput } from './CarAI';

export class PlayerAI implements CarAI {
  private keys: Set<string> = new Set();
  
  constructor() {
    // Set up event listeners for keyboard input
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });
  }
  
  process(_input: CarAIInput): CarAIOutput {
    // Convert keyboard inputs to car control outputs
    return {
      accelerate: this.keys.has('ArrowUp'),
      brake: this.keys.has(' ') || this.keys.has('ArrowDown'),
      turnLeft: this.keys.has('ArrowLeft'),
      turnRight: this.keys.has('ArrowRight')
    };
  }
}
