import { Wall } from './wall';

export class Road {
  private width: number;
  private height: number;
  private laneWidth: number = 80;
  private laneCount: number = 5;
  private lineWidth: number = 5;
  private lineLength: number = 30;
  private lineGap: number = 30;
  private walls: Wall[] = [];
  private trackType: 'straight' | 'oval' | 'circuit' = 'circuit';

  constructor(width: number, height: number, trackType: 'straight' | 'oval' | 'circuit' = 'circuit') {
    this.width = width;
    this.height = height;
    this.trackType = trackType;
    this.createWalls();
  }
  
  private createWalls(): void {
    // Clear existing walls
    this.walls = [];
    
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
  
  private createStraightTrack(): void {
    // Create outer walls (boundaries)
    const wallThickness = 20;
    
    // Left wall
    this.walls.push(new Wall(
      this.laneWidth - wallThickness,
      0,
      wallThickness,
      this.height,
      '#333'
    ));
    
    // Right wall
    this.walls.push(new Wall(
      this.width - this.laneWidth,
      0,
      wallThickness,
      this.height,
      '#333'
    ));
  }
  
  private createOvalTrack(): void {
    // Create outer walls (boundaries)
    const wallThickness = 20;
    
    // Left wall
    this.walls.push(new Wall(
      this.laneWidth - wallThickness,
      0,
      wallThickness,
      this.height,
      '#333'
    ));
    
    // Right wall
    this.walls.push(new Wall(
      this.width - this.laneWidth,
      0,
      wallThickness,
      this.height,
      '#333'
    ));
    
    // Top wall with opening
    this.walls.push(new Wall(
      0,
      0,
      this.width / 3,
      wallThickness,
      '#333'
    ));
    
    this.walls.push(new Wall(
      this.width * 2/3,
      0,
      this.width / 3,
      wallThickness,
      '#333'
    ));
    
    // Bottom wall with opening
    this.walls.push(new Wall(
      0,
      this.height - wallThickness,
      this.width / 3,
      wallThickness,
      '#333'
    ));
    
    this.walls.push(new Wall(
      this.width * 2/3,
      this.height - wallThickness,
      this.width / 3,
      wallThickness,
      '#333'
    ));
  }
  
  private createCircuitTrack(): void {
    const wallThickness = 20;
    
    // Create a more complex circuit with various obstacles
    
    // Outer boundaries
    // Left wall
    this.walls.push(new Wall(
      0,
      0,
      wallThickness,
      this.height,
      '#333'
    ));
    
    // Right wall
    this.walls.push(new Wall(
      this.width - wallThickness,
      0,
      wallThickness,
      this.height,
      '#333'
    ));
    
    // Top wall
    this.walls.push(new Wall(
      0,
      0,
      this.width,
      wallThickness,
      '#333'
    ));
    
    // Bottom wall
    this.walls.push(new Wall(
      0,
      this.height - wallThickness,
      this.width,
      wallThickness,
      '#333'
    ));
    
    // Add some obstacles inside the track
    
    // Center obstacle
    this.walls.push(new Wall(
      this.width / 2 - 50,
      this.height / 2 - 50,
      100,
      100,
      '#555'
    ));
    
    // Top-left chicane
    this.walls.push(new Wall(
      this.width / 4,
      this.height / 4,
      150,
      30,
      '#555'
    ));
    
    // Bottom-right chicane
    this.walls.push(new Wall(
      this.width * 3/4 - 150,
      this.height * 3/4,
      150,
      30,
      '#555'
    ));
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
      wall.draw(ctx);
    }
  }
  
  getWalls(): Wall[] {
    return this.walls;
  }
  
  getDimensions(): { width: number, height: number } {
    return { width: this.width, height: this.height };
  }
}
