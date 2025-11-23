import { Sprite } from '../utils/sprite';
import type { CanvasContext } from '../types';

export class Ground {
  private canvasContext: CanvasContext;

  constructor(canvasContext: CanvasContext) {
    this.canvasContext = canvasContext;
  }

  render(x: number, y: number): void {
    const ctx = this.canvasContext.ctx;
    const px = 32 * y;
    const py = 32 * x;

    // Draw original sprite
    ctx.drawImage(Sprite.ground(), 0, 0, 32, 32, px, py, 32, 32);

    // Darken overlay for retro look
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(px, py, 32, 32);
  }
}
