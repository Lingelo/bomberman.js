export const BONUSTYPE = {
  BOMB: 0,        // frames 0-1 - Bombe noire
  POWER: 1,       // frames 2-3 - Flamme orange (portée)
  KICK: 2,        // frames 4-5 - Coup de pied
  SKULL: 3,       // frames 6-7 - Tête de mort (malus)
  SPEED: 4,       // frames 8-9 - Patins (vitesse)
  PUNCH: 5,       // frames 10-11 - Poing bleu
  POWER_PUNCH: 6, // frames 12-13 - Poing rouge
  REMOTE: 7,      // frames 14-15 - Détonateur
} as const;

export type BonusType = typeof BONUSTYPE[keyof typeof BONUSTYPE];
