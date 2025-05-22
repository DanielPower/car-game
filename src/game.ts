import * as RAPIER from "@dimforge/rapier2d-compat";
import { Car } from "./car";
import { PlayerAI } from "./ai/PlayerAI";
import type { CarAI } from "./ai/CarAI";
import { level1 } from "./levels/level1";
import type { CheckpointState, LevelConfig, TimerState } from "./types";
import * as vec from "./utils/math";
import { generateTrackBoundaries, isPointOnRoad } from "./utils/road";

// Define collision groups
export const COLLISION_GROUPS = {
  CAR: 0b0000_0000_0000_0001, // Group 1
  WHEEL: 0b0000_0000_0000_0010, // Group 2
  WALL: 0b0000_0000_0000_0100, // Group 3
  TRACK: 0b0000_0000_0000_1000, // Group 4
  CHECKPOINT: 0b0000_0000_0001_0000, // Group 5
};

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
  wallColliders: RAPIER.Collider[] = [];
  mousePos: { x: number; y: number } | null = null;
  mouseListenerSet: boolean = false;
  checkpointStates: CheckpointState[] = [];
  timer: TimerState = {
    startTime: 0,
    currentTime: 0,
    isRunning: false,
    finishTime: undefined,
  };
  private checkpointColliders: (RAPIER.Collider | null)[] = [];

  constructor(canvas: HTMLCanvasElement, customAI?: CarAI) {
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

      // Generate wall colliders
      this.generateWallColliders();

      // Generate checkpoint colliders
      this.initializeCheckpoints();

      // Create car at the level's start position
      // Use custom AI if provided, otherwise use PlayerAI
      const playerAI = customAI || new PlayerAI();

      this.cars.push(
        new Car({
          world: this.world,
          inputController: playerAI,
          x: this.currentLevel.startPosition.x / this.physicsScale,
          y: this.currentLevel.startPosition.y / this.physicsScale,
          physicsScale: this.physicsScale,
          level: this.currentLevel,
        }),
      );

      // Start the timer
      this.startTimer();
    });
  }

  update(dt: number): void {
    if (this.world) {
      // Update timer if running
      if (this.timer.isRunning) {
        this.timer.currentTime = performance.now();
      }
      
      this.world.step();
      for (const car of this.cars) {
        // Get next waypoint for this car
        const nextWaypoint = this.getNextWaypoint();
        
        // Each wheel's friction is checked individually in the car's update method
        car.update(dt, nextWaypoint);
        
        // Check if car has passed any checkpoints
        this.checkCheckpoints(car);
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
    
    // Draw timer and checkpoint status
    this.drawTimerAndCheckpoints();
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
    this.drawWalls();
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

    for (let i = 0; i < this.currentLevel.checkpoints.length; i++) {
      const checkpoint = this.currentLevel.checkpoints[i];
      const isCompleted = i < this.checkpointStates.length && this.checkpointStates[i].passed;
      const isNext = i === this.checkpointStates.length;
      
      // Get checkpoint line information to visualize
      if (i < this.checkpointLines.length) {
        const checkpointData = this.checkpointLines[i];
        
        const startVertex = { x: checkpointData.startX / this.physicsScale, y: checkpointData.startY / this.physicsScale };
        const endVertex = { x: checkpointData.endX / this.physicsScale, y: checkpointData.endY / this.physicsScale };
        
        // Draw the checkpoint line
        if (isCompleted) {
          this.ctx.strokeStyle = "rgba(0, 255, 0, 0.8)"; // Green for completed
        } else if (isNext) {
          this.ctx.strokeStyle = "rgba(255, 255, 0, 0.8)"; // Yellow for next
        } else {
          this.ctx.strokeStyle = "rgba(255, 0, 0, 0.4)"; // Red for future
        }
        
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(startVertex.x * this.physicsScale, startVertex.y * this.physicsScale);
        this.ctx.lineTo(endVertex.x * this.physicsScale, endVertex.y * this.physicsScale);
        this.ctx.stroke();
        
        // Draw detection area for debugging
        if (isNext) {
          this.ctx.strokeStyle = "rgba(255, 255, 0, 0.3)";
          this.ctx.beginPath();
          
          // Draw threshold area around the line
          const dx = (endVertex.x - startVertex.x) * this.physicsScale;
          const dy = (endVertex.y - startVertex.y) * this.physicsScale;
          const lineLength = Math.sqrt(dx * dx + dy * dy);
          const normalX = -dy / lineLength;
          const normalY = dx / lineLength;
          
          const carRadius = Math.max(this.cars[0].carWidth, this.cars[0].carHeight) / 2;
          
          // Draw rectangle around the line to show detection area
          this.ctx.moveTo(
            (startVertex.x * this.physicsScale) + normalX * carRadius,
            (startVertex.y * this.physicsScale) + normalY * carRadius
          );
          this.ctx.lineTo(
            (endVertex.x * this.physicsScale) + normalX * carRadius,
            (endVertex.y * this.physicsScale) + normalY * carRadius
          );
          this.ctx.lineTo(
            (endVertex.x * this.physicsScale) - normalX * carRadius,
            (endVertex.y * this.physicsScale) - normalY * carRadius
          );
          this.ctx.lineTo(
            (startVertex.x * this.physicsScale) - normalX * carRadius,
            (startVertex.y * this.physicsScale) - normalY * carRadius
          );
          this.ctx.closePath();
          this.ctx.stroke();
        }
      }
      
      // Draw marker based on checkpoint status
      if (isCompleted) {
        this.ctx.fillStyle = "rgba(0, 255, 0, 0.5)"; // Green for completed
      } else if (isNext) {
        this.ctx.fillStyle = "rgba(255, 255, 0, 0.5)"; // Yellow for next
      } else {
        this.ctx.fillStyle = "rgba(255, 0, 0, 0.2)"; // Red for future
      }
      
      this.ctx.beginPath();
      this.ctx.arc(checkpoint.x, checkpoint.y, 10, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Draw checkpoint number
      this.ctx.fillStyle = "black";
      this.ctx.font = "14px Arial";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText((i + 1).toString(), checkpoint.x, checkpoint.y);
    }
  }

  private drawWalls(): void {
    if (!this.currentLevel.wallPaths) return;

    this.ctx.strokeStyle = "#ff0000";
    this.ctx.lineWidth = 4;

    for (const wallPath of this.currentLevel.wallPaths) {
      this.ctx.beginPath();
      for (let i = 0; i < wallPath.length; i++) {
        const point = wallPath[i];
        if (i === 0) {
          this.ctx.moveTo(point.x, point.y);
        } else {
          this.ctx.lineTo(point.x, point.y);
        }
      }
      this.ctx.stroke();
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
    
    // Checkpoint legend
    this.ctx.fillStyle = "rgba(255, 255, 0, 0.5)";
    this.ctx.fillRect(10, 90, 20, 20);
    this.ctx.fillStyle = "white";
    this.ctx.fillText("Next Checkpoint", 40, 105);
    
    this.ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    this.ctx.fillRect(10, 120, 20, 20);
    this.ctx.fillStyle = "white";
    this.ctx.fillText("Completed Checkpoint", 40, 135);
    
    this.ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
    this.ctx.fillRect(10, 150, 20, 20);
    this.ctx.fillStyle = "white";
    this.ctx.fillText("Future Checkpoint", 40, 165);
  }

  private generateWallColliders(): void {
    if (!this.world || !this.currentLevel.wallPaths) return;

    // Clear any existing wall colliders
    for (const collider of this.wallColliders) {
      this.world.removeCollider(collider, true);
    }
    this.wallColliders = [];

    // Create colliders for each wall path
    for (const wallPath of this.currentLevel.wallPaths) {
      for (let i = 0; i < wallPath.length - 1; i++) {
        const current = wallPath[i];
        const next = wallPath[i + 1];

        // Create a segment collider for this wall segment
        const wallSegmentDesc = RAPIER.ColliderDesc.segment(
          new RAPIER.Vector2(
            current.x / this.physicsScale,
            current.y / this.physicsScale
          ),
          new RAPIER.Vector2(
            next.x / this.physicsScale,
            next.y / this.physicsScale
          )
        )
        .setRestitution(0.2) // Add some bounce to walls
        .setCollisionGroups(
          // Wall is in WALL group and can collide with CAR and WHEEL groups
          (COLLISION_GROUPS.WALL << 16) | (COLLISION_GROUPS.CAR | COLLISION_GROUPS.WHEEL)
        );

        const wallSegment = this.world.createCollider(wallSegmentDesc);
        this.wallColliders.push(wallSegment);
      }
    }
  }
  
  /**
   * Initialize checkpoints and create checkpoint lines
   */
  // Stores checkpoint line coordinates for each checkpoint
  private checkpointLines: Array<{startX: number, startY: number, endX: number, endY: number}> = [];
  
  // No getCheckpointLineCoordinates method needed - we access checkpointLines directly
  
  private initializeCheckpoints(): void {
    if (!this.world || !this.currentLevel.checkpoints) return;
    
    // Clear existing checkpoints
    for (const collider of this.checkpointColliders) {
      if (collider) {
        this.world.removeCollider(collider, true);
      }
    }
    this.checkpointColliders = [];
    this.checkpointStates = [];
    this.checkpointLines = [];
    
    // For each checkpoint in the level
    for (let i = 0; i < this.currentLevel.checkpoints.length; i++) {
      const checkpoint = this.currentLevel.checkpoints[i];
      
      // Find the nearest track segment to determine road direction
      let minDistance = Number.MAX_VALUE;
      let nearestSegmentIndex = 0;
      
      for (let j = 0; j < this.currentLevel.trackPath.length - 1; j++) {
        const current = this.currentLevel.trackPath[j];
        const next = this.currentLevel.trackPath[j + 1];
        
        const distSq = vec.pointToLineDistanceSquared(checkpoint, current, next);
        if (distSq < minDistance) {
          minDistance = distSq;
          nearestSegmentIndex = j;
        }
      }
      
      // Get track direction at this point
      const current = this.currentLevel.trackPath[nearestSegmentIndex];
      const next = this.currentLevel.trackPath[nearestSegmentIndex + 1];
      const direction = vec.subtract(next, current);
      
      // Create a perpendicular line with length = trackWidth * 1.5 to ensure detection
      const perpendicular = vec.normal(vec.normalize(direction));
      const halfWidth = this.currentLevel.trackWidth * 0.75; // Extra width for reliable detection
      
      const checkpointStart = vec.add(
        checkpoint, 
        vec.multiply(perpendicular, -halfWidth)
      );
      
      const checkpointEnd = vec.add(
        checkpoint,
        vec.multiply(perpendicular, halfWidth)
      );
      
      // Store checkpoint line coordinates for later use
      this.checkpointLines.push({
        startX: checkpointStart.x,
        startY: checkpointStart.y,
        endX: checkpointEnd.x,
        endY: checkpointEnd.y
      });
      
      // We don't need actual physical colliders for checkpoints
      // Just store the line segment data for detection
      this.checkpointColliders.push(null);
    }
    
    // No need for physics-based contact detection
  }
  
  /**
   * Start the game timer
   */
  private startTimer(): void {
    this.timer = {
      startTime: performance.now(),
      currentTime: performance.now(),
      isRunning: true,
      finishTime: undefined
    };
  }
  
  /**
   * Stop the game timer
   */
  private stopTimer(): void {
    this.timer.isRunning = false;
    this.timer.finishTime = this.timer.currentTime;
  }
  
  /**
   * Format milliseconds as mm:ss.mmm
   */
  private formatTime(ms: number): string {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((ms % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }
  
  /**
   * Draw timer and checkpoint status on screen
   */
  private drawTimerAndCheckpoints(): void {
    // Draw timer
    const elapsedTime = this.timer.currentTime - this.timer.startTime;
    const timeText = this.formatTime(elapsedTime);
    
    // Timer display background
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(this.canvas.width - 160, 10, 150, 40);
    
    // Timer text
    this.ctx.font = "24px monospace";
    this.ctx.fillStyle = this.timer.isRunning ? "white" : "#00ff00";
    this.ctx.textAlign = "right";
    this.ctx.fillText(timeText, this.canvas.width - 20, 38);
    
    // Draw checkpoint progress
    const totalCheckpoints = this.currentLevel.checkpoints?.length || 0;
    const completedCheckpoints = this.checkpointStates.filter(c => c.passed).length;
    
    // Checkpoint progress background
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(this.canvas.width - 160, 60, 150, 40);
    
    // Checkpoint progress text
    this.ctx.font = "18px Arial";
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "right";
    this.ctx.fillText(`${completedCheckpoints}/${totalCheckpoints}`, this.canvas.width - 20, 88);
    
    // If race is finished, show completion message
    if (completedCheckpoints === totalCheckpoints && totalCheckpoints > 0) {
      // Background for completion message
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(this.canvas.width / 2 - 150, this.canvas.height / 2 - 50, 300, 100);
      
      // Completion message
      this.ctx.font = "24px Arial";
      this.ctx.fillStyle = "#00ff00";
      this.ctx.textAlign = "center";
      this.ctx.fillText("Track Completed!", this.canvas.width / 2, this.canvas.height / 2 - 15);
      
      // Final time
      this.ctx.font = "20px monospace";
      this.ctx.fillText(timeText, this.canvas.width / 2, this.canvas.height / 2 + 15);
    }
  }
  
  /**
   * Get the next waypoint/checkpoint that the car should head towards
   */
  private getNextWaypoint(): { x: number; y: number } | undefined {
    if (!this.currentLevel.checkpoints) return undefined;
    
    const nextCheckpointIndex = this.checkpointStates.length;
    if (nextCheckpointIndex >= this.currentLevel.checkpoints.length) {
      return undefined;
    }
    
    return this.currentLevel.checkpoints[nextCheckpointIndex];
  }

  /**
   * Check if the car has passed any checkpoints
   */
  private checkCheckpoints(car: Car): void {
    if (!this.world || !this.currentLevel.checkpoints) return;
    
    // Check if we have any checkpoints left to pass
    const nextCheckpointIndex = this.checkpointStates.length;
    if (!this.currentLevel.checkpoints || nextCheckpointIndex >= this.currentLevel.checkpoints.length) return;
    
    // Get car position
    const carPos = car.carBody.translation();
    const carPosition = {
      x: carPos.x * this.physicsScale,
      y: carPos.y * this.physicsScale
    };
    
    // Get checkpoint line endpoints from the stored coordinates
    if (nextCheckpointIndex >= this.checkpointLines.length) return;
    
    const checkpointData = this.checkpointLines[nextCheckpointIndex];
    
    const lineStart = {
      x: checkpointData.startX,
      y: checkpointData.startY
    };
    
    const lineEnd = {
      x: checkpointData.endX,
      y: checkpointData.endY
    };
    
    // Check if car is close enough to the checkpoint line
    const distanceToLine = vec.pointToLineDistanceSquared(carPosition, lineStart, lineEnd);
    const carRadius = Math.max(car.carWidth, car.carHeight) / 2;
    const thresholdDistance = carRadius * carRadius; // Square of detection radius
    
    // If car is close enough to the checkpoint line
    if (distanceToLine <= thresholdDistance) {
      // Mark this checkpoint as passed
      this.checkpointStates.push({
        index: nextCheckpointIndex,
        passed: true,
        timestamp: this.timer.currentTime - this.timer.startTime
      });
      
      // If this was the last checkpoint, stop the timer
      if (nextCheckpointIndex === this.currentLevel.checkpoints.length - 1) {
        this.stopTimer();
      }
    }
  }
}
