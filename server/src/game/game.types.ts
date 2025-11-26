export enum LobbyStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
}

export enum PlayerColor {
  WHITE = 0,
  BLACK = 1,
  RED = 2,
  BLUE = 3,
}

export interface Player {
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
  players: Player[];
  maxPlayers: number;
}

export interface PlayerAction {
  type: 'MOVE' | 'DROP_BOMB' | 'STOP';
  direction?: number;
  playerId: string;
}

export interface GameStateUpdate {
  players: Player[];
  bombs?: Array<{ x: number; y: number; playerId: string; timer: number }>;
  blasts?: Array<{ x: number; y: number }>;
}

export const SPAWN_POSITIONS: Record<PlayerColor, { x: number; y: number }> = {
  [PlayerColor.WHITE]: { x: 1, y: 1 },
  [PlayerColor.BLACK]: { x: 1, y: 11 },
  [PlayerColor.BLUE]: { x: 13, y: 1 },
  [PlayerColor.RED]: { x: 13, y: 11 },
};
