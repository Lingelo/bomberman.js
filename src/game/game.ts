import { Action } from '../state/actions';
import { dispatch, getState, subscribe } from '../state/redux';
import { Ground } from './ground';
import { Board } from './board';
import { Block } from './block';
import { CharacterStatus } from './character-status';
import { BotAI } from './bot-ai';
import type { CanvasContext, GameMap, WallGrid } from '../types';
import type { Character } from './character';
import type { Bonus } from './bonus';
import type { Bomb } from './bomb';
import type { Blast } from './blast';

export class Game {
  map: GameMap;
  characters: Character[];
  walls: WallGrid;
  bonus: Bonus[];
  bombs: Bomb[];
  blasts: Blast[];
  code: string;
  ground!: Ground;
  frameUpLeft!: Board;
  frameUpRight!: Board;
  frameUp!: Board;
  frameBottomLeft!: Board;
  frameBottomRight!: Board;
  frameBottom!: Board;
  frameLeft!: Board;
  frameRight!: Board;
  block!: Block;
  botAIs: Map<number, BotAI>;

  constructor(map: GameMap, walls: WallGrid, characters: Character[], bonus: Bonus[]) {
    this.map = map;
    this.characters = characters;
    this.walls = walls;
    this.bonus = bonus;
    this.bombs = [];
    this.blasts = [];
    this.code = 'NEW_GAME';
    this.botAIs = new Map();

    characters.forEach((character) => {
      if (character.isBot) {
        this.botAIs.set(character.color, new BotAI(character));
      }
    });

    subscribe(() => {
      this.walls = getState().walls;
      this.characters = getState().characters;
      this.bonus = getState().bonus;
      this.bombs = getState().bombs;
      this.blasts = getState().blasts;
      this.map = getState().map;
    });
  }

  update(canvasContext: CanvasContext): void {
    this.updateBots();
    this.render(canvasContext);
  }

  updateBots(): void {
    this.botAIs.forEach((botAI) => {
      if (botAI.character.status === CharacterStatus.ALIVE) {
        botAI.update();
      }
    });
  }

  render(canvasContext: CanvasContext): void {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = this.map[0] && this.map[0].length * 32;
    canvas.height = this.map.length * 32;

    canvasContext.screenWidth = canvas.width;
    canvasContext.screenHeight = canvas.height;

    // Dark background
    canvasContext.ctx.fillStyle = '#0a0a0a';
    canvasContext.ctx.fillRect(0, 0, canvasContext.screenWidth, canvasContext.screenHeight);

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

    for (let x = 0, l = this.map.length; x < l; x++) {
      for (let y = 0, k = this.map[x].length; y < k; y++) {
        switch (this.map[x][y]) {
          case 2:
            this.ground.render(x, y);
            break;
          case 12:
            this.frameUpLeft.render(x, y);
            break;
          case 14:
            this.frameUp.render(x, y);
            break;
          case 16:
            this.frameUpRight.render(x, y);
            break;
          case 8:
            this.frameBottomLeft.render(x, y);
            break;
          case 4:
            this.frameBottomRight.render(x, y);
            break;
          case 6:
            this.frameBottom.render(x, y);
            break;
          case 11:
            this.frameLeft.render(x, y);
            break;
          case 9:
            this.frameRight.render(x, y);
            break;
          case 10:
            this.block.render(x, y);
            break;
        }
      }
    }

    this.bonus.forEach((bonus) => {
      bonus.render(canvasContext);
    });

    for (let i = 0, l = this.walls.length; i < l; i++) {
      for (let j = 0, m = this.walls[i].length; j < m; j++) {
        if (this.walls[i][j]) {
          this.walls[i][j]!.render(canvasContext);
        }
      }
    }

    this.bombs.forEach((bomb) => {
      bomb.render(canvasContext);
    });

    this.blasts.forEach((blast) => {
      blast.render(canvasContext);
    });

    this.characters.forEach((character) => {
      character.render(canvasContext);
    });

    // Retro post-processing effects
    this.applyRetroEffects(canvasContext);

    this.computeVictory();
  }

  applyRetroEffects(canvasContext: CanvasContext): void {
    const { ctx, screenWidth, screenHeight } = canvasContext;

    // Scanline effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < screenHeight; y += 3) {
      ctx.fillRect(0, y, screenWidth, 1);
    }

    // Vignette effect
    const gradient = ctx.createRadialGradient(
      screenWidth / 2, screenHeight / 2, screenHeight / 3,
      screenWidth / 2, screenHeight / 2, screenHeight
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // Subtle color tint (cyan/magenta)
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.03)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    ctx.globalCompositeOperation = 'source-over';
  }

  computeVictory(): void {
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
}
