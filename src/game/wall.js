import { Sprite } from '../utils/sprite';

export class Wall {
  constructor(x, y, destroyed) {
    this.x = x;
    this.y = y;
    this.animationState = 0;
    this.animationDuration = 6;
    this.destroyed = destroyed;
  }

  render(canvasContext) {
    let frame = 0;

    if (this.destroyed) {
      frame = Math.floor(this.animationState / this.animationDuration);
      this.animationState++;
    }

    canvasContext.ctx.drawImage(
      Sprite.wall(),
      frame * Sprite.wall().width,
      0,
      Sprite.wall().width,
      Sprite.wall().height,
      this.x * 32,
      this.y * 32,
      32,
      32,
    );
  }
}
