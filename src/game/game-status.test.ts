import { describe, it, expect } from 'vitest';
import { GAMESTATUS } from './game-status';

describe('GAMESTATUS', () => {
  it('should have IN_PROGRESS status', () => {
    expect(GAMESTATUS.IN_PROGRESS).toBe('IN_PROGRESS');
  });
});
