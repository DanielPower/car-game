import { setupErrorToasts } from "./errors";
import { Game } from "./game";

document.addEventListener("DOMContentLoaded", async () => {
  setupErrorToasts();
  const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element not found");
    return;
  }

  const game = new Game(canvas);

  let lastRenderTime = performance.now();
  const updateLoop = () => {
    const currentTime = performance.now();
    const dt = currentTime - lastRenderTime;
    lastRenderTime = currentTime;
    game.update(dt);
    setTimeout(updateLoop, 16);
  };

  const renderLoop = () => {
    game.draw();
    requestAnimationFrame(renderLoop);
  };

  setTimeout(updateLoop);
  requestAnimationFrame(renderLoop);
});
