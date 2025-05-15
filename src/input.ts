export class InputHandler {
  public keys: Set<string> = new Set();

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });
  }
}
