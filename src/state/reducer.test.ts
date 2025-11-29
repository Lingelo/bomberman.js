import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GAMESTATUS } from '../game/game-status';
import { COLOR } from '../game/color';
import { BONUSTYPE } from '../game/bonus-type';
import { CharacterStatus } from '../game/character-status';
import { Action } from './actions';
import { reducer } from './reducer';
import type { GameAction, GameState } from '../types';
import type { Bonus } from '../game/bonus';

// Mock the Music module to avoid audio issues in tests
vi.mock('../utils/music', () => ({
  Music: {
    menuBeep: vi.fn(() => Promise.resolve({ play: vi.fn() })),
    menuNext: vi.fn(() => Promise.resolve({ play: vi.fn() })),
    menuPrevious: vi.fn(() => Promise.resolve({ play: vi.fn() })),
    bombDrop: vi.fn(() => Promise.resolve({ play: vi.fn() })),
    explosion: vi.fn(() => Promise.resolve({ play: vi.fn() })),
    death: vi.fn(() => Promise.resolve({ play: vi.fn() })),
    bonus: vi.fn(() => Promise.resolve({ play: vi.fn() })),
    win: vi.fn(() => Promise.resolve({ play: vi.fn() })),
  },
}));

// Mock redux to avoid circular dependency
vi.mock('./redux', () => ({
  getState: vi.fn(),
  dispatch: vi.fn(),
  subscribe: vi.fn(() => vi.fn()),
}));

// Import reducer after mocks are set up

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

function getInitialState(): GameState {
  return reducer({ type: '__INIT__' } as GameAction);
}

