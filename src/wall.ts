interface Vector2D {
  x: number;
  y: number;
}

export class Wall {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  private color: string;

  constructor(x: number, y: number, width: number, height: number, color: string = '#333') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }

  // Check if a point is inside the wall
  containsPoint(pointX: number, pointY: number): boolean {
    return (
      pointX >= this.x &&
      pointX <= this.x + this.width &&
      pointY >= this.y &&
      pointY <= this.y + this.height
    );
  }

  // Get the edges of the wall as line segments
  getEdges(): [Vector2D, Vector2D][] {
    const topLeft = { x: this.x, y: this.y };
    const topRight = { x: this.x + this.width, y: this.y };
    const bottomRight = { x: this.x + this.width, y: this.y + this.height };
    const bottomLeft = { x: this.x, y: this.y + this.height };

    return [
      [topLeft, topRight],
      [topRight, bottomRight],
      [bottomRight, bottomLeft],
      [bottomLeft, topLeft]
    ];
  }

  // Get the normal vector of the closest edge to a point
  getNormal(pointX: number, pointY: number): Vector2D {
    // Calculate the center of the wall
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    // Calculate the vector from the center to the point
    const dirX = pointX - centerX;
    const dirY = pointY - centerY;
    
    // Calculate the half-dimensions of the wall
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    
    // Determine which side was hit by comparing the ratios
    const absX = Math.abs(dirX / halfWidth);
    const absY = Math.abs(dirY / halfHeight);
    
    // Return normal based on which side was hit
    if (absX > absY) {
      // Hit left or right side
      return { x: Math.sign(dirX), y: 0 };
    } else {
      // Hit top or bottom side
      return { x: 0, y: Math.sign(dirY) };
    }
  }

  // Draw the wall
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Add some visual detail
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
}
