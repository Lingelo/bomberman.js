export const BONUS_TYPE = {
  BOMB: 0,
  POWER: 1,
  KICK: 2,
  SKULL: 3,
  SPEED: 4,
  PUNCH: 5,
  POWER_PUNCH: 6,
  REMOTE: 7,
} as const;

export type BonusType = (typeof BONUS_TYPE)[keyof typeof BONUS_TYPE];
