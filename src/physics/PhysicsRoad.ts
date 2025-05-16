import * as Matter from 'matter-js';

export class PhysicsRoad {
  private width: number;
  private height: number;
  private world: Matter.World;
  private walls: Matter.Body[] = [];
  private trackType: 'straight' | 'oval' | 'circuit' = 'circuit';
  
  // Road appearance
  private laneCount: number = 5;
  private lineWidth: number = 5;
  private lineLength: number = 30;
  private lineGap: number = 30;
  
  constructor(world: Matter.World, width: number, height: number, trackType: 'straight' | 'oval' | 'circuit' = 'circuit') {
    this.world = world;
    this.width = width;
    this.height = height;
    this.trackType = trackType;
    
    this.createWalls();
  }
  
  private createWalls(): void {
    // Clear existing walls
    this.removeWalls();
    
    // Create walls based on track type
    switch (this.trackType) {
      case 'straight':
        this.createStraightTrack();
        break;
      case 'oval':
        this.createOvalTrack();
        break;
      case 'circuit':
        this.createCircuitTrack();
        break;
    }
  }
  
  private removeWalls(): void {
    // Remove all existing wall bodies from the world
    for (const wall of this.walls) {
      Matter.Composite.remove(this.world, wall);
    }
    this.walls = [];
  }
  
  private createStraightTrack(): void {
    const wallThickness = 20;
    const wallOptions = {
      isStatic: true,
      friction: 0.1,
      restitution: 0.2
    };
    
    // Left wall
    const leftWall = Matter.Bodies.rectangle(
      wallThickness / 2,
      this.height / 2,
      wallThickness,
      this.height,
      wallOptions
    );
    
    // Right wall
    const rightWall = Matter.Bodies.rectangle(
      this.width - wallThickness / 2,
      this.height / 2,
      wallThickness,
      this.height,
      wallOptions
    );
    
    // Add walls to the world and our array
    Matter.Composite.add(this.world, [leftWall, rightWall]);
    this.walls.push(leftWall, rightWall);
  }
  
  private createOvalTrack(): void {
    const wallThickness = 20;
    const wallOptions = {
      isStatic: true,
      friction: 0.1,
      restitution: 0.2
    };
    
    // Left wall
    const leftWall = Matter.Bodies.rectangle(
      wallThickness / 2,
      this.height / 2,
      wallThickness,
      this.height,
      wallOptions
    );
    
    // Right wall
    const rightWall = Matter.Bodies.rectangle(
      this.width - wallThickness / 2,
      this.height / 2,
      wallThickness,
      this.height,
      wallOptions
    );
    
    // Top wall with opening
    const topLeftWall = Matter.Bodies.rectangle(
      this.width / 6,
      wallThickness / 2,
      this.width / 3,
      wallThickness,
      wallOptions
    );
    
    const topRightWall = Matter.Bodies.rectangle(
      this.width * 5/6,
      wallThickness / 2,
      this.width / 3,
      wallThickness,
      wallOptions
    );
    
    // Bottom wall with opening
    const bottomLeftWall = Matter.Bodies.rectangle(
      this.width / 6,
      this.height - wallThickness / 2,
      this.width / 3,
      wallThickness,
      wallOptions
    );
    
    const bottomRightWall = Matter.Bodies.rectangle(
      this.width * 5/6,
      this.height - wallThickness / 2,
      this.width / 3,
      wallThickness,
      wallOptions
    );
    
    // Add walls to the world and our array
    Matter.Composite.add(this.world, [
      leftWall, rightWall, 
      topLeftWall, topRightWall, 
      bottomLeftWall, bottomRightWall
    ]);
    
    this.walls.push(
      leftWall, rightWall, 
      topLeftWall, topRightWall, 
      bottomLeftWall, bottomRightWall
    );
  }
  
  private createCircuitTrack(): void {
    const wallThickness = 20;
    const wallOptions = {
      isStatic: true,
      friction: 0.1,
      restitution: 0.2
    };
    
    // Outer boundaries
    // Left wall
    const leftWall = Matter.Bodies.rectangle(
      wallThickness / 2,
      this.height / 2,
      wallThickness,
      this.height,
      wallOptions
    );
    
    // Right wall
    const rightWall = Matter.Bodies.rectangle(
      this.width - wallThickness / 2,
      this.height / 2,
      wallThickness,
      this.height,
      wallOptions
    );
    
    // Top wall
    const topWall = Matter.Bodies.rectangle(
      this.width / 2,
      wallThickness / 2,
      this.width,
      wallThickness,
      wallOptions
    );
    
    // Bottom wall
    const bottomWall = Matter.Bodies.rectangle(
      this.width / 2,
      this.height - wallThickness / 2,
      this.width,
      wallThickness,
      wallOptions
    );
    
    // Add some obstacles inside the track
    
    // Center obstacle
    const centerObstacle = Matter.Bodies.rectangle(
      this.width / 2,
      this.height / 2,
      100,
      100,
      wallOptions
    );
    
    // Top-left chicane
    const topLeftChicane = Matter.Bodies.rectangle(
      this.width / 4,
      this.height / 4,
      150,
      30,
      wallOptions
    );
    
    // Bottom-right chicane
    const bottomRightChicane = Matter.Bodies.rectangle(
      this.width * 3/4,
      this.height * 3/4,
      150,
      30,
      wallOptions
    );
    
    // Add walls to the world and our array
    Matter.Composite.add(this.world, [
      leftWall, rightWall, topWall, bottomWall,
      centerObstacle, topLeftChicane, bottomRightChicane
    ]);
    
    this.walls.push(
      leftWall, rightWall, topWall, bottomWall,
      centerObstacle, topLeftChicane, bottomRightChicane
    );
  }
  
  draw(ctx: CanvasRenderingContext2D): void {
    // Draw road background
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw road markings
    ctx.strokeStyle = 'white';
    ctx.lineWidth = this.lineWidth;
    
    // Draw lane markings (dashed)
    for (let i = 1; i < this.laneCount; i++) {
      const x = this.width / this.laneCount * i;
      
      ctx.beginPath();
      ctx.setLineDash([this.lineLength, this.lineGap]);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    
    // Draw horizontal lane markings
    for (let i = 1; i < this.laneCount; i++) {
      const y = this.height / this.laneCount * i;
      
      ctx.beginPath();
      ctx.setLineDash([this.lineLength, this.lineGap]);
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    
    // Reset line dash
    ctx.setLineDash([]);
    
    // Draw walls
    for (const wall of this.walls) {
      this.drawBody(ctx, wall, '#333');
    }
  }
  
  private drawBody(ctx: CanvasRenderingContext2D, body: Matter.Body, color: string): void {
    const vertices = body.vertices;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    
    // Draw the body as a polygon using its vertices
    ctx.moveTo(vertices[0].x, vertices[0].y);
    
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    
    ctx.closePath();
    ctx.fill();
    
    // Add a border
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
