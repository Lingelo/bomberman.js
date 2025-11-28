import { Sprite } from '../utils/sprite';
import { Action } from '../state/actions';
import { dispatch, getState, subscribe } from '../state/redux';
import { CharacterStatus, type CharacterStatusType } from './character-status';
import { DIRECTION, type Direction } from './direction';
import { SKULL_EFFECT, type SkullEffectType } from './skull-effect';
import type { CanvasContext, Coordinate, GameState } from '../types';
import type { Color } from './color';
import type { Bonus } from './bonus';

export class Character {
  x: number;
  y: number;
  direction: Direction;
  animationState: number;
  color: Color;
  radius: number;
  status: CharacterStatusType;
  offsetX: number;
  offsetY: number;
  animationDuration: number;
  bombMax: number;
  bombUsed: number;
  pixelsToTreat: number;
  gamePadIndex?: number;
  nextFrame: Coordinate;
  bonus: Bonus[];
  isBot: boolean;
  hasKick: boolean;
  hasPunch: boolean;
  hasRemote: boolean;
  skullEffect: SkullEffectType;
  skullTimer: number;
  diarrheaCooldown: number;

  constructor(color: Color, x: number, y: number, direction: Direction, gamePadIndex?: number) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.animationState = -1;
    this.color = color;
    this.radius = 2;
    this.status = CharacterStatus.ALIVE;
    this.offsetX = 0;
    this.offsetY = 0;
    this.animationDuration = 15;
    this.bombMax = 1;
    this.bombUsed = 0;
    this.pixelsToTreat = 0;
    this.gamePadIndex = gamePadIndex;
    this.nextFrame = this.getNextFrame(direction);
    this.bonus = [];
    this.isBot = false;
    this.hasKick = false;
    this.hasPunch = false;
    this.hasRemote = false;
    this.skullEffect = SKULL_EFFECT.NONE;
    this.skullTimer = 0;
    this.diarrheaCooldown = 0;

