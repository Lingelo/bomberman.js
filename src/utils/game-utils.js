import { Wall } from '../game/wall';
import { Bonus } from '../game/bonus';
import { BONUSTYPE } from '../game/bonus-type';

export class GameUtils {
  static initWalls(map, characters) {
    const walls = [];

    for (let x = 0, l = map[0].length; x < l; x++) {
      walls[x] = [];
      for (let y = 0, z = map.length; y < z; y++) {
        if (map[y][x] === 2) {
          if (this.getRandomInt(11) > 1) {
            walls[x][y] = new Wall(x, y);
          }
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

  static initBonus(map, characters) {
    const bonus = [];
    const excludedCoords = [];
    characters.map((character) => ({ x: character.x, y: character.y })).forEach((coords) => {
      excludedCoords.push(coords.x.toString() + coords.y.toString());
      excludedCoords.push((coords.x - 1).toString() + (coords.y).toString());
      excludedCoords.push((coords.x).toString() + (coords.y - 1).toString());
      excludedCoords.push((coords.x + 1).toString() + (coords.y).toString());
      excludedCoords.push((coords.x).toString() + (coords.y + 1).toString());
    });

    for (let x = 0, l = map[0].length; x < l; x++) {
      for (let y = 0, z = map.length; y < z; y++) {
        if (map[y][x] === 2) {
          const randomInt = this.getRandomInt(20);
          if (excludedCoords.includes(x.toString() + y.toString())) {
            continue;
          }

          // eslint-disable-next-line default-case
          switch (randomInt) {
            case 1:
              bonus.push(new Bonus(x, y, BONUSTYPE.BOMB));
              break;
            case 10:
              bonus.push(new Bonus(x, y, BONUSTYPE.POWER));
              break;
          }
        }
      }
    }

    return bonus;
  }

  static getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }
}
