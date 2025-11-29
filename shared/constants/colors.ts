export enum PlayerColor {
  WHITE = 0,
  BLACK = 1,
  RED = 2,
  BLUE = 3,
}

export const SPAWN_POSITIONS: Record<PlayerColor, { x: number; y: number }> = {
  [PlayerColor.WHITE]: { x: 1, y: 1 },
  [PlayerColor.BLACK]: { x: 1, y: 11 },
  [PlayerColor.BLUE]: { x: 13, y: 1 },
  [PlayerColor.RED]: { x: 13, y: 11 },
};
