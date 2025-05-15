import { Game } from './game';

// Initialize the game when the window loads
window.addEventListener('load', () => {
  const game = new Game();
  game.start();
});
