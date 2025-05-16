import { PhysicsGame } from './physics/PhysicsGame';

// Initialize the physics-based game when the window loads
window.addEventListener('load', () => {
  const game = new PhysicsGame();
  game.start();
});
