export const COLOR = {
  WHITE: 0,
  BLACK: 1,
  RED: 2,
  BLUE: 3,
  GREEN: 4,
} as const;

export type Color = typeof COLOR[keyof typeof COLOR];
