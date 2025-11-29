import { Sprite } from '../utils/sprite';
import { Action } from '../state/actions';
import { dispatch, getState } from '../state/redux';
import { DIRECTION, type Direction } from './direction';
import type { CanvasContext, GameMap, WallGrid } from '../types';
import type { Character } from './character';

export class Bomb {
  character: Character;
  x: number;
  y: number;
  animationState: number;
  animationDuration: number;
  timeElapsed: number;
  time: number;
  accelerator: number;
  timer: number;
  slidingDirection: Direction | null;
  slidingOffset: number;
  isSliding: boolean;
  // Throwing properties
  isFlying: boolean;
  flyingDirection: Direction | null;
  flyingDistance: number;
  flyingProgress: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  // Remote properties
  isRemote: boolean;

  constructor(character: Character) {
    this.character = character;
    this.x = character.x;
    this.y = character.y;
    this.animationState = 0;
    this.animationDuration = 16;
    this.timeElapsed = 0;
    this.time = 0;
    this.accelerator = 30;
    this.timer = 128;
    this.slidingDirection = null;
    this.slidingOffset = 0;
    this.isSliding = false;
    // Throwing init
    this.isFlying = false;
    this.flyingDirection = null;
    this.flyingDistance = 3;
    this.flyingProgress = 0;
    this.startX = character.x;
    this.startY = character.y;
    this.targetX = character.x;
    this.targetY = character.y;
    // Remote init
    this.isRemote = character.hasRemote;
  }

  detonate(): void {
    if (this.isRemote && !this.isFlying) {
      // Force immediate explosion
      this.animationDuration = 2;
      this.timeElapsed = this.accelerator + 1;
    }
  }

  kick(direction: Direction): void {
    this.slidingDirection = direction;
    this.isSliding = true;
    this.slidingOffset = 0;
  }

  throw(direction: Direction, distance: number = 3): void {
    if (this.isFlying || this.isSliding) return;

    const state = getState();
    this.flyingDirection = direction;
    this.flyingDistance = distance;
    this.flyingProgress = 0;
    this.startX = this.x;
    this.startY = this.y;
    this.isFlying = true;

    // Calculate target position (find where bomb can land)
    let targetX = this.x;
    let targetY = this.y;

    for (let i = 1; i <= distance; i++) {
      let newX = this.x;
      let newY = this.y;

      switch (direction) {
        case DIRECTION.TOP:
          newY = this.y - i;
          break;
        case DIRECTION.DOWN:
          newY = this.y + i;
          break;
        case DIRECTION.LEFT:
          newX = this.x - i;
          break;
        case DIRECTION.RIGHT:
          newX = this.x + i;
          break;
      }

      // Check if landing spot is valid
      if (this.canLandAt(newX, newY, state.map, state.walls, state.bombs)) {
        targetX = newX;
        targetY = newY;
      } else {
        // Stop at the last valid position
        break;
      }
    }

    this.targetX = targetX;
    this.targetY = targetY;
  }

  private canLandAt(newX: number, newY: number, map: GameMap, walls: WallGrid, bombs: Bomb[]): boolean {
    // Check bounds
    if (newX < 0 || newY < 0 || newY >= map.length || newX >= map[0].length) {
      return false;
    }

    // Check if it's a walkable tile (not a block)
    if (map[newY][newX] !== 2) {
      return false;
    }

    // Check for walls
    if (walls[newX] && walls[newX][newY] && !walls[newX][newY]!.destroyed) {
      return false;
    }

    // Check for other bombs
    for (const bomb of bombs) {
      if (bomb !== this && bomb.x === newX && bomb.y === newY && !bomb.isFlying) {
        return false;
      }
    }

    return true;
  }

  private updateFlying(): void {
    if (!this.isFlying) return;

    const flyingSpeed = 6; // pixels per frame
    const totalDistance = Math.abs(this.targetX - this.startX) + Math.abs(this.targetY - this.startY);
    const totalPixels = totalDistance * 32;

    this.flyingProgress += flyingSpeed;

    if (this.flyingProgress >= totalPixels) {
      // Landing
      this.x = this.targetX;
      this.y = this.targetY;
      this.isFlying = false;
      this.flyingDirection = null;
      this.flyingProgress = 0;
    }
  }

