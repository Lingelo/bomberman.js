import {Menu} from "./menu";

export class Scores extends Menu {
    constructor() {
        super();
        this.code = "SCORES";
    }

    render(canvasContext) {
        super.render(canvasContext);
        canvasContext.ctx.font = 60 + "px Bomberman";
        canvasContext.ctx.fillStyle = "yellow";
        canvasContext.ctx.fillText("Retour", canvasContext.screenWidth / 2, 540);
    }


}