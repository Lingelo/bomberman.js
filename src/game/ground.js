import {Sprite} from "../utils/sprite";

export class Ground {
    constructor(canvasContext) {
        this.canvasContext = canvasContext;
    }

    render(x, y) {
        this.canvasContext.ctx.drawImage(Sprite.ground(), 0, 0, 32, 32, 32 * y, 32 * x, 32, 32);
    }

}