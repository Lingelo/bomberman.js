import { Action } from '../state/actions';
import { dispatch, getState } from '../state/redux';
import { DIRECTION, type Direction } from './direction';
import { Pathfinder } from './pathfinder';
import { BONUSTYPE } from './bonus-type';
import type { Character } from './character';
import type { GameState } from '../types';

export class BotAI {
  character: Character;
  lastDecisionTime: number;
  decisionInterval: number;
  currentAction: 'move' | 'bomb' | 'flee' | 'idle';
  currentPath: Direction[];
  pathIndex: number;
  targetX: number;
  targetY: number;
  dangerMap: number[][];
  huntingTarget: Character | null;

  constructor(character: Character) {
    this.character = character;
    this.lastDecisionTime = 0;
    this.decisionInterval = 150; // Faster decisions
    this.currentAction = 'idle';
    this.currentPath = [];
    this.pathIndex = 0;
    this.targetX = -1;
    this.targetY = -1;
    this.dangerMap = [];
    this.huntingTarget = null;
  }

  update(): void {
    const now = Date.now();

    if (now - this.lastDecisionTime < this.decisionInterval) {
      return;
    }
    this.lastDecisionTime = now;

    const state = getState();
    if (!state || state.gameStatus !== 'IN_PROGRESS') return;

    // Update danger map
    this.dangerMap = Pathfinder.createDangerMap(state);

    const decision = this.makeDecision(state);
    this.executeDecision(decision);
  }

  makeDecision(state: GameState): { action: string; direction?: Direction } {
    const { x, y } = this.character;
    const currentDanger = this.dangerMap[x]?.[y] || 0;

    // Priority 0: Detonate remote bombs if enemy in range and we're safe
    if (this.character.hasRemote && this.shouldDetonateRemote(state)) {
      return { action: 'detonate' };
    }

    // Priority 1: FLEE if in danger - use A* to find safe spot
    if (currentDanger > 30) {
      const safePos = Pathfinder.findNearestSafePosition(state, x, y, this.dangerMap);
      if (safePos) {
        const escapePath = Pathfinder.findPath(state, x, y, safePos.x, safePos.y, false);
        if (escapePath.length > 0) {
          this.currentPath = escapePath;
          this.pathIndex = 0;
          return { action: 'flee', direction: escapePath[0] };
        }
      }
      // Emergency: try any direction
      const emergency = this.findEmergencyEscape(state);
      if (emergency) return { action: 'flee', direction: emergency };
      return { action: 'idle' };
    }

    // Priority 2: Strategic bomb placement
    if (this.shouldPlaceBombStrategic(state)) {
      const escapePath = this.findEscapePathAfterBomb(state);
      if (escapePath.length > 0) {
        this.currentPath = escapePath;
        this.pathIndex = 0;
        return { action: 'bomb' };
      }
    }

    // Priority 3: Follow current path if valid
    if (this.currentPath.length > 0 && this.pathIndex < this.currentPath.length) {
      const nextDir = this.currentPath[this.pathIndex];
      const newPos = this.getNewPosition(x, y, nextDir);
      if (this.canMove(state, newPos.x, newPos.y) && (this.dangerMap[newPos.x]?.[newPos.y] || 0) < 30) {
        this.pathIndex++;
        return { action: 'move', direction: nextDir };
      }
      // Path blocked, recalculate
      this.currentPath = [];
      this.pathIndex = 0;
    }

    // Priority 4: Hunt nearest player using A*
    const huntPath = this.findPathToNearestEnemy(state);
    if (huntPath.length > 0) {
      this.currentPath = huntPath;
      this.pathIndex = 1;
      return { action: 'move', direction: huntPath[0] };
    }

    // Priority 5: Go to nearest bonus
    const bonusPath = this.findPathToNearestBonus(state);
    if (bonusPath.length > 0) {
      this.currentPath = bonusPath;
      this.pathIndex = 1;
      return { action: 'move', direction: bonusPath[0] };
    }

    // Priority 6: Explore - find walls to destroy
    const explorePath = this.findPathToNearestWall(state);
    if (explorePath.length > 0) {
      this.currentPath = explorePath;
      this.pathIndex = 1;
      return { action: 'move', direction: explorePath[0] };
    }

    return { action: 'idle' };
  }

