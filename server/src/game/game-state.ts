import { Logger } from '@nestjs/common';
import { PlayerColor, SPAWN_POSITIONS } from './game.types';

// Bonus types matching client-side BONUSTYPE
const BONUS_TYPE = {
  BOMB: 0,
  POWER: 1,
  KICK: 2,
  SKULL: 3,
  SPEED: 4,
  PUNCH: 5,
  POWER_PUNCH: 6,
  REMOTE: 7,
};

export interface ServerPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  x: number;
  y: number;
  alive: boolean;
  direction: number;
  bombMax: number;
  bombUsed: number;
  radius: number;
  speed: number;
  isMoving: boolean;
  moveDirection: number | null;
  moveCooldown: number;
  // Power-ups
  hasKick: boolean;
  hasPunch: boolean;
  hasRemote: boolean;
}

export interface ServerBomb {
  id: string;
  x: number;
  y: number;
  playerId: string;
  playerColor: number;
  radius: number;
  timer: number;
  exploded: boolean;
  isRemote: boolean;
  isSliding: boolean;
  slideDirection: number | null;
}

export interface ServerBonus {
  x: number;
  y: number;
  type: number;
}

export interface ServerWall {
  x: number;
  y: number;
  destroyed: boolean;
}

export interface GameStateSnapshot {
  players: ServerPlayer[];
  bombs: ServerBomb[];
  walls: ServerWall[];
  bonus: ServerBonus[];
  blasts: Array<{ x: number; y: number }>;
}

export class ServerGameState {
  private readonly logger = new Logger(ServerGameState.name);
  private players: Map<string, ServerPlayer> = new Map();
  private bombs: Map<string, ServerBomb> = new Map();
  private walls: ServerWall[] = [];
  private bonus: ServerBonus[] = [];
  private blasts: Array<{ x: number; y: number; timer: number }> = [];
  private bombIdCounter = 0;
  private gameLoop: NodeJS.Timeout | null = null;
  private onStateUpdate: ((state: GameStateSnapshot) => void) | null = null;
  private onGameOver: ((winner: ServerPlayer | null) => void) | null = null;

  private readonly map = [
    [12, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 16],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [8, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4],
  ];

  setCallbacks(
    onStateUpdate: (state: GameStateSnapshot) => void,
    onGameOver: (winner: ServerPlayer | null) => void
  ): void {
    this.onStateUpdate = onStateUpdate;
    this.onGameOver = onGameOver;
  }

  initGame(playerList: Array<{ id: string; name: string; color: PlayerColor }>): void {
    this.players.clear();
    this.bombs.clear();
    this.walls = [];
    this.bonus = [];
    this.blasts = [];
    this.bombIdCounter = 0;

    playerList.forEach(p => {
      const spawn = SPAWN_POSITIONS[p.color];
      this.players.set(p.id, {
        id: p.id,
        name: p.name,
        color: p.color,
        x: spawn.x,
        y: spawn.y,
        alive: true,
        direction: 2,
        bombMax: 1,
        bombUsed: 0,
        radius: 2,
        speed: 1,
        isMoving: false,
        moveDirection: null,
        moveCooldown: 0,
        hasKick: false,
        hasPunch: false,
        hasRemote: false,
      });
    });

    this.initWalls();
    this.initBonus();

    this.logger.log('Game state initialized', {
      players: playerList.length,
      walls: this.walls.length,
      bonus: this.bonus.length,
    });
  }

  private initWalls(): void {
    const safeZones = new Set<string>();

    this.players.forEach(player => {
      const positions = [
        [player.x, player.y],
        [player.x + 1, player.y],
        [player.x - 1, player.y],
        [player.x, player.y + 1],
        [player.x, player.y - 1],
      ];
      positions.forEach(([x, y]) => safeZones.add(`${x},${y}`));
    });

    // map is [row][col] = [y][x], so iterate y from 1-11 (rows), x from 1-13 (cols)
    for (let y = 1; y < 12; y++) {
      for (let x = 1; x < 14; x++) {
        if (this.map[y][x] === 2 && !safeZones.has(`${x},${y}`)) {
          if (Math.random() > 0.3) {
            this.walls.push({ x, y, destroyed: false });
          }
        }
      }
    }
  }

