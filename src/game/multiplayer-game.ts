import { Action } from '../state/actions';
import { dispatch } from '../state/redux';
import { networkClient } from '../utils/network';
import { Music } from '../utils/music';
import { CharacterStatus } from './character-status';
import { Character } from './character';
import { DIRECTION, type Direction } from './direction';
import { Bomb } from './bomb';
import { Bonus } from './bonus';
import { Wall } from './wall';
import { Flame } from './flame';
import { CARDINAL, type Cardinal } from './cardinal';
import { BaseGame } from './base-game';
import type { BonusType } from './bonus-type';
import type { CanvasContext, GameMap, WallGrid } from '../types';
import type { ServerGameState } from '../../shared/types/game-state';

export class MultiplayerGame extends BaseGame {
  localPlayerColor: number;
  private gameEnded: boolean = false;
  private gameEndedReason: string = '';

  private serverBombs: ServerGameState['bombs'] = [];
  private serverWalls: ServerGameState['walls'] = [];
  private serverBonus: ServerGameState['bonus'] = [];
  private serverBlasts: ServerGameState['blasts'] = [];

  // Persistent instances for animations
  private bombInstances: Map<string, Bomb> = new Map();
  private bonusInstances: Map<string, Bonus> = new Map();

  // Sound tracking
  private previousBombIds: Set<string> = new Set();
  private previousBonusCount: number = 0;
  private previousAliveStates: Map<number, boolean> = new Map();

  constructor(map: GameMap, walls: WallGrid, characters: Character[], bonus: Bonus[], localPlayerColor: number) {
    super(map, walls, characters, bonus);
    this.code = 'MULTIPLAYER_GAME';
    this.localPlayerColor = localPlayerColor;

    this.setupNetworkHandlers();
  }

  destroy(): void {
    super.destroy();
    this.bombInstances.clear();
    this.bonusInstances.clear();
  }

  private setupNetworkHandlers(): void {
    networkClient.on('game-state', (data: unknown) => {
      const serverState = data as ServerGameState;
      this.applyServerState(serverState);
    });

    networkClient.on('game-over', (data: unknown) => {
      const gameOver = data as { winner: { color: number } | null };
      this.gameEnded = true;

      if (gameOver.winner) {
        const winner = this.characters.find(c => c.color === gameOver.winner!.color);
        if (winner) {
          Music.win().then((song) => song.play());
          dispatch({
            type: Action.VICTORY,
            payload: { character: winner },
          });
        }
      }
    });

    networkClient.on('game-ended', (data: unknown) => {
      this.gameEnded = true;
      const endData = data as { reason: string };
      this.gameEndedReason = endData.reason || 'Game ended';
      // Return to lobby after a short delay to show message
      setTimeout(() => {
        // Reset canvas size to default before returning to lobby
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        canvas.width = 960;
        canvas.height = 640;

        dispatch({
          type: 'SET_SCREEN',
          payload: { screen: 'LOBBY' },
        });
      }, 3000);
    });

    networkClient.on('server-shutdown', () => {
      this.gameEnded = true;
      // Reset canvas size to default before returning to title
      const canvas = document.getElementById('canvas') as HTMLCanvasElement;
      canvas.width = 960;
      canvas.height = 640;

      dispatch({
        type: 'SET_SCREEN',
        payload: { screen: 'TITLE' },
      });
    });
  }