    subscribe(() => {
      this.bonus = getState().bonus;
    });
  }

  applySkullEffect(effect: SkullEffectType, duration: number): void {
    this.skullEffect = effect;
    this.skullTimer = duration;
  }

  updateSkullEffect(): void {
    if (this.skullTimer > 0) {
      this.skullTimer--;
      if (this.skullTimer <= 0) {
        this.skullEffect = SKULL_EFFECT.NONE;
      }
    }
    if (this.diarrheaCooldown > 0) {
      this.diarrheaCooldown--;
    }
  }

  getEffectiveAnimationDuration(): number {
    switch (this.skullEffect) {
      case SKULL_EFFECT.SLOW:
        return this.animationDuration * 2; // 50% slower
      case SKULL_EFFECT.FAST:
        return Math.max(4, Math.floor(this.animationDuration / 2)); // 2x faster
      default:
        return this.animationDuration;
    }
  }

  canDropBomb(): boolean {
    return this.skullEffect !== SKULL_EFFECT.CONSTIPATION;
  }

  shouldAutoDropBomb(): boolean {
    if (this.skullEffect === SKULL_EFFECT.DIARRHEA && this.diarrheaCooldown <= 0) {
      this.diarrheaCooldown = 30; // Drop bomb every 0.5 seconds
      return true;
    }
    return false;
  }

  render(canvasContext: CanvasContext): void {
    switch (this.status) {
      case CharacterStatus.ALIVE:
        this.renderAlive(canvasContext);
        break;
      case CharacterStatus.DEAD:
        this.renderDead(canvasContext);
        break;
      case CharacterStatus.VICTORY:
        this.renderVictory(canvasContext);
        break;
    }
  }

  renderAlive(canvasContext: CanvasContext): void {
    this.updateSkullEffect();
    const effectiveDuration = this.getEffectiveAnimationDuration();

    let frame = 1;
    if (this.animationState >= effectiveDuration) {
      this.animationState = -1;
    } else if (this.animationState >= 0) {
      frame = Math.floor(this.animationState / 8);
      if (frame > 3) {
        frame %= 4;
      }

      this.pixelsToTreat = 32 - 32 * (this.animationState / effectiveDuration);

      if (this.pixelsToTreat < 32 / 2) {
        this.x = this.nextFrame.x;
        this.y = this.nextFrame.y;
      }

      if (this.direction === DIRECTION.TOP) {
        this.offsetY = this.pixelsToTreat;
      } else if (this.direction === DIRECTION.DOWN) {
        this.offsetY = -this.pixelsToTreat;
      } else if (this.direction === DIRECTION.LEFT) {
        this.offsetX = this.pixelsToTreat;
      } else if (this.direction === DIRECTION.RIGHT) {
        this.offsetX = -this.pixelsToTreat;
      }

      this.animationState++;
    }

    const getNextImageFrame = (): number => {
      switch (frame) {
        case 0:
          return 1;
        case 1:
          return 0;
        case 2:
          return -1;
        case 3:
          return 0;
        default:
          return 1;
      }
    };

    let targetX: number;
    let targetY: number;
    if (this.animationState !== -1) {
      targetX = this.nextFrame.x * 32 + this.offsetX;
      targetY = this.nextFrame.y * 32 - 8 + this.offsetY;
    } else {
      targetX = this.x * 32 + this.offsetX;
      targetY = this.y * 32 - 8 + this.offsetY;
    }
    canvasContext.ctx.drawImage(
      Sprite.characterAlive(),
      Sprite.characterAlive().width * (getNextImageFrame() + this.direction),
      Sprite.characterAlive().height * this.color,
      Sprite.characterAlive().width,
      Sprite.characterAlive().height,
      targetX,
      targetY,
      32,
      32
    );
  }

  getNextFrame(direction: Direction): Coordinate {
    const coord: Coordinate = { x: this.x, y: this.y };
    switch (direction) {
      case DIRECTION.DOWN:
        coord.y++;
        break;
      case DIRECTION.LEFT:
        coord.x--;
        break;
      case DIRECTION.RIGHT:
        coord.x++;
        break;
      case DIRECTION.TOP:
        coord.y--;
        break;
    }
    return coord;
  }

  getReversedDirection(direction: Direction): Direction {
    switch (direction) {
      case DIRECTION.TOP:
        return DIRECTION.DOWN;
      case DIRECTION.DOWN:
        return DIRECTION.TOP;
      case DIRECTION.LEFT:
        return DIRECTION.RIGHT;
      case DIRECTION.RIGHT:
        return DIRECTION.LEFT;
      default:
        return direction;
    }
  }

  move(direction: Direction, state: GameState): void {
    if (this.animationState >= 0) return;

    if (!direction) {
      return;
    }

    // Apply REVERSE effect
    const effectiveDirection = this.skullEffect === SKULL_EFFECT.REVERSE
      ? this.getReversedDirection(direction)
      : direction;

    this.direction = effectiveDirection;
    this.nextFrame = this.getNextFrame(effectiveDirection);

    if (
      this.nextFrame.x < 0 ||
      this.nextFrame.y < 0 ||
      this.nextFrame.x >= state.map[0].length ||
      this.nextFrame.y >= state.map.length
    ) {
      return;
    }

    if (state.map[this.nextFrame.y][this.nextFrame.x] !== 2) {
      return;
    }

    if (
      state.walls[this.nextFrame.x][this.nextFrame.y] &&
      !state.walls[this.nextFrame.x][this.nextFrame.y]!.destroyed
    ) {
      return;
    }

    this.bonus.forEach((bonus) => {
      if (bonus.x === this.nextFrame.x && bonus.y === this.nextFrame.y) {
        dispatch({
          type: Action.GET_BONUS,
          payload: {
            bonus,
            playerColor: this.color,
          },
        });
      }
    });

    for (let i = 0; i < state.bombs.length; i++) {
      const bomb = state.bombs[i];
      if (bomb.x === this.nextFrame.x && bomb.y === this.nextFrame.y) {
        // If player has KICK, push the bomb
        if (this.hasKick && !bomb.isSliding) {
          bomb.kick(direction);
          return;
        }
        return;
      }
    }

    this.animationState = 1;
  }

  renderDead(canvasContext: CanvasContext): void {
    if (this.status === CharacterStatus.ALIVE) {
      this.status = CharacterStatus.DEAD;
      this.animationState = 0;
    }

    canvasContext.ctx.drawImage(
      Sprite.characterDead(),
      Sprite.characterDead().width * Math.floor(this.animationState / 10),
      Sprite.characterDead().height * this.color,
      Sprite.characterDead().width,
      Sprite.characterDead().height,
      this.x * 32,
      this.y * 32,
      32,
      32
    );

    this.animationState++;
  }

  renderVictory(canvasContext: CanvasContext): void {
    const frame = Math.floor(this.animationState / this.animationDuration);

    const image = frame % 2 === 0 ? 0 : 1;

    canvasContext.ctx.drawImage(
      Sprite.characterVictory(),
      Sprite.characterVictory().width * image,
      Sprite.characterVictory().height * this.color,
      Sprite.characterVictory().width,
      Sprite.characterVictory().height,
      this.x * 32,
      this.y * 32,
      32,
      32
    );
    this.animationState++;
  }
}
