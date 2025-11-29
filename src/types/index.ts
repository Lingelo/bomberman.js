export interface CanvasContext {
  screenWidth: number;
  screenHeight: number;
  ctx: CanvasRenderingContext2D;
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface PropagationState {
  north: boolean;
  east: boolean;
  south: boolean;
  west: boolean;
}

export type GameMap = number[][];

export type WallGrid = (import('../game/wall').Wall | null)[][];

export type KeymapType = 'ZQSD' | 'WASD' | 'ARROWS';

export interface GameState {
  gameStatus: string;
  selectedOption: number;
  currentScreenCode: string;
  map: GameMap;
  characters: import('../game/character').Character[];
  bonus: import('../game/bonus').Bonus[];
  bombs: import('../game/bomb').Bomb[];
  walls: WallGrid;
  blasts: import('../game/blast').Blast[];
  selectedArena: number;
  volume: number;
  keymap: KeymapType;
  musicEnabled: boolean;
}

export interface GameAction {
  type: string;
  payload?: Record<string, unknown>;
}

export type Listener = () => void;

export type Unsubscribe = () => void;
