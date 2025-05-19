import type { CarAI, CarAIInput, CarAIOutput } from "./CarAI";
import type { LevelConfig } from "../types";
import { level1 } from "../levels/level1";

export class PlayerAI implements CarAI {
  private keys: Set<string> = new Set();
  levelData: LevelConfig = level1;

  constructor() {
    window.addEventListener("keydown", (e) => {
      this.keys.add(e.key);
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.key);
    });
  }

  process(input: CarAIInput): CarAIOutput {
    // Update the level data from input
    if (input.level) {
      this.levelData = input.level;
    }
    let steeringAngle = 0;

    if (this.keys.has("ArrowLeft") || this.keys.has("a")) {
      steeringAngle -= 1;
    }

    if (this.keys.has("ArrowRight") || this.keys.has("d")) {
      steeringAngle += 1;
    }

    return {
      accelerate: this.keys.has("ArrowUp") || this.keys.has("w"),
      brake: this.keys.has("ArrowDown") || this.keys.has("s"),
      steeringAngle: steeringAngle,
    };
  }
}
