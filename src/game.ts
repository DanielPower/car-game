import * as RAPIER from "@dimforge/rapier2d-compat";
import { Car } from "./car";
import { PlayerAI } from "./ai/PlayerAI";
import { level1 } from "./levels/level1";
import type { LevelConfig } from "./types";
import * as vec from "./utils/math";
import { generateTrackBoundaries, isPointOnRoad } from "./utils/road";

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

  /**
   * Initialize mouse tracking for debug information
   */
  private initMouseTracking(): void {
    if (this.mouseListenerSet) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    this.canvas.addEventListener("mousemove", handleMouseMove);
    this.mouseListenerSet = true;
  }

  /**
   * Draw debug information overlay
   */
  drawDebugInfo(): void {
    this.initMouseTracking();

    // Draw mouse terrain info if mouse position is available
    if (this.mousePos) {
      const isOnRoad = isPointOnRoad(this.mousePos, this.currentLevel);
      const terrainType = isOnRoad ? "Road" : "Off-road";
      const friction = isOnRoad
        ? this.currentLevel.roadFriction
        : this.currentLevel.offRoadFriction;

      // Draw info panel background
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(this.mousePos.x + 15, this.mousePos.y + 15, 150, 60);

      // Draw info text
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

  /**
   * Draw the track based on the level data
   */
  drawTrack(): void {
    if (!this.currentLevel) return;

    this.drawOffRoadBackground();
    this.drawTrackSegments();
    this.drawCheckpoints();
    this.drawTerrainLegend();
  }

  private drawOffRoadBackground(): void {
    // Fill background with off-road color
    this.ctx.fillStyle = "#5d4037"; // Brown for off-road
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Add texture pattern to off-road
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
  }

  private drawTrackSegments(): void {
    this.ctx.fillStyle = "#888888"; // Gray for the road

    for (let i = 0; i < this.currentLevel.trackPath.length - 1; i++) {
      const current = this.currentLevel.trackPath[i];
      const next = this.currentLevel.trackPath[i + 1];

      // Calculate direction and normal vectors
      const direction = vec.subtract(next, current);
      const normal = vec.normal(vec.normalize(direction));

      // Calculate half-width for the track
      const halfWidth = this.currentLevel.trackWidth / 2;

      // Calculate track edge points
      const innerOffset = vec.multiply(normal, -halfWidth);
      const outerOffset = vec.multiply(normal, halfWidth);

      const innerPoint1 = vec.add(current, innerOffset);
      const innerPoint2 = vec.add(next, innerOffset);
      const outerPoint1 = vec.add(current, outerOffset);
      const outerPoint2 = vec.add(next, outerOffset);

      // Draw road segment
      this.ctx.beginPath();
      this.ctx.moveTo(innerPoint1.x, innerPoint1.y);
      this.ctx.lineTo(innerPoint2.x, innerPoint2.y);
      this.ctx.lineTo(outerPoint2.x, outerPoint2.y);
      this.ctx.lineTo(outerPoint1.x, outerPoint1.y);
      this.ctx.closePath();
      this.ctx.fill();

      // Draw track edge lines
      this.ctx.strokeStyle = "#444444";
      this.ctx.lineWidth = 2;

      // Inner edge
      this.ctx.beginPath();
      this.ctx.moveTo(innerPoint1.x, innerPoint1.y);
      this.ctx.lineTo(innerPoint2.x, innerPoint2.y);
      this.ctx.stroke();

      // Outer edge
      this.ctx.beginPath();
      this.ctx.moveTo(outerPoint1.x, outerPoint1.y);
      this.ctx.lineTo(outerPoint2.x, outerPoint2.y);
      this.ctx.stroke();

      // Draw dashed center line
      this.ctx.setLineDash([10, 10]);
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(current.x, current.y);
      this.ctx.lineTo(next.x, next.y);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  private drawCheckpoints(): void {
    if (!this.currentLevel.checkpoints) return;

    this.ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
    for (const checkpoint of this.currentLevel.checkpoints) {
      this.ctx.beginPath();
      this.ctx.arc(checkpoint.x, checkpoint.y, 10, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawTerrainLegend(): void {
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
