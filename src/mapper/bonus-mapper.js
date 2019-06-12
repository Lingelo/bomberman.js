import {Bonus} from "../game/bonus";

export class BonusMapper {
    constructor() {

    }

    mapToFront(objectServer) {
        return new Bonus(objectServer.x, objectServer.y, objectServer.type);
    }

}