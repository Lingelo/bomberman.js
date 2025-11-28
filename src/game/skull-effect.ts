export const SKULL_EFFECT = {
  NONE: 0,
  SLOW: 1,        // Vitesse réduite de 50%
  FAST: 2,        // Vitesse x2 (difficile à contrôler)
  REVERSE: 3,     // Contrôles inversés
  CONSTIPATION: 4, // Impossible de poser des bombes
  DIARRHEA: 5,    // Pose automatique de bombes en continu
} as const;

export type SkullEffectType = typeof SKULL_EFFECT[keyof typeof SKULL_EFFECT];

export const SKULL_DURATION = 480; // ~8 seconds at 60fps

export function getRandomSkullEffect(): SkullEffectType {
  const effects = [
    SKULL_EFFECT.SLOW,
    SKULL_EFFECT.FAST,
    SKULL_EFFECT.REVERSE,
    SKULL_EFFECT.CONSTIPATION,
    SKULL_EFFECT.DIARRHEA,
  ];
  return effects[Math.floor(Math.random() * effects.length)];
}
