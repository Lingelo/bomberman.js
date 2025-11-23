export const GAMESTATUS = {
  INITIALISATION: 'INITIALISATION',
  READY: 'READY',
  IN_PROGRESS: 'IN_PROGRESS',
  END: 'END',
} as const;

export type GameStatus = typeof GAMESTATUS[keyof typeof GAMESTATUS];
