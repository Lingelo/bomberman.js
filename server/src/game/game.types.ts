// Re-export shared types for backwards compatibility
export {
  PlayerColor,
  SPAWN_POSITIONS,
} from '../../../shared/constants/colors';

export {
  LobbyStatus,
  LobbyState,
  LobbyPlayer,
  GameStateUpdate,
} from '../../../shared/types/game-state';

export type { PlayerAction } from '../../../shared/types/actions';

// Alias for backwards compatibility
export type Player = import('../../../shared/types/game-state').LobbyPlayer;
