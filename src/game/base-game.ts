import { Action } from '../state/actions';
import { dispatch, getState, subscribe } from '../state/redux';
import { TILE } from '../../shared/constants/maps';
import { Ground } from './ground';
import { Board } from './board';
import { Block } from './block';
import { CharacterStatus } from './character-status';
import type { CanvasContext, GameMap, WallGrid, Unsubscribe } from '../types';
import type { Character } from './character';
import type { Bonus } from './bonus';
import type { Bomb } from './bomb';

export abstract class BaseGame {
  map: GameMap;
  characters: Character[];
  walls: WallGrid;
  bonus: Bonus[];
  bombs: Bomb[];
  code: string;

  // Reusable rendering objects (created once, not every frame)
  protected ground: Ground | null = null;
  protected frameUpLeft: Board | null = null;
  protected frameUpRight: Board | null = null;
  protected frameUp: Board | null = null;
  protected frameBottomLeft: Board | null = null;
  protected frameBottomRight: Board | null = null;
  protected frameBottom: Board | null = null;
  protected frameLeft: Board | null = null;
  protected frameRight: Board | null = null;
  protected block: Block | null = null;
  protected cachedGradient: globalThis.CanvasGradient | null = null;
  protected unsubscribe: Unsubscribe | null = null;

  constructor(map: GameMap, walls: WallGrid, characters: Character[], bonus: Bonus[]) {
    this.map = map;
    this.characters = characters;
    this.walls = walls;
    this.bonus = bonus;
    this.bombs = [];
    this.code = '';

    this.unsubscribe = subscribe(() => {
      this.walls = getState().walls;
      this.characters = getState().characters;
      this.bonus = getState().bonus;
      this.bombs = getState().bombs;
      this.map = getState().map;
    });
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.ground = null;
    this.frameUpLeft = null;
    this.frameUpRight = null;
    this.frameUp = null;
    this.frameBottomLeft = null;
    this.frameBottomRight = null;
    this.frameBottom = null;
    this.frameLeft = null;
    this.frameRight = null;
    this.block = null;
    this.cachedGradient = null;
  }

  protected initRenderObjects(canvasContext: CanvasContext): void {
    if (!this.ground) {
      this.ground = new Ground(canvasContext);
      this.frameUpLeft = new Board('UP_LEFT', canvasContext);
      this.frameUpRight = new Board('UP_RIGHT', canvasContext);
      this.frameUp = new Board('UP', canvasContext);
      this.frameBottomLeft = new Board('BOTTOM_LEFT', canvasContext);
      this.frameBottomRight = new Board('BOTTOM_RIGHT', canvasContext);
      this.frameBottom = new Board('BOTTOM', canvasContext);
      this.frameLeft = new Board('LEFT', canvasContext);
      this.frameRight = new Board('RIGHT', canvasContext);
      this.block = new Block(canvasContext);
    }
  }

  protected setupCanvas(canvasContext: CanvasContext): HTMLCanvasElement | null {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) return null;

    canvas.width = this.map[0] && this.map[0].length * 32;
    canvas.height = this.map.length * 32;

    canvasContext.screenWidth = canvas.width;
    canvasContext.screenHeight = canvas.height;

    // Dark background
    canvasContext.ctx.fillStyle = '#0a0a0a';
    canvasContext.ctx.fillRect(0, 0, canvasContext.screenWidth, canvasContext.screenHeight);

    return canvas;
  }

  protected renderMap(canvasContext: CanvasContext): void {
    this.initRenderObjects(canvasContext);

    for (let x = 0, l = this.map.length; x < l; x++) {
      for (let y = 0, k = this.map[x].length; y < k; y++) {
        switch (this.map[x][y]) {
          case TILE.GROUND:
            this.ground!.render(x, y);
            break;
          case TILE.FRAME_UP_LEFT:
            this.frameUpLeft!.render(x, y);
            break;
          case TILE.FRAME_UP:
            this.frameUp!.render(x, y);
            break;
          case TILE.FRAME_UP_RIGHT:
            this.frameUpRight!.render(x, y);
            break;
          case TILE.FRAME_BOTTOM_LEFT:
            this.frameBottomLeft!.render(x, y);
            break;
          case TILE.FRAME_BOTTOM_RIGHT:
            this.frameBottomRight!.render(x, y);
            break;
          case TILE.FRAME_BOTTOM:
            this.frameBottom!.render(x, y);
            break;
          case TILE.FRAME_LEFT:
            this.frameLeft!.render(x, y);
            break;
          case TILE.FRAME_RIGHT:
            this.frameRight!.render(x, y);
            break;
          case TILE.BLOCK:
            this.block!.render(x, y);
            break;
        }
      }
    }
  }

  protected applyRetroEffects(canvasContext: CanvasContext): void {
    const { ctx, screenWidth, screenHeight } = canvasContext;

    // Scanline effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < screenHeight; y += 3) {
      ctx.fillRect(0, y, screenWidth, 1);
    }

    // Vignette effect (cache gradient to avoid recreation every frame)
    if (!this.cachedGradient) {
      this.cachedGradient = ctx.createRadialGradient(
        screenWidth / 2, screenHeight / 2, screenHeight / 3,
        screenWidth / 2, screenHeight / 2, screenHeight
      );
      this.cachedGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      this.cachedGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    }
    ctx.fillStyle = this.cachedGradient;
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // Subtle color tint (cyan/magenta)
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.03)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    ctx.globalCompositeOperation = 'source-over';
  }

  protected computeVictory(): void {
    const aliveCharacters = this.characters.filter(
      (character) => character.status === CharacterStatus.ALIVE
    );
    if (aliveCharacters.length === 1 && aliveCharacters[0].status !== CharacterStatus.VICTORY) {
      dispatch({
        type: Action.VICTORY,
        payload: {
          character: aliveCharacters[0],
        },
      });
    }
  }

  abstract update(canvasContext: CanvasContext): void;
  abstract render(canvasContext: CanvasContext): void;
}
