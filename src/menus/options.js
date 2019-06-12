import {Menu} from "./menu";

export class Options extends Menu {
    constructor() {
        super();
        this.code = "OPTIONS";
        document.addEventListener('state', (state) => {
            this.manageOverflowMenu(1, 4, state.detail.selectedOption);
        });
    }

    render(canvasContext) {
        super.render(canvasContext);

        canvasContext.ctx.font = 50 + "px Bomberman";
        canvasContext.ctx.fillStyle = this.getColorMenu("Sound");
        canvasContext.ctx.fillText(" Sound : yes", canvasContext.screenWidth / 2, 250);
        canvasContext.ctx.fillStyle = this.getColorMenu("Nickname");
        canvasContext.ctx.fillText(" Nickname : Freuhlon", canvasContext.screenWidth / 2, 320);
        canvasContext.ctx.fillStyle = this.getColorMenu("Color");
        canvasContext.ctx.fillText(" Color : red", canvasContext.screenWidth / 2, 390);
        canvasContext.ctx.fillStyle = this.getColorMenu("Retour");
        canvasContext.ctx.fillText("Retour", canvasContext.screenWidth / 2, 540);
    }

    getColorMenu(menu) {

        if (menu === "Sound" && this.selectedOption === 1
            || menu === "Nickname" && this.selectedOption === 2
            || menu === "Color" && this.selectedOption === 3
            || menu === "Retour" && this.selectedOption === 4) {
            return "yellow";
        } else {
            return "rgb(250, 250, 250)"
        }

    }
}