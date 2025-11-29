export const DIRECTION = {
  DOWN: 1,
  LEFT: 7,
  RIGHT: 4,
  TOP: 10,
} as const;

export type Direction = (typeof DIRECTION)[keyof typeof DIRECTION];
