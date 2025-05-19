import * as RAPIER from "@dimforge/rapier2d-compat";
import { Car } from "./car";
import { PlayerAI } from "./ai/PlayerAI";
import {
  level1,
  generateTrackBoundaries,
  isPointOnRoad,
} from "./levels/level1";
import type { LevelConfig } from "./types";

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cars: Car[] = [];
  world!: RAPIER.World; // Using definite assignment assertion
  physicsScale: number = 30; // pixels per meter
  currentLevel: LevelConfig = level1;
  trackBoundaries: {
    innerBoundary: RAPIER.Collider[];
    outerBoundary: RAPIER.Collider[];
  } | null = null;
  mousePos: { x: number; y: number } | null = null;
  mouseListenerSet: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    // Initialize Rapier physics world
    RAPIER.init().then(() => {
      const gravity = { x: 0, y: 0 };
      this.world = new RAPIER.World(gravity);

      // Generate track boundaries
      this.trackBoundaries = generateTrackBoundaries(
        this.world,
        this.currentLevel,
        this.physicsScale,
      );

      // Create car at the level's start position
      const playerAI = new PlayerAI();
      playerAI.levelData = this.currentLevel;

      this.cars.push(
        new Car({
          world: this.world,
          inputController: playerAI,
          x: this.currentLevel.startPosition.x / this.physicsScale,
          y: this.currentLevel.startPosition.y / this.physicsScale,
          physicsScale: this.physicsScale,
        }),
      );
    });
  }

  update(dt: number): void {
    if (this.world) {
      this.world.step();
      for (const car of this.cars) {
        // Each wheel's friction is checked individually in the car's update method
        // Pass the current level data to the car's AI
        car.inputController.levelData = this.currentLevel;
        car.update(dt);
      }
    }
  }

  draw(): void {
    if (!this.world) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw the track with terrain visualization
    this.drawTrack();

    // Draw debug info
    this.drawDebugInfo();

    // Draw cars
    for (const car of this.cars) {
      car.draw(this.ctx);
    }
  }

  // Draw debug information
  drawDebugInfo(): void {
    // Draw mouse position and terrain info for debugging
    const handleMouseMove = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Store mouse position for rendering
      this.mousePos = { x: mouseX, y: mouseY };
    };

    // Set up mouse listener if not already set
    if (!this.mouseListenerSet) {
      this.canvas.addEventListener("mousemove", handleMouseMove);
      this.mouseListenerSet = true;
    }

    // Draw mouse terrain info if mouse position is available
    if (this.mousePos) {
      const isOnRoad = isPointOnRoad(this.mousePos, this.currentLevel);
      const terrainType = isOnRoad ? "Road" : "Off-road";
      const friction = isOnRoad
        ? this.currentLevel.roadFriction
        : this.currentLevel.offRoadFriction;

      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(this.mousePos.x + 15, this.mousePos.y + 15, 150, 60);

      this.ctx.font = "12px Arial";
      this.ctx.fillStyle = "white";
      this.ctx.fillText(
        `Position: (${Math.floor(this.mousePos.x)}, ${Math.floor(this.mousePos.y)})`,
        this.mousePos.x + 20,
        this.mousePos.y + 35,
      );
      this.ctx.fillText(
        `Terrain: ${terrainType}`,
        this.mousePos.x + 20,
        this.mousePos.y + 55,
      );
      this.ctx.fillText(
        `Friction: ${friction.toFixed(2)}`,
        this.mousePos.x + 20,
        this.mousePos.y + 75,
      );
    }
  }

  // Draw the track based on the level data
  drawTrack(): void {
    if (!this.currentLevel) return;

    // Draw background (off-road area) with pattern
    this.ctx.fillStyle = "#5d4037"; // Brown for off-road
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Optional: Add texture to off-road
    const offRoadPattern = 30;
    this.ctx.strokeStyle = "#4e342e";
    this.ctx.lineWidth = 1;

    for (let x = 0; x < this.canvas.width; x += offRoadPattern) {
      for (let y = 0; y < this.canvas.height; y += offRoadPattern) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 2, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }

    // Draw road surface
    this.ctx.fillStyle = "#888888"; // Gray for the road

    // Draw each segment of the track
    for (let i = 0; i < this.currentLevel.trackPath.length - 1; i++) {
      const current = this.currentLevel.trackPath[i];
      const next = this.currentLevel.trackPath[i + 1];

      // Calculate direction vector
      const dx = next.x - current.x;
      const dy = next.y - current.y;

      // Calculate normal vector (perpendicular to direction)
      const length = Math.sqrt(dx * dx + dy * dy);
      const normalX = -dy / length;
      const normalY = dx / length;

      // Calculate half-width for the track
      const halfWidth = this.currentLevel.trackWidth / 2;

      // Create a polygon for this track segment
      this.ctx.beginPath();

      // Inner edge point 1
      const innerX1 = current.x - normalX * halfWidth;
      const innerY1 = current.y - normalY * halfWidth;
      this.ctx.moveTo(innerX1, innerY1);

      // Inner edge point 2
      const innerX2 = next.x - normalX * halfWidth;
      const innerY2 = next.y - normalY * halfWidth;
      this.ctx.lineTo(innerX2, innerY2);

      // Outer edge point 2
      const outerX2 = next.x + normalX * halfWidth;
      const outerY2 = next.y + normalY * halfWidth;
      this.ctx.lineTo(outerX2, outerY2);

      // Outer edge point 1
      const outerX1 = current.x + normalX * halfWidth;
      const outerY1 = current.y + normalY * halfWidth;
      this.ctx.lineTo(outerX1, outerY1);

      this.ctx.closePath();
      this.ctx.fill();

      // Draw track edge lines
      this.ctx.strokeStyle = "#444444";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(innerX1, innerY1);
      this.ctx.lineTo(innerX2, innerY2);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(outerX1, outerY1);
      this.ctx.lineTo(outerX2, outerY2);
      this.ctx.stroke();

      // Draw road texture (dashed center line)
      const centerX1 = current.x;
      const centerY1 = current.y;
      const centerX2 = next.x;
      const centerY2 = next.y;

      this.ctx.setLineDash([10, 10]);
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX1, centerY1);
      this.ctx.lineTo(centerX2, centerY2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // Draw checkpoints if they exist
    if (this.currentLevel.checkpoints) {
      this.ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
      for (const checkpoint of this.currentLevel.checkpoints) {
        this.ctx.beginPath();
        this.ctx.arc(checkpoint.x, checkpoint.y, 10, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Add a legend for terrain types
    this.ctx.font = "14px Arial";
    this.ctx.fillStyle = "white";
    this.ctx.fillText("Terrain Types:", 10, 20);

    // Road legend
    this.ctx.fillStyle = "#888888";
    this.ctx.fillRect(10, 30, 20, 20);
    this.ctx.fillStyle = "white";
    this.ctx.fillText(
      "Road (Friction: " + this.currentLevel.roadFriction.toFixed(1) + ")",
      40,
      45,
    );

    // Off-road legend
    this.ctx.fillStyle = "#5d4037";
    this.ctx.fillRect(10, 60, 20, 20);
    this.ctx.fillStyle = "white";
    this.ctx.fillText(
      "Off-road (Friction: " +
        this.currentLevel.offRoadFriction.toFixed(1) +
        ")",
      40,
      75,
    );
  }
}
