import { Wall } from '../game/wall';
import { Bonus } from '../game/bonus';
import { BONUSTYPE } from '../game/bonus-type';
import type { Character } from '../game/character';
import type { GameMap, WallGrid } from '../types';

export class GameUtils {
  static initWalls(map: GameMap, characters: Character[]): WallGrid {
    const walls: WallGrid = [];

    for (let x = 0, l = map[0].length; x < l; x++) {
      walls[x] = [];
      for (let y = 0, z = map.length; y < z; y++) {
        if (map[y][x] === 2) {
          if (this.getRandomInt(11) > 1) {
            walls[x][y] = new Wall(x, y);
          } else {
            walls[x][y] = null;
          }
        } else {
          walls[x][y] = null;
        }
      }
    }

    characters.forEach((character) => {
      if (walls[character.x] && walls[character.x][character.y]) {
        walls[character.x][character.y] = null;
      }
      if (walls[character.x - 1] && walls[character.x - 1][character.y]) {
        walls[character.x - 1][character.y] = null;
      }
      if (walls[character.x] && walls[character.x][character.y - 1]) {
        walls[character.x][character.y - 1] = null;
      }
      if (walls[character.x + 1] && walls[character.x + 1][character.y]) {
        walls[character.x + 1][character.y] = null;
      }
      if (walls[character.x] && walls[character.x][character.y + 1]) {
        walls[character.x][character.y + 1] = null;
      }
    });

    return walls;
  }

  static initBonus(map: GameMap, characters: Character[]): Bonus[] {
    const bonus: Bonus[] = [];
    const excludedCoords: string[] = [];

    characters.forEach((character) => {
      excludedCoords.push(character.x.toString() + character.y.toString());
      excludedCoords.push((character.x - 1).toString() + character.y.toString());
      excludedCoords.push(character.x.toString() + (character.y - 1).toString());
      excludedCoords.push((character.x + 1).toString() + character.y.toString());
      excludedCoords.push(character.x.toString() + (character.y + 1).toString());
    });

    for (let x = 0, l = map[0].length; x < l; x++) {
      for (let y = 0, z = map.length; y < z; y++) {
        if (map[y][x] === 2) {
          const randomInt = this.getRandomInt(20);
          if (excludedCoords.includes(x.toString() + y.toString())) {
            continue;
          }

          switch (randomInt) {
            case 1:
              bonus.push(new Bonus(x, y, BONUSTYPE.BOMB));
              break;
            case 10:
              bonus.push(new Bonus(x, y, BONUSTYPE.POWER));
              break;
            case 15:
              bonus.push(new Bonus(x, y, BONUSTYPE.SPEED));
              break;
          }
        }
      }
    }

    return bonus;
  }

  static getRandomInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
  }
}
