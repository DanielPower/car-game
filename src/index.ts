import { setupErrorToasts } from "./errors";
import { Game } from "./game";
import { SimpleWasmAIAdapter } from "./ai/wasm/SimpleWasmAIAdapter";

document.addEventListener("DOMContentLoaded", async () => {
  setupErrorToasts();
  const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element not found");
    return;
  }

  canvas.width = 800;
  canvas.height = 600;

  window.addEventListener("resize", () => {
    const maxWidth = Math.min(window.innerWidth - 20, 1200);
    const maxHeight = Math.min(window.innerHeight - 20, 800);
    canvas.width = maxWidth;
    canvas.height = maxHeight;
  });

  const maxWidth = Math.min(window.innerWidth - 20, 1200);
  const maxHeight = Math.min(window.innerHeight - 20, 800);
  canvas.width = maxWidth;
  canvas.height = maxHeight;

  // Load the Simple AI
  let ai;
  try {
    console.log("Loading Simple AI...");
    ai = await SimpleWasmAIAdapter.loadAI('./car_ai_simple.wasm');
  } catch (error) {
    console.warn("Failed to load Simple AI, using player controls:", error);
    // Fall back to player AI if WASM loading fails
    const { PlayerAI } = await import("./ai/PlayerAI");
    ai = new PlayerAI();
  }
  
  const game = new Game(canvas, ai);

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
