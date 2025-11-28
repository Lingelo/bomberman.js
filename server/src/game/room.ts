import { Logger } from '@nestjs/common';
import { PlayerColor, SPAWN_POSITIONS } from './game.types';
import { ServerGameState, GameStateSnapshot, ServerPlayer } from './game-state';

export interface RoomPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  ready: boolean;
}

export interface RoomInfo {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: 'WAITING' | 'IN_PROGRESS';
}

export class Room {
  private readonly logger = new Logger(Room.name);
  readonly id: string;
  readonly name: string;
  private players = new Map<string, RoomPlayer>();
  private availableColors: PlayerColor[] = [
    PlayerColor.WHITE,
    PlayerColor.BLACK,
    PlayerColor.RED,
    PlayerColor.BLUE,
  ];
  private status: 'WAITING' | 'IN_PROGRESS' = 'WAITING';
  private gameState: ServerGameState = new ServerGameState();
  private onStateUpdate: ((roomId: string, state: GameStateSnapshot) => void) | null = null;
  private onGameOver: ((roomId: string, winner: ServerPlayer | null) => void) | null = null;
  readonly maxPlayers = 4;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  setCallbacks(
    onStateUpdate: (roomId: string, state: GameStateSnapshot) => void,
    onGameOver: (roomId: string, winner: ServerPlayer | null) => void
  ): void {
    this.onStateUpdate = onStateUpdate;
    this.onGameOver = onGameOver;
    this.gameState.setCallbacks(
      (state) => {
        if (this.onStateUpdate) {
          this.onStateUpdate(this.id, state);
        }
      },
      (winner) => {
        if (this.onGameOver) {
          this.onGameOver(this.id, winner);
        }
      }
    );
  }

  getInfo(): RoomInfo {
    return {
      id: this.id,
      name: this.name,
      playerCount: this.players.size,
      maxPlayers: this.maxPlayers,
      status: this.status,
    };
  }

  getStatus(): 'WAITING' | 'IN_PROGRESS' {
    return this.status;
  }

  getPlayers(): RoomPlayer[] {
    return Array.from(this.players.values());
  }

  canJoin(): boolean {
    return this.status === 'WAITING' && this.players.size < this.maxPlayers;
  }

  addPlayer(socketId: string, name: string): RoomPlayer | null {
    if (!this.canJoin()) {
      return null;
    }

    const color = this.availableColors.shift();
    if (color === undefined) {
      return null;
    }

    const player: RoomPlayer = {
      id: socketId,
      name,
      color,
      ready: false,
    };

    this.players.set(socketId, player);
    this.logger.log(`Player joined room ${this.name}`, {
      name,
      socketId,
      color: PlayerColor[color],
      playerCount: this.players.size,
    });

    return player;
  }

  removePlayer(socketId: string): boolean {
    const player = this.players.get(socketId);
    if (!player) {
      return false;
    }

    this.availableColors.push(player.color);
    this.availableColors.sort((a, b) => a - b);
    this.players.delete(socketId);

    this.logger.log(`Player left room ${this.name}`, {
      name: player.name,
      socketId,
      remainingPlayers: this.players.size,
    });

    if (this.status === 'IN_PROGRESS') {
      this.gameState.removePlayer(socketId);

      if (this.players.size <= 1) {
        this.endGame();
        return true;
      }
    }

    return false;
  }

  hasPlayer(socketId: string): boolean {
    return this.players.has(socketId);
  }

  getPlayer(socketId: string): RoomPlayer | undefined {
    return this.players.get(socketId);
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  startGame(): boolean {
    if (this.players.size < 2 || this.status === 'IN_PROGRESS') {
      return false;
    }

    this.status = 'IN_PROGRESS';

    const playerList = Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
    }));

    this.gameState.initGame(playerList);
    this.gameState.startGameLoop();

    this.logger.log(`Game started in room ${this.name}`, {
      playerCount: this.players.size,
    });

    return true;
  }

  endGame(): void {
    this.gameState.stopGameLoop();
    this.status = 'WAITING';

    this.logger.log(`Game ended in room ${this.name}`);
  }

  startMove(playerId: string, direction: number): void {
    if (this.status === 'IN_PROGRESS') {
      this.gameState.startMove(playerId, direction);
    }
  }

  stopMove(playerId: string): void {
    if (this.status === 'IN_PROGRESS') {
      this.gameState.stopMove(playerId);
    }
  }

  dropBomb(playerId: string): void {
    if (this.status === 'IN_PROGRESS') {
      this.gameState.dropBomb(playerId);
    }
  }

  detonate(playerId: string): void {
    if (this.status === 'IN_PROGRESS') {
      this.gameState.detonate(playerId);
    }
  }

  getGameSnapshot(): GameStateSnapshot {
    return this.gameState.getSnapshot();
  }
}
