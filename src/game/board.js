import { Sprite } from '../utils/sprite';

export class Board {
  constructor(type, canvasContext) {
    this.type = type;
    this.canvasContext = canvasContext;
  }

  render(x, y) {
    // eslint-disable-next-line default-case
    switch (this.type) {
      case 'UP_LEFT':
        this.canvasContext.ctx.drawImage(Sprite.ground(), 96, 64, 32, 32, 32 * y, 32 * x, 32, 32);
        break;
      case 'UP_RIGHT':
        this.canvasContext.ctx.drawImage(Sprite.ground(), 96, 96, 32, 32, 32 * y, 0, 32, 32);
        break;
      case 'BOTTOM_LEFT':
        this.canvasContext.ctx.drawImage(Sprite.ground(), 96, 32, 32, 32, 0, 32 * x, 32, 32);
        break;
      case 'UP':
        this.canvasContext.ctx.drawImage(Sprite.ground(), 32, 96, 32, 32, 32 * y, 0, 32, 32);
        break;
      case 'BOTTOM_RIGHT':
        this.canvasContext.ctx.drawImage(Sprite.ground(), 96, 0, 32, 32, 32 * y, 32 * x, 32, 32);
        break;
      case 'BOTTOM':
        this.canvasContext.ctx.drawImage(Sprite.ground(), 32, 32, 32, 32, 32 * y, 32 * x, 32, 32);
        break;
      case 'LEFT':
        this.canvasContext.ctx.drawImage(Sprite.ground(), 64, 64, 32, 32, 32 * y, 32 * x, 32, 32);
        break;
      case 'RIGHT':
        this.canvasContext.ctx.drawImage(Sprite.ground(), 0, 64, 32, 32, 32 * y, 32 * x, 32, 32);
        break;
    }
  }
}
