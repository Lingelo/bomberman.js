export type ActionType = 'MOVE' | 'STOP' | 'DROP_BOMB' | 'DETONATE';

export interface PlayerAction {
  type: ActionType;
  direction?: number;
  playerId?: string;
}