describe('reducer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('menu navigation', () => {
    it('should increment selectedOption on DOWN', () => {
      const state = getInitialState();
      const newState = reducer({ type: Action.DOWN }, state);

      expect(newState.selectedOption).toBe(state.selectedOption + 1);
    });

    it('should decrement selectedOption on UP', () => {
      const state = { ...getInitialState(), selectedOption: 2 };
      const newState = reducer({ type: Action.UP }, state);

      expect(newState.selectedOption).toBe(1);
    });

    it('should handle MENU_OVERFLOW', () => {
      const state = getInitialState();
      const newState = reducer(
        { type: Action.MENU_OVERFLOW, payload: { selectedOption: 3 } },
        state
      );

      expect(newState.selectedOption).toBe(3);
    });
  });

  describe('volume control', () => {
    it('should increase volume on VOLUME_UP', () => {
      const state = { ...getInitialState(), volume: 30 };
      const newState = reducer({ type: Action.VOLUME_UP }, state);

      expect(newState.volume).toBe(40);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('bomberman-volume', '40');
    });

    it('should decrease volume on VOLUME_DOWN', () => {
      const state = { ...getInitialState(), volume: 30 };
      const newState = reducer({ type: Action.VOLUME_DOWN }, state);

      expect(newState.volume).toBe(20);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('bomberman-volume', '20');
    });

    it('should not exceed 100 volume', () => {
      const state = { ...getInitialState(), volume: 100 };
      const newState = reducer({ type: Action.VOLUME_UP }, state);

      expect(newState.volume).toBe(100);
    });

    it('should not go below 0 volume', () => {
      const state = { ...getInitialState(), volume: 0 };
      const newState = reducer({ type: Action.VOLUME_DOWN }, state);

      expect(newState.volume).toBe(0);
    });
  });

  describe('keymap control', () => {
    it('should cycle keymap forward', () => {
      const state = { ...getInitialState(), keymap: 'ZQSD' as const };
      const newState = reducer(
        { type: Action.CHANGE_KEYMAP, payload: { direction: 'next' } },
        state
      );

      expect(newState.keymap).toBe('WASD');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('bomberman-keymap', 'WASD');
    });

    it('should cycle keymap backward', () => {
      const state = { ...getInitialState(), keymap: 'ZQSD' as const };
      const newState = reducer(
        { type: Action.CHANGE_KEYMAP, payload: { direction: 'prev' } },
        state
      );

      expect(newState.keymap).toBe('ARROWS');
    });

    it('should wrap around keymap options', () => {
      const state = { ...getInitialState(), keymap: 'ARROWS' as const };
      const newState = reducer(
        { type: Action.CHANGE_KEYMAP, payload: { direction: 'next' } },
        state
      );

      expect(newState.keymap).toBe('ZQSD');
    });
  });

  describe('player management', () => {
    it('should add a player on ADD_PLAYER', () => {
      const state = getInitialState();
      const newState = reducer(
        { type: Action.ADD_PLAYER, payload: { index: COLOR.WHITE } },
        state
      );

      expect(newState.characters.length).toBe(1);
      expect(newState.characters[0].color).toBe(COLOR.WHITE);
    });

    it('should not add duplicate player', () => {
      const state = getInitialState();
      let newState = reducer(
        { type: Action.ADD_PLAYER, payload: { index: COLOR.WHITE } },
        state
      );
      newState = reducer(
        { type: Action.ADD_PLAYER, payload: { index: COLOR.WHITE } },
        newState
      );

      expect(newState.characters.length).toBe(1);
    });

    it('should set gameStatus to READY with 2+ players', () => {
      const state = getInitialState();
      let newState = reducer(
        { type: Action.ADD_PLAYER, payload: { index: COLOR.WHITE } },
        state
      );
      newState = reducer(
        { type: Action.ADD_PLAYER, payload: { index: COLOR.BLACK } },
        newState
      );

      expect(newState.gameStatus).toBe(GAMESTATUS.READY);
      expect(newState.characters.length).toBe(2);
    });

    it('should add a bot on ADD_BOT', () => {
      const state = getInitialState();
      const newState = reducer({ type: Action.ADD_BOT }, state);

      expect(newState.characters.length).toBe(1);
      expect(newState.characters[0].isBot).toBe(true);
    });

    it('should limit bots to 3', () => {
      let state = getInitialState();

      // Add 3 bots
      for (let i = 0; i < 3; i++) {
        state = reducer({ type: Action.ADD_BOT }, state);
      }

      expect(state.characters.length).toBe(3);

      // Try to add a 4th bot
      const newState = reducer({ type: Action.ADD_BOT }, state);
      expect(newState.characters.length).toBe(3);
    });
  });

  describe('bonus collection', () => {
    it('should increase radius with POWER bonus', () => {
      const state = getInitialState();
      let newState = reducer(
        { type: Action.ADD_PLAYER, payload: { index: COLOR.WHITE } },
        state
      );

      const initialRadius = newState.characters[0].radius;

      newState = reducer(
        {
          type: Action.GET_BONUS,
          payload: {
            bonus: { type: BONUSTYPE.POWER, x: 1, y: 1 },
            playerColor: COLOR.WHITE,
          },
        },
        newState
      );

      expect(newState.characters[0].radius).toBe(initialRadius + 1);
    });

    it('should increase bombMax with BOMB bonus', () => {
      const state = getInitialState();
      let newState = reducer(
        { type: Action.ADD_PLAYER, payload: { index: COLOR.WHITE } },
        state
      );

      const initialBombMax = newState.characters[0].bombMax;

      newState = reducer(
        {
          type: Action.GET_BONUS,
          payload: {
            bonus: { type: BONUSTYPE.BOMB, x: 1, y: 1 },
            playerColor: COLOR.WHITE,
          },
        },
        newState
      );

      expect(newState.characters[0].bombMax).toBe(initialBombMax + 1);
    });

    it('should enable hasKick with KICK bonus', () => {
      const state = getInitialState();
      let newState = reducer(
        { type: Action.ADD_PLAYER, payload: { index: COLOR.WHITE } },
        state
      );

      expect(newState.characters[0].hasKick).toBe(false);

      newState = reducer(
        {
          type: Action.GET_BONUS,
          payload: {
            bonus: { type: BONUSTYPE.KICK, x: 1, y: 1 },
            playerColor: COLOR.WHITE,
          },
        },
        newState
      );

      expect(newState.characters[0].hasKick).toBe(true);
    });

    it('should enable hasPunch with PUNCH bonus', () => {
      const state = getInitialState();
      let newState = reducer(
        { type: Action.ADD_PLAYER, payload: { index: COLOR.WHITE } },
        state
      );

      expect(newState.characters[0].hasPunch).toBe(false);

      newState = reducer(
        {
          type: Action.GET_BONUS,
          payload: {
            bonus: { type: BONUSTYPE.PUNCH, x: 1, y: 1 },
            playerColor: COLOR.WHITE,
          },
        },
        newState
      );

      expect(newState.characters[0].hasPunch).toBe(true);
    });

    it('should enable hasRemote with REMOTE bonus', () => {
      const state = getInitialState();
      let newState = reducer(
        { type: Action.ADD_PLAYER, payload: { index: COLOR.WHITE } },
        state
      );

      expect(newState.characters[0].hasRemote).toBe(false);

      newState = reducer(
        {
          type: Action.GET_BONUS,
          payload: {
            bonus: { type: BONUSTYPE.REMOTE, x: 1, y: 1 },
            playerColor: COLOR.WHITE,
          },
        },
        newState
      );

      expect(newState.characters[0].hasRemote).toBe(true);
    });

    it('should remove bonus from state after collection', () => {
      const state = getInitialState();
      let newState = reducer(
        { type: Action.ADD_PLAYER, payload: { index: COLOR.WHITE } },
        state
      );

      // Add a bonus to the state
      newState.bonus = [{ x: 1, y: 1, type: BONUSTYPE.POWER }] as unknown as Bonus[];

      newState = reducer(
        {
          type: Action.GET_BONUS,
          payload: {
            bonus: { type: BONUSTYPE.POWER, x: 1, y: 1 },
            playerColor: COLOR.WHITE,
          },
        },
        newState
      );

      expect(newState.bonus.length).toBe(0);
    });
  });

  describe('game state transitions', () => {
    it('should set gameStatus to IN_PROGRESS on INIT_GAME', () => {
      const state = getInitialState();
      const newState = reducer(
        {
          type: Action.INIT_GAME,
          payload: { walls: [], bonus: [] },
        },
        state
      );

      expect(newState.gameStatus).toBe(GAMESTATUS.IN_PROGRESS);
    });

    it('should set gameStatus to END and player to VICTORY on VICTORY', () => {
      const state = getInitialState();
      let newState = reducer(
        { type: Action.ADD_PLAYER, payload: { index: COLOR.WHITE } },
        state
      );

      newState = reducer(
        {
          type: Action.VICTORY,
          payload: { character: { color: COLOR.WHITE } },
        },
        newState
      );

      expect(newState.gameStatus).toBe(GAMESTATUS.END);
      expect(newState.characters[0].status).toBe(CharacterStatus.VICTORY);
    });

    it('should set character status to DEAD on KILL', () => {
      const state = getInitialState();
      let newState = reducer(
        { type: Action.ADD_PLAYER, payload: { index: COLOR.WHITE } },
        state
      );

      expect(newState.characters[0].status).toBe(CharacterStatus.ALIVE);

      newState = reducer(
        {
          type: Action.KILL,
          payload: { character: { color: COLOR.WHITE } },
        },
        newState
      );

      expect(newState.characters[0].status).toBe(CharacterStatus.DEAD);
    });
  });

  describe('screen navigation', () => {
    it('should change screen with SET_SCREEN', () => {
      const state = getInitialState();
      const newState = reducer(
        {
          type: 'SET_SCREEN',
          payload: { screen: 'LOBBY' },
        },
        state
      );

      expect(newState.currentScreenCode).toBe('LOBBY');
      expect(newState.selectedOption).toBe(1);
    });
  });

  describe('default case', () => {
    it('should return state unchanged for unknown action', () => {
      const state = getInitialState();
      const newState = reducer({ type: 'UNKNOWN_ACTION' } as GameAction, state);

      expect(newState).toBe(state);
    });
  });
});