  findPathToNearestEnemy(state: GameState): Direction[] {
    const { x, y } = this.character;
    let nearestEnemy: Character | null = null;
    let nearestDist = Infinity;

    // Find nearest alive enemy (prioritize human players)
    for (const enemy of state.characters) {
      if (enemy.color === this.character.color || enemy.status !== 'ALIVE') continue;

      const dist = Math.abs(enemy.x - x) + Math.abs(enemy.y - y);
      // Prioritize human players over bots
      const priority = enemy.isBot ? dist : dist * 0.7;

      if (priority < nearestDist) {
        nearestDist = priority;
        nearestEnemy = enemy;
      }
    }

    if (!nearestEnemy) return [];

    this.huntingTarget = nearestEnemy;

    // Find path to a position near the enemy (within bomb radius)
    const targetPositions = this.getAttackPositions(state, nearestEnemy.x, nearestEnemy.y);

    for (const pos of targetPositions) {
      const path = Pathfinder.findPath(state, x, y, pos.x, pos.y, true, this.dangerMap);
      if (path.length > 0) {
        return path;
      }
    }

    // Direct path if no attack position available
    return Pathfinder.findPath(state, x, y, nearestEnemy.x, nearestEnemy.y, true, this.dangerMap);
  }

  getAttackPositions(state: GameState, targetX: number, targetY: number): { x: number; y: number }[] {
    const positions: { x: number; y: number; dist: number }[] = [];
    const radius = this.character.radius;

    // Positions in cross pattern around target
    for (let i = 1; i <= radius; i++) {
      const candidates = [
        { x: targetX - i, y: targetY },
        { x: targetX + i, y: targetY },
        { x: targetX, y: targetY - i },
        { x: targetX, y: targetY + i },
      ];

      for (const pos of candidates) {
        if (this.canMove(state, pos.x, pos.y)) {
          const dist = Math.abs(pos.x - this.character.x) + Math.abs(pos.y - this.character.y);
          positions.push({ ...pos, dist });
        }
      }
    }

    // Sort by distance
    positions.sort((a, b) => a.dist - b.dist);
    return positions;
  }

  findPathToNearestBonus(state: GameState): Direction[] {
    const { x, y } = this.character;
    let bestBonus: { x: number; y: number } | null = null;
    let bestScore = -Infinity;

    for (const bonus of state.bonus) {
      // NEVER pick up skull - it's always bad!
      if (bonus.type === BONUSTYPE.SKULL) continue;

      const dist = Math.abs(bonus.x - x) + Math.abs(bonus.y - y);

      // Prioritize bonuses based on value
      let priority = 0;
      switch (bonus.type) {
        case BONUSTYPE.REMOTE:
          priority = 50; // Very valuable - can detonate strategically
          break;
        case BONUSTYPE.PUNCH:
          priority = 40; // Can throw bombs over obstacles
          break;
        case BONUSTYPE.KICK:
          priority = 35; // Can push bombs toward enemies
          break;
        case BONUSTYPE.POWER:
          priority = 30; // More explosion range
          break;
        case BONUSTYPE.BOMB:
          priority = 25; // More bombs
          break;
        case BONUSTYPE.SPEED:
          priority = 20; // Faster movement
          break;
        default:
          priority = 10;
      }

      // Don't prioritize items we already have
      if (bonus.type === BONUSTYPE.KICK && this.character.hasKick) priority = 5;
      if (bonus.type === BONUSTYPE.PUNCH && this.character.hasPunch) priority = 5;
      if (bonus.type === BONUSTYPE.REMOTE && this.character.hasRemote) priority = 5;

      const score = priority - dist;
      if (score > bestScore) {
        bestScore = score;
        bestBonus = bonus;
      }
    }

    if (!bestBonus) return [];

    return Pathfinder.findPath(state, x, y, bestBonus.x, bestBonus.y, true, this.dangerMap);
  }

