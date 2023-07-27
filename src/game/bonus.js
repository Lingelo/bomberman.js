import { Sprite } from '../utils/sprite';

export class Bonus {
  constructor(x, y, type) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.etatAnimation = 0;
    this.dureeAnimation = 16;
  }

  render(canvasContext) {
    let frame = Math.floor(this.etatAnimation / this.dureeAnimation);
    if (frame > 1) {
      frame %= 2;
    }

    canvasContext.ctx.drawImage(
      Sprite.bonus(),
      (frame + this.type * 2) * Sprite.bonus().width,
      0,
      Sprite.bonus().width,
      Sprite.bonus().height,
      this.x * 32 + 4,
      this.y * 32 + 6,
      32 / 1.5,
      32 / 1.5,
    );

    this.etatAnimation++;
  }
}
