export const BONUSTYPE = {
  BOMB: 0,
  POWER: 1,
  SPEED: 3,
  SHIELD: 4,
  KICK: 5,
} as const;

export type BonusType = typeof BONUSTYPE[keyof typeof BONUSTYPE];
