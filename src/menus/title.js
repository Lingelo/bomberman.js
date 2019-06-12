import {Menu} from "./menu";

export class Title extends Menu {

    constructor() {
        super();
        this.code = "TITLE";
        document.addEventListener('state', (state) => {
            this.manageOverflowMenu(1, 3, state.detail.selectedOption);
        });

    }

    render(canvasContext) {
        super.render(canvasContext);
        canvasContext.ctx.font = 60 + "px Bomberman";
        canvasContext.ctx.fillStyle = this.getColorMenu("New Game");
        canvasContext.ctx.fillText("New Game", canvasContext.screenWidth / 2, 320);
        canvasContext.ctx.fillStyle = this.getColorMenu("Scores");
        canvasContext.ctx.fillText("Scores", canvasContext.screenWidth / 2, 390);
        canvasContext.ctx.fillStyle = this.getColorMenu("Options");
        canvasContext.ctx.fillText("Options", canvasContext.screenWidth / 2, 460);

    }

    getColorMenu(menu) {

        if (menu === "New Game" && this.selectedOption === 1
            || menu === "Scores" && this.selectedOption === 2
            || menu === "Options" && this.selectedOption === 3) {
            return "yellow";
        } else {
            return "rgb(250, 250, 250)"
        }

    }

    getColorMenu(menu) {

        if (menu === "New Game" && this.selectedOption === 1
            || menu === "Scores" && this.selectedOption === 2
            || menu === "Options" && this.selectedOption === 3) {
            return "yellow";
        } else {
            return "rgb(250, 250, 250)"
        }

    }
}