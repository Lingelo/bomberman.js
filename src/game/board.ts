import { Sprite } from '../utils/sprite';
import type { CanvasContext } from '../types';

type BoardType = 'UP_LEFT' | 'UP_RIGHT' | 'BOTTOM_LEFT' | 'UP' | 'BOTTOM_RIGHT' | 'BOTTOM' | 'LEFT' | 'RIGHT';

export class Board {
  private type: BoardType;
  private canvasContext: CanvasContext;

  constructor(type: BoardType, canvasContext: CanvasContext) {
    this.type = type;
    this.canvasContext = canvasContext;
  }

  render(x: number, y: number): void {
    const ctx = this.canvasContext.ctx;
    let px = 32 * y;
    let py = 32 * x;

    switch (this.type) {
      case 'UP_LEFT':
        ctx.drawImage(Sprite.ground(), 96, 64, 32, 32, px, py, 32, 32);
        break;
      case 'UP_RIGHT':
        ctx.drawImage(Sprite.ground(), 96, 96, 32, 32, px, 0, 32, 32);
        py = 0;
        break;
      case 'BOTTOM_LEFT':
        ctx.drawImage(Sprite.ground(), 96, 32, 32, 32, 0, py, 32, 32);
        px = 0;
        break;
      case 'UP':
        ctx.drawImage(Sprite.ground(), 32, 96, 32, 32, px, 0, 32, 32);
        py = 0;
        break;
      case 'BOTTOM_RIGHT':
        ctx.drawImage(Sprite.ground(), 96, 0, 32, 32, px, py, 32, 32);
        break;
      case 'BOTTOM':
        ctx.drawImage(Sprite.ground(), 32, 32, 32, 32, px, py, 32, 32);
        break;
      case 'LEFT':
        ctx.drawImage(Sprite.ground(), 64, 64, 32, 32, px, py, 32, 32);
        break;
      case 'RIGHT':
        ctx.drawImage(Sprite.ground(), 0, 64, 32, 32, px, py, 32, 32);
        break;
    }

    // Darken overlay for retro look
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(px, py, 32, 32);
  }
}
