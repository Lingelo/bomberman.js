import { PlayerColor } from '../constants/colors';

export enum LobbyStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
}

export interface LobbyPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  ready: boolean;
  x: number;
  y: number;
  alive: boolean;
}

export interface LobbyState {
  status: LobbyStatus;
  players: LobbyPlayer[];
  maxPlayers: number;
}

export interface ServerPlayer {
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
  speed: number;
  hasKick: boolean;
  hasPunch: boolean;
  hasRemote: boolean;
}

export interface ServerBomb {
  id: string;
  x: number;
  y: number;
  playerColor: number;
  radius: number;
  timer: number;
}

export interface ServerWall {
  x: number;
  y: number;
  destroyed: boolean;
}

export interface ServerBonus {
  x: number;
  y: number;
  type: number;
}

export interface ServerBlast {
  x: number;
  y: number;
}

export interface ServerGameState {
  players: ServerPlayer[];
  bombs: ServerBomb[];
  walls: ServerWall[];
  bonus: ServerBonus[];
  blasts: ServerBlast[];
}

export interface GameStateUpdate {
  players: LobbyPlayer[];
  bombs?: Array<{ x: number; y: number; playerId: string; timer: number }>;
  blasts?: Array<{ x: number; y: number }>;
}
