import {Wall} from "../game/wall";

export class GameUtils {
    constructor() {

    }

    static initWalls(map, characters) {
        let walls = [];

        for (let x = 0, l = map[0].length; x < l; x++) {
            walls[x] = [];
            for (let y = 0, z = map.length; y < z; y++) {
                if (map[y][x] === 2) {
                    if (Math.floor(Math.random() * 11) > 1) {
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
}