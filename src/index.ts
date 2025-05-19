import { setupErrorToasts } from "./errors";
import { Game } from "./game";

document.addEventListener("DOMContentLoaded", async () => {
  setupErrorToasts();
  const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element not found");
    return;
  }
  
  // Set canvas size to fill the window
  canvas.width = 800;
  canvas.height = 600;
  
  // Handle window resize
  window.addEventListener("resize", () => {
    const maxWidth = Math.min(window.innerWidth - 20, 1200);
    const maxHeight = Math.min(window.innerHeight - 20, 800);
    canvas.width = maxWidth;
    canvas.height = maxHeight;
  });
  
  // Initial resize
  const maxWidth = Math.min(window.innerWidth - 20, 1200);
  const maxHeight = Math.min(window.innerHeight - 20, 800);
  canvas.width = maxWidth;
  canvas.height = maxHeight;

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