  findPathToNearestWall(state: GameState): Direction[] {
    const { x, y } = this.character;
    let nearestWall: { x: number; y: number } | null = null;
    let nearestDist = Infinity;

    // Find nearest destructible wall
    for (let wx = 0; wx < state.walls.length; wx++) {
      for (let wy = 0; wy < (state.walls[wx]?.length || 0); wy++) {
        if (state.walls[wx][wy] && !state.walls[wx][wy]!.destroyed) {
          // Find adjacent walkable position
          const adjacent = [
            { x: wx - 1, y: wy },
            { x: wx + 1, y: wy },
            { x: wx, y: wy - 1 },
            { x: wx, y: wy + 1 },
          ];

          for (const pos of adjacent) {
            if (this.canMove(state, pos.x, pos.y)) {
              const dist = Math.abs(pos.x - x) + Math.abs(pos.y - y);
              if (dist < nearestDist) {
                nearestDist = dist;
                nearestWall = pos;
              }
            }
          }
        }
      }
    }

    if (!nearestWall) return [];

    return Pathfinder.findPath(state, x, y, nearestWall.x, nearestWall.y, true, this.dangerMap);
  }

  shouldPlaceBombStrategic(state: GameState): boolean {
    if (this.character.bombUsed >= this.character.bombMax) return false;

    const { x, y } = this.character;

    // Don't place if already at bomb location
    if (state.bombs.some(b => b.x === x && b.y === y)) return false;

    // Check if enemy in blast range
    const enemyInRange = this.isEnemyInBlastRange(state);
    if (enemyInRange) return Math.random() < 0.6;

    // Check if wall nearby
    const wallsNearby = this.countNearbyWalls(state, x, y);
    if (wallsNearby > 0) return Math.random() < 0.35;

    return false;
  }

  isEnemyInBlastRange(state: GameState): boolean {
    const { x, y } = this.character;
    const radius = this.character.radius;

    for (const enemy of state.characters) {
      if (enemy.color === this.character.color || enemy.status !== 'ALIVE') continue;

      // Check if enemy is in cross pattern
      if (enemy.x === x && Math.abs(enemy.y - y) <= radius) {
        if (!this.isBlastBlocked(state, x, y, enemy.x, enemy.y)) return true;
      }
      if (enemy.y === y && Math.abs(enemy.x - x) <= radius) {
        if (!this.isBlastBlocked(state, x, y, enemy.x, enemy.y)) return true;
      }
    }

    return false;
  }

  findEscapePathAfterBomb(state: GameState): Direction[] {
    const { x, y } = this.character;
    const radius = this.character.radius;

    // Find positions outside blast radius
    const safePositions: { x: number; y: number; dist: number }[] = [];

    // BFS to find reachable safe positions
    const visited: Set<string> = new Set();
    const queue: { x: number; y: number; dist: number }[] = [{ x, y, dist: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.x},${current.y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      // Check if safe from bomb we'll place
      const inBlast = (current.x === x && Math.abs(current.y - y) <= radius) ||
                      (current.y === y && Math.abs(current.x - x) <= radius);

      if (!inBlast && current.dist > 0 && (this.dangerMap[current.x]?.[current.y] || 0) < 30) {
        safePositions.push(current);
      }

      // Explore neighbors
      const neighbors = [
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 },
      ];

      for (const n of neighbors) {
        if (this.canMove(state, n.x, n.y) && !visited.has(`${n.x},${n.y}`)) {
          queue.push({ x: n.x, y: n.y, dist: current.dist + 1 });
        }
      }
    }

    // Sort by distance and find path to nearest safe position
    safePositions.sort((a, b) => a.dist - b.dist);

    for (const pos of safePositions) {
      const path = Pathfinder.findPath(state, x, y, pos.x, pos.y, false);
      if (path.length > 0) return path;
    }

    return [];
  }

  findEmergencyEscape(state: GameState): Direction | null {
    const { x, y } = this.character;
    const directions: Direction[] = [DIRECTION.TOP, DIRECTION.DOWN, DIRECTION.LEFT, DIRECTION.RIGHT];

    // Find any safe direction
    for (const dir of directions) {
      const newPos = this.getNewPosition(x, y, dir);
      if (this.canMove(state, newPos.x, newPos.y)) {
        const newDanger = this.dangerMap[newPos.x]?.[newPos.y] || 0;
        if (newDanger < (this.dangerMap[x]?.[y] || 0)) {
          return dir;
        }
      }
    }

    // Any valid move
    for (const dir of directions) {
      const newPos = this.getNewPosition(x, y, dir);
      if (this.canMove(state, newPos.x, newPos.y)) {
        return dir;
      }
    }

    return null;
  }

