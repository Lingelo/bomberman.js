import {Wall} from "../game/wall";

export class WallMapper {
    constructor() {
    }

    mapToFront(objectServer) {
        const walls = [];

        for(let i = 0; i < objectServer.length; i++) {
            walls[i]= [];
            for(let j = 0; j < objectServer[i].length; j++) {
                if(objectServer[i][j]) {
                    walls[i][j] = new Wall(objectServer[i][j].x, objectServer[i][j].y, objectServer[i][j].destroyed);
                }else {
                    walls[i][j] = null;
                }
            }
        }

        return walls;

    }

}