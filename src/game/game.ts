import { Action } from '../state/actions';
import { dispatch, getState, subscribe } from '../state/redux';
import { CharacterStatus } from './character-status';
import { BotAI } from './bot-ai';
import { BaseGame } from './base-game';
import type { CanvasContext, GameMap, WallGrid } from '../types';
import type { Character } from './character';
import type { Bonus } from './bonus';
import type { Blast } from './blast';

export class Game extends BaseGame {
  blasts: Blast[];
  botAIs: Map<number, BotAI>;

  constructor(map: GameMap, walls: WallGrid, characters: Character[], bonus: Bonus[]) {
    super(map, walls, characters, bonus);
    this.blasts = [];
    this.code = 'NEW_GAME';
    this.botAIs = new Map();

    characters.forEach((character) => {
      if (character.isBot) {
        this.botAIs.set(character.color, new BotAI(character));
      }
    });

    // Override subscribe to also track blasts
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.unsubscribe = subscribe(() => {
      this.walls = getState().walls;
      this.characters = getState().characters;
      this.bonus = getState().bonus;
      this.bombs = getState().bombs;
      this.blasts = getState().blasts;
      this.map = getState().map;
    });
  }

  destroy(): void {
    super.destroy();
    this.botAIs.clear();
  }

  update(canvasContext: CanvasContext): void {
    this.updateBots();
    this.updateDiarrhea();
    this.render(canvasContext);
  }

  updateDiarrhea(): void {
    this.characters.forEach((character) => {
      if (character.status === CharacterStatus.ALIVE && character.shouldAutoDropBomb()) {
        dispatch({
          type: Action.DROP_BOMB,
          payload: { color: character.color },
        });
      }
    });
  }

  updateBots(): void {
    this.botAIs.forEach((botAI) => {
      if (botAI.character.status === CharacterStatus.ALIVE) {
        botAI.update();
      }
    });
  }

  render(canvasContext: CanvasContext): void {
    if (!this.setupCanvas(canvasContext)) return;

    // Render map tiles
    this.renderMap(canvasContext);

    // Render game objects
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
}