  private canMoveTo(newX: number, newY: number, map: GameMap, walls: WallGrid, bombs: Bomb[], characters: Character[]): boolean {
    // Check bounds
    if (newX < 0 || newY < 0 || newY >= map.length || newX >= map[0].length) {
      return false;
    }

    // Check if it's a walkable tile
    if (map[newY][newX] !== 2) {
      return false;
    }

    // Check for walls
    if (walls[newX] && walls[newX][newY] && !walls[newX][newY]!.destroyed) {
      return false;
    }

    // Check for other bombs
    for (const bomb of bombs) {
      if (bomb !== this && bomb.x === newX && bomb.y === newY) {
        return false;
      }
    }

    // Check for characters (bomb stops when hitting a player)
    for (const char of characters) {
      if (char.x === newX && char.y === newY) {
        return false;
      }
    }

    return true;
  }

  private updateSliding(): void {
    if (!this.isSliding || this.slidingDirection === null) return;

    const state = getState();
    const slidingSpeed = 4; // pixels per frame
    this.slidingOffset += slidingSpeed;

    if (this.slidingOffset >= 32) {
      // Move to next cell
      let newX = this.x;
      let newY = this.y;

      switch (this.slidingDirection) {
        case DIRECTION.TOP:
          newY--;
          break;
        case DIRECTION.DOWN:
          newY++;
          break;
        case DIRECTION.LEFT:
          newX--;
          break;
        case DIRECTION.RIGHT:
          newX++;
          break;
      }

      if (this.canMoveTo(newX, newY, state.map, state.walls, state.bombs, state.characters)) {
        this.x = newX;
        this.y = newY;
        this.slidingOffset = 0;
      } else {
        // Stop sliding
        this.isSliding = false;
        this.slidingDirection = null;
        this.slidingOffset = 0;
      }
    }
  }

  render(canvasContext: CanvasContext): void {
    this.time++;
    this.updateSliding();
    this.updateFlying();

    let frame = Math.floor(this.animationState / this.animationDuration);
    if (frame > 2) {
      frame %= 3;
    }
    this.animationState++;

    // Don't explode while flying, and remote bombs don't auto-explode
    if (!this.isFlying && !this.isRemote && this.timeElapsed++ > this.accelerator) {
      if (this.animationDuration < 4) {
        dispatch({
          type: Action.ADD_BLAST,
          payload: { bomb: this, character: this.character },
        });

        dispatch({
          type: Action.BOMB_EXPLODED,
          payload: { bomb: this },
        });
      }

      this.animationDuration /= 2;
      this.timeElapsed = 0;
    }

    // Handle manual detonation for remote bombs
    if (this.isRemote && this.timeElapsed++ > this.accelerator) {
      if (this.animationDuration < 4) {
        dispatch({
          type: Action.ADD_BLAST,
          payload: { bomb: this, character: this.character },
        });

        dispatch({
          type: Action.BOMB_EXPLODED,
          payload: { bomb: this },
        });
      }

      if (this.animationDuration < 16) {
        // Only progress if detonation was triggered
        this.animationDuration /= 2;
      }
      this.timeElapsed = 0;
    }

    // Calculate render position
    let renderX = this.x * 32 + 4;
    let renderY = this.y * 32 + 6;
    let scale = 1;

    // Flying animation with arc
    if (this.isFlying && this.flyingDirection !== null) {
      const totalDistance = Math.abs(this.targetX - this.startX) + Math.abs(this.targetY - this.startY);
      const totalPixels = totalDistance * 32;
      const progress = this.flyingProgress / totalPixels; // 0 to 1

      // Interpolate position
      const currentPixelX = this.startX * 32 + (this.targetX - this.startX) * 32 * progress;
      const currentPixelY = this.startY * 32 + (this.targetY - this.startY) * 32 * progress;

      // Arc height (parabola: max at middle, 0 at start/end)
      const arcHeight = Math.sin(progress * Math.PI) * 48;

      renderX = currentPixelX + 4;
      renderY = currentPixelY + 6 - arcHeight;

      // Scale effect (bigger at apex)
      scale = 1 + Math.sin(progress * Math.PI) * 0.3;
    } else if (this.isSliding && this.slidingDirection !== null) {
      switch (this.slidingDirection) {
        case DIRECTION.TOP:
          renderY -= this.slidingOffset;
          break;
        case DIRECTION.DOWN:
          renderY += this.slidingOffset;
          break;
        case DIRECTION.LEFT:
          renderX -= this.slidingOffset;
          break;
        case DIRECTION.RIGHT:
          renderX += this.slidingOffset;
          break;
      }
    }

    const baseSize = 32 / 1.5;
    const size = baseSize * scale;
    const offset = (size - baseSize) / 2;

    canvasContext.ctx.drawImage(
      Sprite.bomb(),
      frame * Sprite.bomb().width,
      0,
      Sprite.bomb().width,
      Sprite.bomb().height,
      renderX - offset,
      renderY - offset,
      size,
      size,
    );
  }
}