  executeDecision(decision: { action: string; direction?: Direction }): void {
    switch (decision.action) {
      case 'flee':
      case 'move':
        if (decision.direction) {
          dispatch({
            type: Action.MOVE,
            payload: {
              color: this.character.color,
              direction: decision.direction,
            },
          });
        }
        break;

      case 'bomb':
        dispatch({
          type: Action.DROP_BOMB,
          payload: { color: this.character.color },
        });
        break;

      case 'detonate':
        dispatch({
          type: Action.DETONATE,
          payload: { color: this.character.color },
        });
        break;
    }
  }

  shouldDetonateRemote(state: GameState): boolean {
    const { x, y } = this.character;

    // Find our remote bombs
    const ourRemoteBombs = state.bombs.filter(
      b => b.character.color === this.character.color && b.isRemote
    );

    if (ourRemoteBombs.length === 0) return false;

    // Check if we're safe (not in any bomb's blast range)
    const currentDanger = this.dangerMap[x]?.[y] || 0;
    if (currentDanger > 30) return false;

    // Check if any enemy is in blast range of our remote bombs
    for (const bomb of ourRemoteBombs) {
      for (const enemy of state.characters) {
        if (enemy.color === this.character.color || enemy.status !== 'ALIVE') continue;

        // Check if enemy is in the bomb's blast range
        const radius = this.character.radius;
        const inHorizontalBlast = enemy.y === bomb.y && Math.abs(enemy.x - bomb.x) <= radius;
        const inVerticalBlast = enemy.x === bomb.x && Math.abs(enemy.y - bomb.y) <= radius;

        if (inHorizontalBlast || inVerticalBlast) {
          // Make sure we're not in our own blast
          const weInHorizontal = y === bomb.y && Math.abs(x - bomb.x) <= radius;
          const weInVertical = x === bomb.x && Math.abs(y - bomb.y) <= radius;

          if (!weInHorizontal && !weInVertical) {
            return true;
          }
        }
      }
    }

    return false;
  }

  isBlastBlocked(state: GameState, bombX: number, bombY: number, targetX: number, targetY: number): boolean {
    if (bombX === targetX) {
      const minY = Math.min(bombY, targetY);
      const maxY = Math.max(bombY, targetY);
      for (let y = minY + 1; y < maxY; y++) {
        if (state.map[y][bombX] !== 2) return true;
      }
    } else if (bombY === targetY) {
      const minX = Math.min(bombX, targetX);
      const maxX = Math.max(bombX, targetX);
      for (let x = minX + 1; x < maxX; x++) {
        if (state.map[bombY][x] !== 2) return true;
      }
    }
    return false;
  }

  countNearbyWalls(state: GameState, x: number, y: number): number {
    let count = 0;
    const positions = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ];

    for (const pos of positions) {
      if (
        pos.x >= 0 &&
        pos.x < state.walls.length &&
        pos.y >= 0 &&
        pos.y < state.walls[pos.x]?.length &&
        state.walls[pos.x][pos.y] &&
        !state.walls[pos.x][pos.y]!.destroyed
      ) {
        count++;
      }
    }

    return count;
  }

  getNewPosition(x: number, y: number, direction: Direction): { x: number; y: number } {
    switch (direction) {
      case DIRECTION.TOP:
        return { x, y: y - 1 };
      case DIRECTION.DOWN:
        return { x, y: y + 1 };
      case DIRECTION.LEFT:
        return { x: x - 1, y };
      case DIRECTION.RIGHT:
        return { x: x + 1, y };
      default:
        return { x, y };
    }
  }

  canMove(state: GameState, x: number, y: number): boolean {
    if (x < 0 || y < 0 || y >= state.map.length || x >= state.map[0].length) {
      return false;
    }

    if (state.map[y][x] !== 2) {
      return false;
    }

    if (state.walls[x]?.[y] && !state.walls[x][y]!.destroyed) {
      return false;
    }

    for (const bomb of state.bombs) {
      if (bomb.x === x && bomb.y === y) {
        return false;
      }
    }

    return true;
  }
}
