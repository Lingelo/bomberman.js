import { io, Socket } from 'socket.io-client';
import { dispatch } from '../state/redux';
import { Action } from '../state/actions';

export interface NetworkPlayer {
  id: string;
  name: string;
  color: number;
  ready: boolean;
  x: number;
  y: number;
  alive: boolean;
}

export interface LobbyState {
  status: 'WAITING' | 'IN_PROGRESS';
  players: NetworkPlayer[];
  maxPlayers: number;
}

export interface RoomInfo {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: 'WAITING' | 'IN_PROGRESS';
}

export interface PlayerAction {
  type: 'MOVE' | 'DROP_BOMB' | 'STOP';
  direction?: number;
  playerId: string;
}

type NetworkEventCallback = (data: unknown) => void;

class NetworkClient {
  private socket: Socket | null = null;
  private serverUrl: string = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
  private eventCallbacks: Map<string, NetworkEventCallback[]> = new Map();
  private _isConnected: boolean = false;
  private _localPlayerId: string | null = null;
  private _lobbyState: LobbyState | null = null;
  private _roomList: RoomInfo[] = [];
  private _currentRoomId: string | null = null;

  get isConnected(): boolean {
    return this._isConnected;
  }

  get localPlayerId(): string | null {
    return this._localPlayerId;
  }

  get lobbyState(): LobbyState | null {
    return this._lobbyState;
  }

  get roomList(): RoomInfo[] {
    return this._roomList;
  }

  get currentRoomId(): string | null {
    return this._currentRoomId;
  }

  connect(serverUrl?: string): Promise<void> {
    if (serverUrl) {
      this.serverUrl = serverUrl;
    }

    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        this._isConnected = true;
        this._localPlayerId = this.socket!.id || null;
        this.emit('connected', null);
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        this._isConnected = false;
        this._localPlayerId = null;
        this.emit('disconnected', { reason });
      });

      this.socket.on('connect_error', (error) => {
        this._isConnected = false;
        this.emit('connection-error', { error: error.message });
        reject(error);
      });

      this.socket.on('room-list', (rooms: RoomInfo[]) => {
        this._roomList = rooms;
        this.emit('room-list', rooms);
      });

      this.socket.on('room-update', (data: { players: NetworkPlayer[]; status: string }) => {
        this._lobbyState = {
          status: data.status as 'WAITING' | 'IN_PROGRESS',
          players: data.players,
          maxPlayers: 4,
        };
        this.emit('room-update', data);
      });

      this.socket.on('join-success', (data: { player: NetworkPlayer; roomId: string }) => {
        this._currentRoomId = data.roomId;
        this.emit('join-success', data);
      });

      this.socket.on('join-error', (data) => {
        this.emit('join-error', data);
      });

      this.socket.on('leave-success', () => {
        this.emit('leave-success', null);
      });

      this.socket.on('game-started', (data: { players: NetworkPlayer[]; status: string }) => {
        this._lobbyState = {
          status: data.status as 'WAITING' | 'IN_PROGRESS',
          players: data.players,
          maxPlayers: 4,
        };
        this.emit('game-started', data);
      });

      this.socket.on('game-ended', (data) => {
        this.emit('game-ended', data);
      });

      this.socket.on('game-over', (data) => {
        this.emit('game-over', data);
      });

      this.socket.on('player-action', (action: PlayerAction) => {
        this.emit('player-action', action);
      });

      this.socket.on('position-update', (data) => {
        this.emit('position-update', data);
      });

      this.socket.on('player-killed', (data) => {
        this.emit('player-killed', data);
      });

      this.socket.on('game-state', (state) => {
        this.emit('game-state', state);
      });

      this.socket.on('server-shutdown', (data) => {
        this.emit('server-shutdown', data);
        dispatch({ type: Action.ESCAPE });
      });

      this.socket.on('start-error', (data) => {
        this.emit('start-error', data);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._isConnected = false;
      this._localPlayerId = null;
      this._lobbyState = null;
      this._roomList = [];
      this._currentRoomId = null;
    }
  }

  getRoomList(): void {
    if (this.socket) {
      this.socket.emit('get-room-list');
    }
  }

  joinRoom(roomId: string, name: string): void {
    if (this.socket) {
      this.socket.emit('join-room', { roomId, name });
    }
  }

  leaveRoom(): void {
    if (this.socket) {
      this.socket.emit('leave-room');
      this._currentRoomId = null;
    }
  }

  startGame(): void {
    if (this.socket) {
      this.socket.emit('start-game');
    }
  }

  sendAction(action: Omit<PlayerAction, 'playerId'>): void {
    if (this.socket && this._isConnected) {
      this.socket.emit('player-action', action);
    }
  }

  sendPosition(x: number, y: number): void {
    if (this.socket && this._isConnected) {
      this.socket.emit('player-position', { x, y });
    }
  }

  sendPlayerDied(): void {
    if (this.socket && this._isConnected) {
      this.socket.emit('player-died');
    }
  }


  on(event: string, callback: NetworkEventCallback): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  off(event: string, callback: NetworkEventCallback): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: unknown): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }
}

export const networkClient = new NetworkClient();
