export class Road {
  private width: number;
  private height: number;
  private laneWidth: number = 80;
  private laneCount: number = 5;
  private lineWidth: number = 5;
  private lineLength: number = 30;
  private lineGap: number = 30;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw road background
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw road markings
    ctx.strokeStyle = 'white';
    ctx.lineWidth = this.lineWidth;
    
    // Draw side lines (solid)
    ctx.beginPath();
    ctx.moveTo(this.laneWidth, 0);
    ctx.lineTo(this.laneWidth, this.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(this.width - this.laneWidth, 0);
    ctx.lineTo(this.width - this.laneWidth, this.height);
    ctx.stroke();
    
    // Draw lane markings (dashed)
    for (let i = 1; i < this.laneCount; i++) {
      const x = this.laneWidth * i + this.laneWidth;
      
      ctx.beginPath();
      ctx.setLineDash([this.lineLength, this.lineGap]);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    
    // Reset line dash
    ctx.setLineDash([]);
  }
}
