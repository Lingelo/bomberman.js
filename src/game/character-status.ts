export const CharacterStatus = {
  ALIVE: 'ALIVE',
  VICTORY: 'VICTORY',
  DEAD: 'DEAD',
} as const;

export type CharacterStatusType = typeof CharacterStatus[keyof typeof CharacterStatus];
