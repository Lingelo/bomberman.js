import {Wall} from "../game/wall";
import {Bonus} from "../game/bonus";
import {BONUSTYPE} from "../game/bonus-type";

export class GameUtils {
    constructor() {

    }

    static initWalls(map, characters) {
        let walls = [];

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

        characters.forEach(character => {
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
        const charactersCoords = characters.map(character => {
            return character.x.toString()+character.y.toString();
        });

        for (let x = 0, l = map[0].length; x < l; x++) {
            for (let y = 0, z = map.length; y < z; y++) {
                if (map[y][x] === 2) {
                    let randomInt = this.getRandomInt(20);
                    if(charactersCoords.includes(x.toString()+y.toString())) {
                        continue;
                    }

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