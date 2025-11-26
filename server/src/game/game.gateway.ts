import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomManager } from './room-manager';
import { PlayerAction, SPAWN_POSITIONS } from './game.types';
import { GameStateSnapshot, ServerPlayer } from './game-state';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(private readonly roomManager: RoomManager) {
    this.roomManager.setCallbacks(
      (roomId: string, state: GameStateSnapshot) => this.broadcastGameState(roomId, state),
      (roomId: string, winner: ServerPlayer | null) => this.handleGameOver(roomId, winner)
    );
  }

  afterInit(): void {
    this.logger.log('WebSocket Gateway initialized on port 3000');
  }

  private broadcastGameState(roomId: string, state: GameStateSnapshot): void {
    this.server.to(roomId).emit('game-state', state);
  }

  private handleGameOver(roomId: string, winner: ServerPlayer | null): void {
    this.server.to(roomId).emit('game-over', { winner });
    this.roomManager.endGame(roomId);

    const room = this.roomManager.getRoom(roomId);
    if (room) {
      this.server.to(roomId).emit('room-update', {
        players: room.getPlayers(),
        status: room.getStatus(),
      });
    }

    this.server.emit('room-list', this.roomManager.getRoomList());
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected`, { socketId: client.id });
    client.emit('room-list', this.roomManager.getRoomList());
  }

  handleDisconnect(client: Socket): void {
    const result = this.roomManager.leaveRoom(client.id);

    if (result) {
      this.logger.log(`Client disconnected and removed from room`, {
        socketId: client.id,
        roomId: result.roomId,
      });

      const room = this.roomManager.getRoom(result.roomId);
      if (room) {
        this.server.to(result.roomId).emit('room-update', {
          players: room.getPlayers(),
          status: room.getStatus(),
        });

        if (result.shouldEndGame) {
          this.server.to(result.roomId).emit('game-ended', {
            reason: 'Not enough players remaining',
          });
        }
      }

      this.server.emit('room-list', this.roomManager.getRoomList());
    }
  }

  @SubscribeMessage('get-room-list')
  handleGetRoomList(@ConnectedSocket() client: Socket): void {
    client.emit('room-list', this.roomManager.getRoomList());
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; name: string }
  ): void {
    const room = this.roomManager.getRoom(data.roomId);

    if (!room) {
      client.emit('join-error', { message: 'Room not found' });
      return;
    }

    if (room.getStatus() === 'IN_PROGRESS') {
      client.emit('join-error', {
        message: 'Game is in progress in this room',
      });
      return;
    }

    const player = this.roomManager.joinRoom(data.roomId, client.id, data.name);

    if (player) {
      client.join(data.roomId);
      client.emit('join-success', { player, roomId: data.roomId });

      this.server.to(data.roomId).emit('room-update', {
        players: room.getPlayers(),
        status: room.getStatus(),
      });

      this.server.emit('room-list', this.roomManager.getRoomList());
    } else {
      client.emit('join-error', {
        message: 'Cannot join room - it may be full',
      });
    }
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(@ConnectedSocket() client: Socket): void {
    const roomId = this.roomManager.getPlayerRoomId(client.id);
    const result = this.roomManager.leaveRoom(client.id);

    if (result && roomId) {
      client.leave(roomId);
      client.emit('leave-success');

      const room = this.roomManager.getRoom(roomId);
      if (room) {
        this.server.to(roomId).emit('room-update', {
          players: room.getPlayers(),
          status: room.getStatus(),
        });

        if (result.shouldEndGame) {
          this.server.to(roomId).emit('game-ended', {
            reason: 'Not enough players remaining',
          });
        }
      }

      this.server.emit('room-list', this.roomManager.getRoomList());
    }
  }

  @SubscribeMessage('start-game')
  handleStartGame(@ConnectedSocket() client: Socket): void {
    const room = this.roomManager.getPlayerRoom(client.id);

    if (!room) {
      client.emit('start-error', { message: 'You are not in a room' });
      return;
    }

    const started = room.startGame();

    if (started) {
      const playersWithPositions = room.getPlayers().map(p => ({
        ...p,
        x: SPAWN_POSITIONS[p.color].x,
        y: SPAWN_POSITIONS[p.color].y,
        alive: true,
      }));

      this.server.to(room.id).emit('game-started', {
        players: playersWithPositions,
        status: room.getStatus(),
      });

      this.server.emit('room-list', this.roomManager.getRoomList());

      this.logger.log('Game started', {
        roomId: room.id,
        roomName: room.name,
      });
    } else {
      client.emit('start-error', {
        message: 'Cannot start game - need at least 2 players',
      });
    }
  }

  @SubscribeMessage('player-action')
  handlePlayerAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() action: PlayerAction
  ): void {
    const room = this.roomManager.getPlayerRoom(client.id);
    if (!room || room.getStatus() !== 'IN_PROGRESS') {
      return;
    }

    const player = room.getPlayer(client.id);
    if (!player) return;

    if (action.type === 'MOVE' && action.direction !== undefined) {
      this.roomManager.movePlayer(client.id, action.direction);
    } else if (action.type === 'DROP_BOMB') {
      this.roomManager.dropBomb(client.id);
    }
  }

  broadcastServerShutdown(): void {
    this.logger.log('Broadcasting server shutdown to all clients');
    this.server.emit('server-shutdown', {
      message: 'Server is shutting down',
    });
  }
}