  private initBonus(): void {
    const wallCount = this.walls.length;
    const bonusCount = Math.floor(wallCount * 0.4);

    const shuffledWalls = [...this.walls].sort(() => Math.random() - 0.5);

    // Weighted bonus types: common items have higher chance
    const bonusTypes = [
      BONUS_TYPE.BOMB,    // weight: 3
      BONUS_TYPE.BOMB,
      BONUS_TYPE.BOMB,
      BONUS_TYPE.POWER,   // weight: 3
      BONUS_TYPE.POWER,
      BONUS_TYPE.POWER,
      BONUS_TYPE.SPEED,   // weight: 2
      BONUS_TYPE.SPEED,
      BONUS_TYPE.KICK,    // weight: 1
      BONUS_TYPE.PUNCH,   // weight: 1
      BONUS_TYPE.REMOTE,  // weight: 1
      BONUS_TYPE.SKULL,   // weight: 1
    ];

    for (let i = 0; i < bonusCount && i < shuffledWalls.length; i++) {
      const wall = shuffledWalls[i];
      this.bonus.push({
        x: wall.x,
        y: wall.y,
        type: bonusTypes[Math.floor(Math.random() * bonusTypes.length)],
      });
    }
  }

  startGameLoop(): void {
    if (this.gameLoop) return;

    this.gameLoop = setInterval(() => {
      this.update();
    }, 1000 / 60);

    this.logger.log('Game loop started');
  }

