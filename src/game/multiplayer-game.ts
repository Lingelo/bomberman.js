import { Action } from '../state/actions';
import { dispatch, getState, subscribe } from '../state/redux';
import { Ground } from './ground';
import { Board } from './board';
import { Block } from './block';
import { CharacterStatus } from './character-status';
import { Character } from './character';
import { DIRECTION, type Direction } from './direction';
import { Bomb } from './bomb';
import { Bonus } from './bonus';
import { Wall } from './wall';
import { networkClient } from '../utils/network';
import { BONUSTYPE } from './bonus-type';
import { Music } from '../utils/music';
import type { CanvasContext, GameMap, WallGrid } from '../types';
import { Flame } from './flame';
import { CARDINAL, type Cardinal } from './cardinal';

interface ServerGameState {
  players: Array<{
    id: string;
    name: string;
    color: number;
    x: number;
    y: number;
    alive: boolean;
    direction: number;
    bombMax: number;
    bombUsed: number;
    radius: number;
  }>;
  bombs: Array<{
    id: string;
    x: number;
    y: number;
    playerColor: number;
    radius: number;
    timer: number;
  }>;
  walls: Array<{
    x: number;
    y: number;
    destroyed: boolean;
  }>;
  bonus: Array<{
    x: number;
    y: number;
    type: number;
  }>;
  blasts: Array<{
    x: number;
    y: number;
  }>;
}

export class MultiplayerGame {
  map: GameMap;
  characters: Character[];
  walls: WallGrid;
  bonus: Bonus[];
  bombs: Bomb[];
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
    this.map = map;
    this.characters = characters;
    this.walls = walls;
    this.bonus = bonus;
    this.bombs = [];
    this.code = 'MULTIPLAYER_GAME';
    this.localPlayerColor = localPlayerColor;

    subscribe(() => {
      this.walls = getState().walls;
      this.characters = getState().characters;
      this.bonus = getState().bonus;
      this.bombs = getState().bombs;
      this.map = getState().map;
    });

    this.setupNetworkHandlers();
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
      console.log('Game ended:', this.gameEndedReason);
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
      if (positionChanged && character.animationState < 0) {
        character.direction = serverPlayer.direction as Direction;
        character.nextFrame = { x: serverPlayer.x, y: serverPlayer.y };
        character.animationState = 0;
      } else if (!positionChanged || character.animationState < 0) {
        // Update position directly if no animation or animation finished
        character.x = serverPlayer.x;
        character.y = serverPlayer.y;
        character.direction = serverPlayer.direction as Direction;
      }

      character.bombMax = serverPlayer.bombMax;
      character.bombUsed = serverPlayer.bombUsed;
      character.radius = serverPlayer.radius;

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
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = this.map[0] && this.map[0].length * 32;
    canvas.height = this.map.length * 32;

    canvasContext.screenWidth = canvas.width;
    canvasContext.screenHeight = canvas.height;

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

    // Render bonus with persistent instances for animation
    const currentBonusKeys = new Set<string>();
    this.serverBonus.forEach((b) => {
      const key = `${b.x},${b.y}`;
      currentBonusKeys.add(key);

      let bonus = this.bonusInstances.get(key);
      if (!bonus) {
        const bonusType = b.type === 0 ? BONUSTYPE.POWER : b.type === 1 ? BONUSTYPE.BOMB : BONUSTYPE.SPEED;
        bonus = new Bonus(b.x, b.y, bonusType);
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

  applyRetroEffects(canvasContext: CanvasContext): void {
    const { ctx, screenWidth, screenHeight } = canvasContext;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < screenHeight; y += 3) {
      ctx.fillRect(0, y, screenWidth, 1);
    }

    const gradient = ctx.createRadialGradient(
      screenWidth / 2, screenHeight / 2, screenHeight / 3,
      screenWidth / 2, screenHeight / 2, screenHeight
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.03)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    ctx.globalCompositeOperation = 'source-over';
  }

  renderMultiplayerOverlay(canvasContext: CanvasContext): void {
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

      // Determine cardinal based on neighbors
      if (hasNorth && hasSouth && !hasEast && !hasWest) {
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
