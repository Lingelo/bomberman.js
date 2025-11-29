import { describe, it, expect } from 'vitest';
import { Pathfinder } from './pathfinder';
import { DIRECTION } from './direction';
import type { GameState } from '../types';
import type { Character } from './character';
import type { Bomb } from './bomb';

// Helper to create a minimal game state for testing
function createMockGameState(
  overrides: Partial<GameState> = {}
): GameState {
  // Default 5x5 grid with all ground tiles (2)
  const defaultMap = [
    [2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2],
  ];

  return {
    map: defaultMap,
    walls: [],
    bombs: [],
    blasts: [],
    bonus: [],
    characters: [],
    screen: 'NEW_GAME',
    ...overrides,
  } as GameState;
}

describe('Pathfinder', () => {
  describe('findPath', () => {
    it('should find a direct horizontal path', () => {
      const state = createMockGameState();
      const path = Pathfinder.findPath(state, 0, 0, 4, 0, false);

      expect(path.length).toBe(4);
      expect(path.every(d => d === DIRECTION.RIGHT)).toBe(true);
    });

    it('should find a direct vertical path', () => {
      const state = createMockGameState();
      const path = Pathfinder.findPath(state, 0, 0, 0, 4, false);

      expect(path.length).toBe(4);
      expect(path.every(d => d === DIRECTION.DOWN)).toBe(true);
    });

    it('should find a diagonal path', () => {
      const state = createMockGameState();
      const path = Pathfinder.findPath(state, 0, 0, 2, 2, false);

      expect(path.length).toBe(4);
      // Path should be a combination of RIGHT and DOWN
      const rightCount = path.filter(d => d === DIRECTION.RIGHT).length;
      const downCount = path.filter(d => d === DIRECTION.DOWN).length;
      expect(rightCount).toBe(2);
      expect(downCount).toBe(2);
    });

    it('should return empty path when start equals target', () => {
      const state = createMockGameState();
      const path = Pathfinder.findPath(state, 2, 2, 2, 2, false);

      expect(path.length).toBe(0);
    });

    it('should avoid walls', () => {
      // Map layout (y is row, x is column):
      // Row 0: [2, 10, 10, 10, 2] - blocks in the middle
      // Row 1-4: all walkable
      const state = createMockGameState({
        map: [
          [2, 10, 10, 10, 2],  // 10 is a block tile
          [2, 2, 2, 2, 2],
          [2, 2, 2, 2, 2],
          [2, 2, 2, 2, 2],
          [2, 2, 2, 2, 2],
        ],
      });
      // From (0,0) to (4,0) - need to go around the blocks at (1,0), (2,0), (3,0)
      const path = Pathfinder.findPath(state, 0, 0, 4, 0, false);

      // Path should go down, across, then up to avoid the wall
      // At minimum: DOWN, RIGHT x 4, UP = 6 steps
      expect(path.length).toBeGreaterThanOrEqual(6);
    });

    it('should avoid bombs', () => {
      const mockCharacter = { radius: 2 } as Character;
      const bomb: Bomb = {
        x: 2,
        y: 0,
        character: mockCharacter,
        timer: 180,
        timeElapsed: 0,
      } as unknown as Bomb;

      const state = createMockGameState({
        bombs: [bomb],
      });

      const path = Pathfinder.findPath(state, 0, 0, 4, 0, false);

      // Path should go around the bomb
      expect(path.some(d => d === DIRECTION.DOWN)).toBe(true);
    });

    it('should return empty path when target is unreachable', () => {
      const state = createMockGameState({
        map: [
          [2, 10, 2],
          [10, 10, 10],
          [2, 10, 2],
        ],
      });
      const path = Pathfinder.findPath(state, 0, 0, 2, 2, false);

      expect(path.length).toBe(0);
    });
  });

  describe('createDangerMap', () => {
    it('should mark bomb position as maximum danger', () => {
      const mockCharacter = { radius: 2 } as Character;
      const bomb: Bomb = {
        x: 2,
        y: 2,
        character: mockCharacter,
        timer: 180,
        timeElapsed: 0,
      } as unknown as Bomb;

      const state = createMockGameState({
        bombs: [bomb],
      });

      const dangerMap = Pathfinder.createDangerMap(state);

      expect(dangerMap[2][2]).toBe(100);
    });

    it('should mark blast radius as dangerous', () => {
      const mockCharacter = { radius: 2 } as Character;
      const bomb: Bomb = {
        x: 2,
        y: 2,
        character: mockCharacter,
        timer: 180,
        timeElapsed: 150, // Close to explosion
      } as unknown as Bomb;

      const state = createMockGameState({
        bombs: [bomb],
      });

      const dangerMap = Pathfinder.createDangerMap(state);

      // Check cross pattern danger
      expect(dangerMap[2][2]).toBe(100); // Center
      expect(dangerMap[2][1]).toBeGreaterThan(0); // Up
      expect(dangerMap[2][3]).toBeGreaterThan(0); // Down
      expect(dangerMap[1][2]).toBeGreaterThan(0); // Left
      expect(dangerMap[3][2]).toBeGreaterThan(0); // Right
    });

    it('should mark active blasts as maximum danger', () => {
      const state = createMockGameState({
        blasts: [{ x: 2, y: 2, radius: 1 }],
      });

      const dangerMap = Pathfinder.createDangerMap(state);

      expect(dangerMap[2][2]).toBe(100);
    });

    it('should return empty danger map with no bombs or blasts', () => {
      const state = createMockGameState();
      const dangerMap = Pathfinder.createDangerMap(state);

      // All positions should be 0
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          expect(dangerMap[x][y]).toBe(0);
        }
      }
    });
  });

  describe('findNearestSafePosition', () => {
    it('should find adjacent safe position', () => {
      const state = createMockGameState();
      const dangerMap = Array(5).fill(null).map(() => Array(5).fill(0));
      dangerMap[2][2] = 100; // Current position is dangerous

      const safe = Pathfinder.findNearestSafePosition(state, 2, 2, dangerMap);

      expect(safe).not.toBeNull();
      expect(safe!.x !== 2 || safe!.y !== 2).toBe(true);
    });

    it('should return null when no safe position exists', () => {
      const state = createMockGameState({
        map: [
          [2, 10, 2],
          [10, 2, 10],
          [2, 10, 2],
        ],
      });
      const dangerMap = Array(3).fill(null).map(() => Array(3).fill(100));

      const safe = Pathfinder.findNearestSafePosition(state, 1, 1, dangerMap);

      expect(safe).toBeNull();
    });

    it('should find nearest safe position when surrounded by danger', () => {
      const state = createMockGameState();
      const dangerMap = Array(5).fill(null).map(() => Array(5).fill(0));

      // Create danger zone around center
      dangerMap[1][2] = 100;
      dangerMap[2][1] = 100;
      dangerMap[2][2] = 100;
      dangerMap[2][3] = 100;
      dangerMap[3][2] = 100;

      const safe = Pathfinder.findNearestSafePosition(state, 2, 2, dangerMap);

      expect(safe).not.toBeNull();
      expect(dangerMap[safe!.x][safe!.y]).toBe(0);
    });
  });
});
