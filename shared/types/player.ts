import { PlayerColor } from '../constants/colors';

export interface BasePlayer {
  id: string;
  name: string;
  color: PlayerColor;
  x: number;
  y: number;
  alive: boolean;
}

export interface NetworkPlayer extends BasePlayer {
  ready: boolean;
}

export interface GamePlayer extends BasePlayer {
  direction: number;
  bombMax: number;
  bombUsed: number;
  radius: number;
  speed: number;
  hasKick: boolean;
  hasPunch: boolean;
  hasRemote: boolean;
}
