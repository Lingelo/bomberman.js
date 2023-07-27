import { Sprite } from '../utils/sprite';
import { Action } from '../state/actions';
import { dispatch } from '../state/redux';

export class Bomb {
  constructor(character) {
    this.character = character;
    this.x = character.x;
    this.y = character.y;
    this.animationState = 0;
    this.animationDuration = 16;
    this.timeElapsed = 0;
    this.time = 0;
    this.accelerator = 30;
    this.timer = 128;
  }

  render(canvasContext) {
    this.time++;

    let frame = Math.floor(this.animationState / this.animationDuration);
    if (frame > 2) {
      frame %= 3;
    }
    this.animationState++;

    if (this.timeElapsed++ > this.accelerator) {
      if (this.animationDuration < 4) {
        const currentBomb = this;
        const { character } = this;

        dispatch({
          type: Action.ADD_BLAST,
          payload: { bomb: currentBomb, character },
        });

        dispatch({
          type: Action.BOMB_EXPLODED,
          payload: { bomb: currentBomb },
        });
      }

      this.animationDuration /= 2;
      this.timeElapsed = 0;
    }

    canvasContext.ctx.drawImage(
      Sprite.bomb(),
      frame * Sprite.bomb().width,
      0,
      Sprite.bomb().width,
      Sprite.bomb().height,
      this.x * 32 + 4,
      this.y * 32 + 6,
      32 / 1.5,
      32 / 1.5,
    );
  }
}
