import { Sprite } from '../utils/sprite';
import type { CanvasContext } from '../types';

export class Block {
  private canvasContext: CanvasContext;

  constructor(canvasContext: CanvasContext) {
    this.canvasContext = canvasContext;
  }

  render(x: number, y: number): void {
    this.canvasContext.ctx.drawImage(Sprite.ground(), 32, 64, 32, 32, 32 * y, 32 * x, 32, 32);
  }
}
