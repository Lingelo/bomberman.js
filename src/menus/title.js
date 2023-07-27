import {Menu} from "./menu";
import {GAMESTATUS} from "../game/geme-status";
import {getState, subscribe} from "../state/redux";

export class Title extends Menu {

    constructor() {
        super();
        this.code = "TITLE";
        this.ready = false;

        subscribe(()=> {
            this.manageOverflowMenu(1, 2, getState().selectedOption);
            this.ready = getState().gameStatus === GAMESTATUS.READY;
        });

    }

    render(canvasContext) {
        super.render(canvasContext);
        canvasContext.ctx.font = 60 + "px Bomberman";
        canvasContext.ctx.fillStyle = this.getColorMenu("New Game");
        canvasContext.ctx.fillText("New Game", canvasContext.screenWidth / 2, 330);
        canvasContext.ctx.fillStyle = this.getColorMenu("Options");
        canvasContext.ctx.fillText("Options", canvasContext.screenWidth / 2, 420);
    }

    getColorMenu(menu) {

        if (menu === "New Game" && this.selectedOption === 1 && this.ready) {
            return "yellow";
        } else if(menu === "New Game" && this.selectedOption === 1 && !this.ready) {
            return "rgb(169,169,169)";
        } else if (menu === "Options" && this.selectedOption === 2) {
            return "yellow";
        } else {
            return "rgb(250, 250, 250)"
        }

    }

}
