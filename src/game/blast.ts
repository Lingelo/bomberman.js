import { Action } from '../state/actions';
import { dispatch } from '../state/redux';
import { Flame } from './flame';
import { CARDINAL } from './cardinal';
import { CharacterStatus } from './character-status';
import type { CanvasContext, GameMap, WallGrid, PropagationState } from '../types';
import type { Bomb } from './bomb';
import type { Character } from './character';
import type { Bonus } from './bonus';

export class Blast {
  walls: WallGrid;
  map: GameMap;
  x: number;
  y: number;
  animationState: number;
  time: number;
  radius: number;
  timer: number;
  flames: Flame[];
  bombs: Bomb[];
  characters: Character[];
  character: Character;
  canPropagate: PropagationState;
  bonus: Bonus[];

  constructor(
    bomb: Bomb,
    character: Character,
    map: GameMap,
    walls: WallGrid,
    bombs: Bomb[],
    characters: Character[],
    bonus: Bonus[]
  ) {
    this.walls = walls;
    this.map = map;
    this.x = bomb.x;
    this.y = bomb.y;
    this.animationState = 0;
    this.time = 0;
    this.radius = character.radius;
    this.timer = 20;
    this.flames = [];
    this.bombs = bombs;
    this.characters = characters;
    this.character = character;
    this.canPropagate = {
      north: true,
      east: true,
      south: true,
      west: true,
    };
    this.bonus = bonus;
  }

  render(canvasContext: CanvasContext): void {
    let radius = this.radius;
    this.animationState++;

    if (this.time++ > this.timer) {
      dispatch({ type: Action.BLAST_VANISHED, payload: { blast: this } });
    }

    const power = this.computePower();

    if (this.animationState <= this.radius) {
      radius = this.animationState;
    }

    this.flames.push(new Flame(this.x, this.y, power, CARDINAL.MIDDLE));

    this.computeNorth(radius, power);
    this.computeEast(radius, power);
    this.computeSouth(radius, power);
    this.computeWest(radius, power);

    this.flames.forEach((flame) => {
      flame.render(canvasContext);

      this.bombs.forEach((bomb) => {
        if (bomb.x === flame.x && bomb.y === flame.y) {
          dispatch({
            type: Action.ADD_BLAST,
            payload: { bomb, character: bomb.character },
          });

          dispatch({
            type: Action.BOMB_EXPLODED,
            payload: { bomb },
          });
        }
      });

      this.bonus.forEach((item) => {
        if (item.x === flame.x && item.y === flame.y) {
          dispatch({
            type: Action.BONUS_EXPLODED,
            payload: { item },
          });
        }
      });

      this.characters.forEach((character) => {
        if (
          character.x === flame.x &&
          character.y === flame.y &&
          character.status === CharacterStatus.ALIVE
        ) {
          dispatch({
            type: Action.KILL,
            payload: { character },
          });
        }
      });
    });
  }

  computeNorth(_radius: number, power: number): void {
    let indexBlastNorth = 1;
    while (indexBlastNorth < this.radius) {
      const canPropagate =
        this.map[this.y - indexBlastNorth][this.x] === 2 && this.canPropagate.north;
      const canVanish =
        this.walls[this.x][this.y - indexBlastNorth] &&
        !this.walls[this.x][this.y - indexBlastNorth]!.destroyed;

      if (!canPropagate) {
        break;
      } else if (canVanish && canPropagate) {
        this.canPropagate.north = false;
        this.flames.push(new Flame(this.x, this.y - indexBlastNorth, power, CARDINAL.NORTH_END));
        dispatch({
          type: Action.DESTROY,
          payload: { destroyedX: this.x, destroyedY: this.y - indexBlastNorth },
        });
      } else if (!canVanish && canPropagate) {
        if (indexBlastNorth + 1 === this.radius) {
          this.flames.push(new Flame(this.x, this.y - indexBlastNorth, power, CARDINAL.NORTH_END));
        } else {
          this.flames.push(
            new Flame(this.x, this.y - indexBlastNorth, power, CARDINAL.NORTH_MIDDLE)
          );
        }
      }
      indexBlastNorth++;
    }
  }

