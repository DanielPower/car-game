import type { CarAI, CarAIInput, CarAIOutput } from "./CarAI";

/**
 * Maps keyboard keys to car control actions
 */
interface KeyMap {
  left: string[];
  right: string[];
  accelerate: string[];
  brake: string[];
}

export class PlayerAI implements CarAI {
  private keys: Set<string> = new Set();
  
  // Key mapping configuration
  private keyMap: KeyMap = {
    left: ["ArrowLeft", "a"],
    right: ["ArrowRight", "d"],
    accelerate: ["ArrowUp", "w"],
    brake: ["ArrowDown", "s"],
  };
  
  // Keys that should have their default browser action prevented
  private preventDefaultKeys = [
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "
  ];

  constructor() {
    this.setupKeyboardListeners();
  }
  
  /**
   * Set up keyboard event handlers
   */
  private setupKeyboardListeners(): void {
    window.addEventListener("keydown", (e) => {
      this.keys.add(e.key);
      if (this.preventDefaultKeys.includes(e.key)) {
        e.preventDefault();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.key);
    });
  }
  
  /**
   * Check if any of the keys for a specific action are pressed
   */
  private isActionActive(action: keyof KeyMap): boolean {
    return this.keyMap[action].some(key => this.keys.has(key));
  }

  process(input: CarAIInput): CarAIOutput {
    // Calculate steering angle based on key input
    let steeringAngle = 0;
    if (this.isActionActive('left')) steeringAngle -= 1;
    if (this.isActionActive('right')) steeringAngle += 1;

    return {
      accelerate: this.isActionActive('accelerate'),
      brake: this.isActionActive('brake'),
      steeringAngle: steeringAngle,
    };
  }
}
