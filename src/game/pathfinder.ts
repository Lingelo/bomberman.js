import { DIRECTION, type Direction } from './direction';
import type { GameState } from '../types';

interface Node {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic (Manhattan distance)
  f: number; // Total cost (g + h)
  parent: Node | null;
}

export class Pathfinder {
  // A* pathfinding algorithm
  static findPath(
    state: GameState,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    avoidDanger: boolean = true,
    dangerMap?: number[][]
  ): Direction[] {
    const openSet: Node[] = [];
    const closedSet: Set<string> = new Set();

    const startNode: Node = {
      x: startX,
      y: startY,
      g: 0,
      h: this.heuristic(startX, startY, targetX, targetY),
      f: 0,
      parent: null,
    };
    startNode.f = startNode.g + startNode.h;
    openSet.push(startNode);

    while (openSet.length > 0) {
      // Find node with lowest f score
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }

      const current = openSet[currentIndex];

      // Reached target
      if (current.x === targetX && current.y === targetY) {
        return this.reconstructPath(current);
      }

      // Move current to closed set
      openSet.splice(currentIndex, 1);
      closedSet.add(`${current.x},${current.y}`);

      // Check neighbors
      const neighbors = this.getNeighbors(state, current.x, current.y, avoidDanger, dangerMap);

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(key)) continue;

        const tentativeG = current.g + 1 + (neighbor.dangerCost || 0);

        const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);

        if (!existingNode) {
          const newNode: Node = {
            x: neighbor.x,
            y: neighbor.y,
            g: tentativeG,
            h: this.heuristic(neighbor.x, neighbor.y, targetX, targetY),
            f: 0,
            parent: current,
          };
          newNode.f = newNode.g + newNode.h;
          openSet.push(newNode);
        } else if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = existingNode.g + existingNode.h;
          existingNode.parent = current;
        }
      }
    }

    // No path found
    return [];
  }

  // Manhattan distance heuristic
  private static heuristic(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  // Get valid neighboring positions
  private static getNeighbors(
    state: GameState,
    x: number,
    y: number,
    avoidDanger: boolean,
    dangerMap?: number[][]
  ): { x: number; y: number; dangerCost: number }[] {
    const neighbors: { x: number; y: number; dangerCost: number }[] = [];
    const directions = [
      { dx: 0, dy: -1 }, // TOP
      { dx: 0, dy: 1 },  // DOWN
      { dx: -1, dy: 0 }, // LEFT
      { dx: 1, dy: 0 },  // RIGHT
    ];

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (!this.canMove(state, nx, ny)) continue;

      let dangerCost = 0;
      if (dangerMap && dangerMap[nx]?.[ny]) {
        if (avoidDanger && dangerMap[nx][ny] > 50) continue; // Avoid high danger
        dangerCost = dangerMap[nx][ny] / 10; // Add cost for dangerous areas
      }

      neighbors.push({ x: nx, y: ny, dangerCost });
    }

    return neighbors;
  }

  // Reconstruct path from end node to start
  private static reconstructPath(node: Node): Direction[] {
    const path: Direction[] = [];
    let current: Node | null = node;

    while (current && current.parent) {
      const dx = current.x - current.parent.x;
      const dy = current.y - current.parent.y;

      if (dx === 1) path.unshift(DIRECTION.RIGHT);
      else if (dx === -1) path.unshift(DIRECTION.LEFT);
      else if (dy === 1) path.unshift(DIRECTION.DOWN);
      else if (dy === -1) path.unshift(DIRECTION.TOP);

      current = current.parent;
    }

    return path;
  }

  // Check if position is walkable
  private static canMove(state: GameState, x: number, y: number): boolean {
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

  // Create a danger map for the current state
  static createDangerMap(state: GameState): number[][] {
    const width = state.map[0].length;
    const height = state.map.length;
    const dangerMap: number[][] = Array(width).fill(null).map(() => Array(height).fill(0));

    // Mark danger zones from bombs
    for (const bomb of state.bombs) {
      const radius = bomb.character.radius;
      const timeRemaining = bomb.timer - bomb.timeElapsed; // Time remaining before explosion
      const urgency = Math.max(0, 100 - (timeRemaining / 30)); // Higher urgency as time runs out

      // Center
      dangerMap[bomb.x][bomb.y] = 100;

      // Cross pattern
      for (let i = 1; i <= radius; i++) {
        // Up
        if (bomb.y - i >= 0 && state.map[bomb.y - i][bomb.x] === 2) {
          if (state.walls[bomb.x]?.[bomb.y - i] && !state.walls[bomb.x][bomb.y - i]!.destroyed) break;
          dangerMap[bomb.x][bomb.y - i] = Math.max(dangerMap[bomb.x][bomb.y - i], urgency);
        } else break;
      }
      for (let i = 1; i <= radius; i++) {
        // Down
        if (bomb.y + i < height && state.map[bomb.y + i][bomb.x] === 2) {
          if (state.walls[bomb.x]?.[bomb.y + i] && !state.walls[bomb.x][bomb.y + i]!.destroyed) break;
          dangerMap[bomb.x][bomb.y + i] = Math.max(dangerMap[bomb.x][bomb.y + i], urgency);
        } else break;
      }
      for (let i = 1; i <= radius; i++) {
        // Left
        if (bomb.x - i >= 0 && state.map[bomb.y][bomb.x - i] === 2) {
          if (state.walls[bomb.x - i]?.[bomb.y] && !state.walls[bomb.x - i][bomb.y]!.destroyed) break;
          dangerMap[bomb.x - i][bomb.y] = Math.max(dangerMap[bomb.x - i][bomb.y], urgency);
        } else break;
      }
      for (let i = 1; i <= radius; i++) {
        // Right
        if (bomb.x + i < width && state.map[bomb.y][bomb.x + i] === 2) {
          if (state.walls[bomb.x + i]?.[bomb.y] && !state.walls[bomb.x + i][bomb.y]!.destroyed) break;
          dangerMap[bomb.x + i][bomb.y] = Math.max(dangerMap[bomb.x + i][bomb.y], urgency);
        } else break;
      }
    }

    // Mark danger from active blasts
    for (const blast of state.blasts) {
      dangerMap[blast.x][blast.y] = 100;
      for (let i = 1; i <= blast.radius; i++) {
        if (blast.y - i >= 0) dangerMap[blast.x][blast.y - i] = 100;
        if (blast.y + i < height) dangerMap[blast.x][blast.y + i] = 100;
        if (blast.x - i >= 0) dangerMap[blast.x - i][blast.y] = 100;
        if (blast.x + i < width) dangerMap[blast.x + i][blast.y] = 100;
      }
    }

    return dangerMap;
  }

  // Find nearest safe position
  static findNearestSafePosition(
    state: GameState,
    x: number,
    y: number,
    dangerMap: number[][]
  ): { x: number; y: number } | null {
    const visited: Set<string> = new Set();
    const queue: { x: number; y: number }[] = [{ x, y }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.x},${current.y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      // Check if safe
      if (dangerMap[current.x]?.[current.y] === 0 && this.canMove(state, current.x, current.y)) {
        if (current.x !== x || current.y !== y) {
          return current;
        }
      }

      // Add neighbors
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        if (this.canMove(state, nx, ny) && !visited.has(`${nx},${ny}`)) {
          queue.push({ x: nx, y: ny });
        }
      }
    }

    return null;
  }
}
