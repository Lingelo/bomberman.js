export const CARDINAL = {
  MIDDLE: 27,
  NORTH_MIDDLE: 3,
  EAST_MIDDLE: 7,
  SOUTH_MIDDLE: 3,
  WEST_MIDDLE: 7,
  NORTH_END: 11,
  EAST_END: 23,
  SOUTH_END: 19,
  WEST_END: 15,
} as const;

export type Cardinal = typeof CARDINAL[keyof typeof CARDINAL];
