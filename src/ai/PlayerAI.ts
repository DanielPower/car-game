import type { CarAI, CarAIInput, CarAIOutput } from "./CarAI";

export class PlayerAI implements CarAI {
  private keys: Set<string> = new Set();

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
    return {
      accelerate: this.keys.has("ArrowUp") || this.keys.has("w"),
      brake: this.keys.has("ArrowDown") || this.keys.has("s"),
      turnLeft: this.keys.has("ArrowLeft") || this.keys.has("a"),
      turnRight: this.keys.has("ArrowRight") || this.keys.has("d"),
    };
  }
}