  stopGameLoop(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
      this.logger.log('Game loop stopped');
    }
  }

  private update(): void {
    this.updatePlayerMovements();
    this.updateBombs();
    this.updateBlasts();
    this.checkBonusPickup();
    this.checkVictory();

    if (this.onStateUpdate) {
      this.onStateUpdate(this.getSnapshot());
    }
  }

  private updatePlayerMovements(): void {
    this.players.forEach(player => {
      if (!player.alive || !player.isMoving || player.moveDirection === null) {
        return;
      }

      // Decrement cooldown
      if (player.moveCooldown > 0) {
        player.moveCooldown--;
        return;
      }

      let nx = player.x;
      let ny = player.y;

      // Directions: DOWN=1, LEFT=7, RIGHT=4, TOP=10
      switch (player.moveDirection) {
        case 10: ny--; break; // TOP
        case 1: ny++; break;  // DOWN
        case 7: nx--; break;  // LEFT
        case 4: nx++; break;  // RIGHT
      }

      if (this.canMoveTo(nx, ny)) {
        player.x = nx;
        player.y = ny;
        player.direction = player.moveDirection;
        // Set cooldown: 8 frames at 60fps = 133ms between moves (~7.5 moves/sec)
        player.moveCooldown = 8;
      }
    });
  }

  private updateBombs(): void {
    const toExplode: ServerBomb[] = [];

    this.bombs.forEach(bomb => {
      if (!bomb.exploded) {
        bomb.timer--;
        if (bomb.timer <= 0) {
          toExplode.push(bomb);
        }
      }
    });

    toExplode.forEach(bomb => this.explodeBomb(bomb));
  }

  private explodeBomb(bomb: ServerBomb): void {
    bomb.exploded = true;

    const player = this.players.get(bomb.playerId);
    if (player) {
      player.bombUsed--;
    }

    const blastPositions: Array<{ x: number; y: number }> = [];
    blastPositions.push({ x: bomb.x, y: bomb.y });

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    directions.forEach(({ dx, dy }) => {
      for (let i = 1; i < bomb.radius; i++) {
        const nx = bomb.x + dx * i;
        const ny = bomb.y + dy * i;

        if (this.isBlocked(nx, ny)) break;

        blastPositions.push({ x: nx, y: ny });

        const wall = this.walls.find(w => w.x === nx && w.y === ny && !w.destroyed);
        if (wall) {
          wall.destroyed = true;
          break;
        }
      }
    });

    blastPositions.forEach(pos => {
      this.blasts.push({ ...pos, timer: 30 });
    });

    this.checkBlastDamage(blastPositions);
    this.bombs.delete(bomb.id);
  }

  private isBlocked(x: number, y: number): boolean {
    if (x < 1 || x > 13 || y < 1 || y > 11) return true;
    if (this.map[y][x] === 10) return true;
    return false;
  }

  private checkBlastDamage(blastPositions: Array<{ x: number; y: number }>): void {
    this.players.forEach(player => {
      if (!player.alive) return;

      const hit = blastPositions.some(
        pos => pos.x === player.x && pos.y === player.y
      );

      if (hit) {
        player.alive = false;
        this.logger.log('Player killed by blast', { name: player.name });
      }
    });

    this.bonus = this.bonus.filter(b => {
      const wall = this.walls.find(w => w.x === b.x && w.y === b.y);
      if (wall && wall.destroyed) {
        return true;
      }
      return !blastPositions.some(pos => pos.x === b.x && pos.y === b.y);
    });
  }

  private updateBlasts(): void {
    this.blasts = this.blasts.filter(blast => {
      blast.timer--;
      return blast.timer > 0;
    });
  }

  private checkBonusPickup(): void {
    this.players.forEach(player => {
      if (!player.alive) return;

      const bonusIndex = this.bonus.findIndex(b => {
        const wall = this.walls.find(w => w.x === b.x && w.y === b.y);
        if (wall && !wall.destroyed) return false;
        return b.x === player.x && b.y === player.y;
      });

      if (bonusIndex !== -1) {
        const bonus = this.bonus[bonusIndex];

        switch (bonus.type) {
          case BONUS_TYPE.BOMB:
            player.bombMax++;
            break;
          case BONUS_TYPE.POWER:
            player.radius++;
            break;
          case BONUS_TYPE.KICK:
            player.hasKick = true;
            break;
          case BONUS_TYPE.SKULL:
            // Skull effects are handled client-side for now
            this.logger.debug('Skull picked up', { player: player.name });
            break;
          case BONUS_TYPE.SPEED:
            player.speed = Math.min(player.speed + 0.1, 2);
            break;
          case BONUS_TYPE.PUNCH:
            player.hasPunch = true;
            break;
          case BONUS_TYPE.REMOTE:
            player.hasRemote = true;
            break;
        }

        this.bonus.splice(bonusIndex, 1);
        this.logger.debug('Bonus picked up', { player: player.name, type: bonus.type });
      }
    });
  }

  private checkVictory(): void {
    const alivePlayers = Array.from(this.players.values()).filter(p => p.alive);

    if (alivePlayers.length <= 1) {
      this.stopGameLoop();

      if (this.onGameOver) {
        this.onGameOver(alivePlayers[0] || null);
      }
    }
  }

  startMove(playerId: string, direction: number): void {
    const player = this.players.get(playerId);
    if (!player || !player.alive) return;

    this.logger.log(`Player ${player.name} START MOVE direction=${direction}`);
    player.isMoving = true;
    player.moveDirection = direction;
    player.direction = direction;
  }

  stopMove(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    this.logger.log(`Player ${player.name} STOP MOVE`);
    player.isMoving = false;
    player.moveDirection = null;
  }

  private canMoveTo(x: number, y: number): boolean {
    if (x < 1 || x > 13 || y < 1 || y > 11) return false;
    if (this.map[y][x] === 10) return false;

    const wall = this.walls.find(w => w.x === x && w.y === y && !w.destroyed);
    if (wall) return false;

    const bomb = Array.from(this.bombs.values()).find(b => b.x === x && b.y === y);
    if (bomb) return false;

    return true;
  }

  dropBomb(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player || !player.alive) return;

    if (player.bombUsed >= player.bombMax) return;

    const existingBomb = Array.from(this.bombs.values()).find(
      b => b.x === player.x && b.y === player.y && !b.isSliding
    );
    if (existingBomb) return;

    const bombId = `bomb_${this.bombIdCounter++}`;
    this.bombs.set(bombId, {
      id: bombId,
      x: player.x,
      y: player.y,
      playerId: player.id,
      playerColor: player.color,
      radius: player.radius,
      timer: player.hasRemote ? 999999 : 180, // Remote bombs don't auto-explode
      exploded: false,
      isRemote: player.hasRemote,
      isSliding: false,
      slideDirection: null,
    });

    player.bombUsed++;
  }

  detonate(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player || !player.alive || !player.hasRemote) return;

    // Find all remote bombs belonging to this player and detonate them
    const playerBombs = Array.from(this.bombs.values()).filter(
      b => b.playerId === playerId && b.isRemote && !b.exploded
    );

    playerBombs.forEach(bomb => {
      bomb.timer = 1; // Will explode on next update
    });

    this.logger.debug('Remote detonate', { player: player.name, bombs: playerBombs.length });
  }

  getSnapshot(): GameStateSnapshot {
    return {
      players: Array.from(this.players.values()),
      bombs: Array.from(this.bombs.values()).filter(b => !b.exploded),
      walls: this.walls,
      bonus: this.bonus.filter(b => {
        const wall = this.walls.find(w => w.x === b.x && w.y === b.y);
        return !wall || wall.destroyed;
      }),
      blasts: this.blasts.map(b => ({ x: b.x, y: b.y })),
    };
  }

  getPlayer(playerId: string): ServerPlayer | undefined {
    return this.players.get(playerId);
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      player.alive = false;
    }
  }
}