  computeEast(_radius: number, power: number): void {
    let indexBlastEast = 1;
    while (indexBlastEast < this.radius) {
      const canPropagate =
        this.map[this.y][this.x + indexBlastEast] === 2 && this.canPropagate.east;
      const canVanish =
        this.walls[this.x + indexBlastEast][this.y] &&
        !this.walls[this.x + indexBlastEast][this.y]!.destroyed;

      if (!canPropagate) {
        break;
      } else if (canPropagate && canVanish) {
        this.canPropagate.east = false;
        this.flames.push(new Flame(this.x + indexBlastEast, this.y, power, CARDINAL.EAST_END));
        dispatch({
          type: Action.DESTROY,
          payload: { destroyedX: this.x + indexBlastEast, destroyedY: this.y },
        });
      } else if (canPropagate && !canVanish) {
        if (indexBlastEast + 1 === this.radius) {
          this.flames.push(new Flame(this.x + indexBlastEast, this.y, power, CARDINAL.EAST_END));
        } else {
          this.flames.push(new Flame(this.x + indexBlastEast, this.y, power, CARDINAL.EAST_MIDDLE));
        }
      }
      indexBlastEast++;
    }
  }

  computeSouth(_radius: number, power: number): void {
    let indexBlastSouth = 1;
    while (indexBlastSouth < this.radius) {
      const canPropagate =
        this.map[this.y + indexBlastSouth][this.x] === 2 && this.canPropagate.south;
      const canVanish =
        this.walls[this.x][this.y + indexBlastSouth] &&
        !this.walls[this.x][this.y + indexBlastSouth]!.destroyed;

      if (!canPropagate) {
        break;
      } else if (canPropagate && canVanish) {
        this.canPropagate.south = false;
        this.flames.push(new Flame(this.x, this.y + indexBlastSouth, power, CARDINAL.SOUTH_END));
        dispatch({
          type: Action.DESTROY,
          payload: { destroyedX: this.x, destroyedY: this.y + indexBlastSouth },
        });
      } else if (canPropagate && !canVanish) {
        if (indexBlastSouth + 1 === this.radius) {
          this.flames.push(new Flame(this.x, this.y + indexBlastSouth, power, CARDINAL.SOUTH_END));
        } else {
          this.flames.push(
            new Flame(this.x, this.y + indexBlastSouth, power, CARDINAL.SOUTH_MIDDLE)
          );
        }
      }
      indexBlastSouth++;
    }
  }

  computeWest(_radius: number, power: number): void {
    let indexBlastWest = 1;
    while (indexBlastWest < this.radius) {
      const canPropagate =
        this.map[this.y][this.x - indexBlastWest] === 2 && this.canPropagate.west;
      const canVanish =
        this.walls[this.x - indexBlastWest][this.y] &&
        !this.walls[this.x - indexBlastWest][this.y]!.destroyed;

      if (!canPropagate) {
        break;
      } else if (canPropagate && canVanish) {
        this.canPropagate.west = false;
        this.flames.push(new Flame(this.x - indexBlastWest, this.y, power, CARDINAL.WEST_END));
        dispatch({
          type: Action.DESTROY,
          payload: { destroyedX: this.x - indexBlastWest, destroyedY: this.y },
        });
      } else if (canPropagate && !canVanish) {
        if (indexBlastWest + 1 === this.radius) {
          this.flames.push(new Flame(this.x - indexBlastWest, this.y, power, CARDINAL.WEST_END));
        } else {
          this.flames.push(new Flame(this.x - indexBlastWest, this.y, power, CARDINAL.WEST_MIDDLE));
        }
      }
      indexBlastWest++;
    }
  }

  computePower(): number {
    switch (this.radius) {
      case 1:
      case 2:
        return 0;
      case 3:
      case 4:
        return 1;
      case 5:
      case 6:
        return 2;
      default:
        return 0;
    }
  }
}
