import { Sprite } from '../utils/sprite';

export class Flame {
  constructor(x, y, power, cardinal) {
    this.x = x;
    this.y = y;
    this.power = power;
    this.cardinal = cardinal;
  }

  render(canvasContext) {
    canvasContext.ctx.drawImage(
      Sprite.flame(),
      Sprite.flame().width * this.cardinal - this.power * Sprite.flame().width,
      0,
      Sprite.flame().width,
      Sprite.flame().height,
      this.x * 32,
      this.y * 32,
      34,
      34,
    );
  }
}
