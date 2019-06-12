import {Sprite} from "../utils/sprite";

export class Block {
    constructor(canvasContext) {
        this.canvasContext = canvasContext;
    }

    render(x, y) {
        this.canvasContext.ctx.drawImage(Sprite.ground(), 32, 64, 32, 32, 32 * y , 32 * x , 32, 32);
    }
}