  private applyServerState(serverState: ServerGameState): void {
    serverState.players.forEach(serverPlayer => {
      let character = this.characters.find(c => c.color === serverPlayer.color);

      if (!character) {
        character = new Character(
          serverPlayer.color as 0 | 1 | 2 | 3,
          serverPlayer.x,
          serverPlayer.y,
          DIRECTION.DOWN
        );
        this.characters.push(character);
      }

      // Trigger walk animation if position changed
      const positionChanged = character.x !== serverPlayer.x || character.y !== serverPlayer.y;
      if (positionChanged) {
        // If an animation is in progress, complete it immediately before starting new one
        if (character.animationState >= 0) {
          character.x = character.nextFrame.x;
          character.y = character.nextFrame.y;
        }
        character.direction = serverPlayer.direction as Direction;
        character.nextFrame = { x: serverPlayer.x, y: serverPlayer.y };
        character.animationState = 0;
      } else if (character.animationState < 0) {
        // No position change and no animation - update direction if needed
        character.direction = serverPlayer.direction as Direction;
      }

      character.bombMax = serverPlayer.bombMax;
      character.bombUsed = serverPlayer.bombUsed;
      character.radius = serverPlayer.radius;
      character.hasKick = serverPlayer.hasKick;
      character.hasPunch = serverPlayer.hasPunch;
      character.hasRemote = serverPlayer.hasRemote;

      if (!serverPlayer.alive && character.status === CharacterStatus.ALIVE) {
        character.status = CharacterStatus.DEAD;
      }
    });

    // Sound effects based on state changes
    const currentBombIds = new Set(serverState.bombs.map(b => b.id));

    // New bombs - play drop sound
    for (const id of currentBombIds) {
      if (!this.previousBombIds.has(id)) {
        Music.bombDrop().then((song) => song.play());
        break; // Only play once per frame
      }
    }

    // Exploded bombs - play explosion sound
    for (const id of this.previousBombIds) {
      if (!currentBombIds.has(id)) {
        Music.explosion().then((song) => song.play());
        break; // Only play once per frame
      }
    }
    this.previousBombIds = currentBombIds;

    // Bonus picked up - play bonus sound
    if (serverState.bonus.length < this.previousBonusCount) {
      Music.bonus().then((song) => song.play());
    }
    this.previousBonusCount = serverState.bonus.length;

    // Player deaths - play death sound
    serverState.players.forEach(serverPlayer => {
      const wasAlive = this.previousAliveStates.get(serverPlayer.color);
      if (wasAlive === true && !serverPlayer.alive) {
        Music.death().then((song) => song.play());
      }
      this.previousAliveStates.set(serverPlayer.color, serverPlayer.alive);
    });

    this.serverBombs = serverState.bombs;
    this.serverWalls = serverState.walls;
    this.serverBonus = serverState.bonus;
    this.serverBlasts = serverState.blasts;
  }

  sendMove(direction: Direction): void {
    networkClient.sendAction({ type: 'MOVE', direction });
  }

  sendDropBomb(): void {
    networkClient.sendAction({ type: 'DROP_BOMB' });
  }

  update(canvasContext: CanvasContext): void {
    this.render(canvasContext);
  }

  render(canvasContext: CanvasContext): void {
    if (!this.setupCanvas(canvasContext)) return;

    // Render map tiles
    this.renderMap(canvasContext);

    // Render bonus with persistent instances for animation
    const currentBonusKeys = new Set<string>();
    this.serverBonus.forEach((b) => {
      const key = `${b.x},${b.y}`;
      currentBonusKeys.add(key);

      let bonus = this.bonusInstances.get(key);
      if (!bonus) {
        // Use server bonus type directly - types match between server and client
        bonus = new Bonus(b.x, b.y, b.type as BonusType);
        this.bonusInstances.set(key, bonus);
      }
      bonus.render(canvasContext);
    });
    // Clean up removed bonuses
    for (const key of this.bonusInstances.keys()) {
      if (!currentBonusKeys.has(key)) {
        this.bonusInstances.delete(key);
      }
    }

    this.serverWalls.forEach((w) => {
      if (!w.destroyed) {
        const wall = new Wall(w.x, w.y);
        wall.render(canvasContext);
      }
    });

    // Render bombs with persistent instances for animation
    const currentBombKeys = new Set<string>();
    this.serverBombs.forEach((b) => {
      const key = b.id;
      currentBombKeys.add(key);

      let bomb = this.bombInstances.get(key);
      if (!bomb) {
        const character = this.characters.find(c => c.color === b.playerColor);
        if (character) {
          bomb = new Bomb(character);
          bomb.x = b.x;
          bomb.y = b.y;
          // Prevent bomb from triggering explosion dispatch - server handles it
          bomb.accelerator = 999999;
          this.bombInstances.set(key, bomb);
        }
      }
      if (bomb) {
        // Sync animation speed based on server timer (180 -> 0)
        // Solo bomb takes ~128 frames, server uses 180
        const timeRemaining = b.timer;
        if (timeRemaining < 45) {
          bomb.animationDuration = 2; // Very fast pulsing
        } else if (timeRemaining < 90) {
          bomb.animationDuration = 4;
        } else if (timeRemaining < 135) {
          bomb.animationDuration = 8;
        } else {
          bomb.animationDuration = 16; // Normal speed
        }
        bomb.render(canvasContext);
      }
    });
    // Clean up exploded bombs
    for (const key of this.bombInstances.keys()) {
      if (!currentBombKeys.has(key)) {
        this.bombInstances.delete(key);
      }
    }

    this.renderBlasts(canvasContext);

    this.characters.forEach((character) => {
      character.render(canvasContext);
    });

    this.applyRetroEffects(canvasContext);
    this.renderMultiplayerOverlay(canvasContext);

    if (this.gameEnded && this.gameEndedReason) {
      this.renderGameEndedMessage(canvasContext);
    } else if (!this.gameEnded) {
      this.computeVictory();
    }
  }

