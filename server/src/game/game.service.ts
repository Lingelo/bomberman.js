import { Injectable, Logger } from '@nestjs/common';
import {
  LobbyStatus,
  Player,
  PlayerColor,
  LobbyState,
  SPAWN_POSITIONS,
} from './game.types';
import { ServerGameState, GameStateSnapshot, ServerPlayer } from './game-state';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private players = new Map<string, Player>();
  private lobbyStatus: LobbyStatus = LobbyStatus.WAITING;
  private readonly maxPlayers = 4;
  private availableColors: PlayerColor[] = [
    PlayerColor.WHITE,
    PlayerColor.BLACK,
    PlayerColor.RED,
    PlayerColor.BLUE,
  ];
  private gameState: ServerGameState = new ServerGameState();
  private onStateUpdate: ((state: GameStateSnapshot) => void) | null = null;
  private onGameOver: ((winner: ServerPlayer | null) => void) | null = null;

  setGameCallbacks(
    onStateUpdate: (state: GameStateSnapshot) => void,
    onGameOver: (winner: ServerPlayer | null) => void
  ): void {
    this.onStateUpdate = onStateUpdate;
    this.onGameOver = onGameOver;
    this.gameState.setCallbacks(onStateUpdate, onGameOver);
  }

  getLobbyState(): LobbyState {
    return {
      status: this.lobbyStatus,
      players: Array.from(this.players.values()),
      maxPlayers: this.maxPlayers,
    };
  }

  isGameInProgress(): boolean {
    return this.lobbyStatus === LobbyStatus.IN_PROGRESS;
  }

  canJoinLobby(): boolean {
    return (
      this.lobbyStatus === LobbyStatus.WAITING &&
      this.players.size < this.maxPlayers
    );
  }

  addPlayer(socketId: string, name: string): Player | null {
    if (!this.canJoinLobby()) {
      this.logger.warn(
        `Player ${name} cannot join - lobby full or game in progress`,
        { socketId, lobbyStatus: this.lobbyStatus, playerCount: this.players.size }
      );
      return null;
    }

    const color = this.availableColors.shift();
    if (color === undefined) {
      this.logger.error('No available colors for new player', { socketId, name });
      return null;
    }

    const spawn = SPAWN_POSITIONS[color];
    const player: Player = {
      id: socketId,
      name,
      color,
      ready: false,
      x: spawn.x,
      y: spawn.y,
      alive: true,
    };

    this.players.set(socketId, player);
    this.logger.log(`Player joined lobby`, {
      name,
      socketId,
      color: PlayerColor[color],
      playerCount: this.players.size,
    });

    return player;
  }

  removePlayer(socketId: string): { removed: boolean; shouldEndGame: boolean } {
    const player = this.players.get(socketId);
    if (!player) {
      return { removed: false, shouldEndGame: false };
    }

    this.availableColors.push(player.color);
    this.availableColors.sort((a, b) => a - b);
    this.players.delete(socketId);

    this.logger.log(`Player left`, {
      name: player.name,
      socketId,
      color: PlayerColor[player.color],
      remainingPlayers: this.players.size,
    });

    let shouldEndGame = false;
    if (this.lobbyStatus === LobbyStatus.IN_PROGRESS && this.players.size <= 1) {
      this.logger.log('Game ending - only one or no players remaining');
      this.endGame();
      shouldEndGame = true;
    }

    return { removed: true, shouldEndGame };
  }

  startGame(): boolean {
    if (this.players.size < 2) {
      this.logger.warn('Cannot start game - need at least 2 players', {
        playerCount: this.players.size,
      });
      return false;
    }

    if (this.lobbyStatus === LobbyStatus.IN_PROGRESS) {
      this.logger.warn('Game already in progress');
      return false;
    }

    this.lobbyStatus = LobbyStatus.IN_PROGRESS;

    for (const player of this.players.values()) {
      const spawn = SPAWN_POSITIONS[player.color];
      player.x = spawn.x;
      player.y = spawn.y;
      player.alive = true;
    }

    const playerList = Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
    }));

    this.gameState.initGame(playerList);
    this.gameState.startGameLoop();

    this.logger.log('Game started', {
      playerCount: this.players.size,
      players: Array.from(this.players.values()).map(p => ({
        name: p.name,
        color: PlayerColor[p.color],
      })),
    });

    return true;
  }

  movePlayer(playerId: string, direction: number): void {
    this.gameState.movePlayer(playerId, direction);
  }

  dropBomb(playerId: string): void {
    this.gameState.dropBomb(playerId);
  }

  getGameSnapshot(): GameStateSnapshot {
    return this.gameState.getSnapshot();
  }

  endGame(): void {
    this.gameState.stopGameLoop();
    this.lobbyStatus = LobbyStatus.WAITING;

    for (const player of this.players.values()) {
      const spawn = SPAWN_POSITIONS[player.color];
      player.x = spawn.x;
      player.y = spawn.y;
      player.alive = true;
      player.ready = false;
    }

    this.logger.log('Game ended - lobby reset', {
      remainingPlayers: this.players.size,
    });
  }

  updatePlayerPosition(socketId: string, x: number, y: number): void {
    const player = this.players.get(socketId);
    if (player && player.alive) {
      player.x = x;
      player.y = y;
    }
  }

  killPlayer(socketId: string): Player | null {
    const player = this.players.get(socketId);
    if (player) {
      player.alive = false;
      this.logger.log(`Player killed`, {
        name: player.name,
        socketId,
      });

      const alivePlayers = Array.from(this.players.values()).filter(p => p.alive);
      if (alivePlayers.length <= 1) {
        this.logger.log('Game over - winner determined', {
          winner: alivePlayers[0]?.name || 'none',
        });
      }

      return player;
    }
    return null;
  }

  getPlayer(socketId: string): Player | undefined {
    return this.players.get(socketId);
  }

  getAlivePlayers(): Player[] {
    return Array.from(this.players.values()).filter(p => p.alive);
  }

  resetLobby(): void {
    this.players.clear();
    this.lobbyStatus = LobbyStatus.WAITING;
    this.availableColors = [
      PlayerColor.WHITE,
      PlayerColor.BLACK,
      PlayerColor.RED,
      PlayerColor.BLUE,
    ];
    this.logger.log('Lobby completely reset');
  }
}
