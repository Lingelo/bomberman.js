import { Injectable, Logger } from '@nestjs/common';
import { Room, RoomInfo, RoomPlayer } from './room';
import { GameStateSnapshot, ServerPlayer } from './game-state';

@Injectable()
export class RoomManager {
  private readonly logger = new Logger(RoomManager.name);
  private rooms = new Map<string, Room>();
  private playerRooms = new Map<string, string>();
  private roomIdCounter = 0;

  private onStateUpdate: ((roomId: string, state: GameStateSnapshot) => void) | null = null;
  private onGameOver: ((roomId: string, winner: ServerPlayer | null) => void) | null = null;

  constructor() {
    this.createRoom('Room 1');
    this.createRoom('Room 2');
    this.createRoom('Room 3');
  }

  setCallbacks(
    onStateUpdate: (roomId: string, state: GameStateSnapshot) => void,
    onGameOver: (roomId: string, winner: ServerPlayer | null) => void
  ): void {
    this.onStateUpdate = onStateUpdate;
    this.onGameOver = onGameOver;

    this.rooms.forEach(room => {
      room.setCallbacks(onStateUpdate, onGameOver);
    });
  }

  createRoom(name: string): Room {
    const id = `room_${this.roomIdCounter++}`;
    const room = new Room(id, name);

    if (this.onStateUpdate && this.onGameOver) {
      room.setCallbacks(this.onStateUpdate, this.onGameOver);
    }

    this.rooms.set(id, room);
    this.logger.log(`Room created: ${name} (${id})`);

    return room;
  }

  getRoomList(): RoomInfo[] {
    return Array.from(this.rooms.values()).map(room => room.getInfo());
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId: string, playerId: string, playerName: string): RoomPlayer | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      this.logger.warn(`Room not found: ${roomId}`);
      return null;
    }

    const existingRoomId = this.playerRooms.get(playerId);
    if (existingRoomId) {
      this.leaveRoom(playerId);
    }

    const player = room.addPlayer(playerId, playerName);
    if (player) {
      this.playerRooms.set(playerId, roomId);
    }

    return player;
  }

  leaveRoom(playerId: string): { roomId: string; shouldEndGame: boolean } | null {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) {
      return null;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      this.playerRooms.delete(playerId);
      return null;
    }

    const shouldEndGame = room.removePlayer(playerId);
    this.playerRooms.delete(playerId);

    return { roomId, shouldEndGame };
  }

  getPlayerRoom(playerId: string): Room | null {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }

  getPlayerRoomId(playerId: string): string | null {
    return this.playerRooms.get(playerId) || null;
  }

  startGame(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    return room.startGame();
  }

  endGame(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.endGame();
    }
  }

  startMove(playerId: string, direction: number): void {
    const room = this.getPlayerRoom(playerId);
    if (room) {
      room.startMove(playerId, direction);
    }
  }

  stopMove(playerId: string): void {
    const room = this.getPlayerRoom(playerId);
    if (room) {
      room.stopMove(playerId);
    }
  }

  dropBomb(playerId: string): void {
    const room = this.getPlayerRoom(playerId);
    if (room) {
      room.dropBomb(playerId);
    }
  }

  getRoomPlayers(roomId: string): RoomPlayer[] {
    const room = this.rooms.get(roomId);
    return room ? room.getPlayers() : [];
  }
}