  private renderGameEndedMessage(canvasContext: CanvasContext): void {
    const { ctx, screenWidth, screenHeight } = canvasContext;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // Message
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff0066';
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 20;
    ctx.fillText(this.gameEndedReason, screenWidth / 2, screenHeight / 2);
    ctx.shadowBlur = 0;

    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#00ffff';
    ctx.fillText('Returning to lobby...', screenWidth / 2, screenHeight / 2 + 40);
  }

  private renderMultiplayerOverlay(canvasContext: CanvasContext): void {
    const { ctx, screenWidth } = canvasContext;

    ctx.font = '6px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ff00';
    ctx.fillText('MULTIPLAYER', screenWidth / 2, 12);
  }

  private renderBlasts(canvasContext: CanvasContext): void {
    // Group blasts to determine their cardinal direction
    const blastSet = new Set(this.serverBlasts.map(b => `${b.x},${b.y}`));

    this.serverBlasts.forEach((blast) => {
      const hasNorth = blastSet.has(`${blast.x},${blast.y - 1}`);
      const hasSouth = blastSet.has(`${blast.x},${blast.y + 1}`);
      const hasEast = blastSet.has(`${blast.x + 1},${blast.y}`);
      const hasWest = blastSet.has(`${blast.x - 1},${blast.y}`);

      let cardinal: Cardinal = CARDINAL.MIDDLE;

      // Count neighbors to detect center
      const neighborCount = (hasNorth ? 1 : 0) + (hasSouth ? 1 : 0) + (hasEast ? 1 : 0) + (hasWest ? 1 : 0);

      // Center of explosion: has neighbors in at least 3 directions, or has both vertical and horizontal
      if (neighborCount >= 3 || (hasNorth && hasSouth && (hasEast || hasWest)) || (hasEast && hasWest && (hasNorth || hasSouth))) {
        cardinal = CARDINAL.MIDDLE; // Center with cross pattern
      } else if (hasNorth && hasSouth && !hasEast && !hasWest) {
        cardinal = CARDINAL.NORTH_MIDDLE; // Vertical middle
      } else if (hasEast && hasWest && !hasNorth && !hasSouth) {
        cardinal = CARDINAL.EAST_MIDDLE; // Horizontal middle
      } else if (hasNorth && !hasSouth && !hasEast && !hasWest) {
        cardinal = CARDINAL.SOUTH_END;
      } else if (hasSouth && !hasNorth && !hasEast && !hasWest) {
        cardinal = CARDINAL.NORTH_END;
      } else if (hasEast && !hasWest && !hasNorth && !hasSouth) {
        cardinal = CARDINAL.WEST_END;
      } else if (hasWest && !hasEast && !hasNorth && !hasSouth) {
        cardinal = CARDINAL.EAST_END;
      }

      const flame = new Flame(blast.x, blast.y, 0, cardinal);
      flame.render(canvasContext);
    });
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
      this.gameEnded = true;
    }
  }
}

let currentMultiplayerGame: MultiplayerGame | null = null;

export function setCurrentMultiplayerGame(game: MultiplayerGame | null): void {
  currentMultiplayerGame = game;
}

export function getCurrentMultiplayerGame(): MultiplayerGame | null {
  return currentMultiplayerGame;
}
