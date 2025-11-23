import { Sprite } from '../utils/sprite';
import type { CanvasContext } from '../types';
import type { Cardinal } from './cardinal';

export class Flame {
  x: number;
  y: number;
  power: number;
  cardinal: Cardinal;

  constructor(x: number, y: number, power: number, cardinal: Cardinal) {
    this.x = x;
    this.y = y;
    this.power = power;
    this.cardinal = cardinal;
  }

  render(canvasContext: CanvasContext): void {
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
