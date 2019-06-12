import {Sprite} from "../utils/sprite";
import {Action} from "../state/actions";
import {GameStatus} from "../game/geme-status";

export class Menu {

    constructor() {
        this.imageTitlePosition = 800;
        this.fontSize = 30;
        this.selectedOption = 1;
    }

    update(canvasContext) {
        this.render(canvasContext);
    }

    render(canvasContext) {
        canvasContext.ctx.fillStyle = "rgb(52,173,98)";
        canvasContext.ctx.fillRect(0, 400, canvasContext.screenWidth, canvasContext.screenHeight);
        canvasContext.ctx.fillStyle = "lightblue";
        canvasContext.ctx.fillRect(0, 0, canvasContext.screenWidth, 400);

        if (this.imageTitlePosition > 170) {
            this.imageTitlePosition -= 15;
        }

        canvasContext.ctx.drawImage(Sprite.titleWallpaper(), 0, this.imageTitlePosition + 5, canvasContext.screenWidth, canvasContext.screenHeight - 160);

        if (this.fontSize < 90) {
            this.fontSize++;
        }

        canvasContext.ctx.font = this.fontSize + "px Bomberman";
        canvasContext.ctx.textAlign = "center";
        canvasContext.ctx.textBaseline = "top";
        canvasContext.ctx.fillStyle = "gray";
        canvasContext.ctx.fillText("Bomberman.js", (canvasContext.screenWidth / 2) + 5, 80 + 5);
        canvasContext.ctx.fillStyle = "rgb(250, 250, 250)";
        canvasContext.ctx.fillText("Bomberman.js", (canvasContext.screenWidth / 2), 80);

        canvasContext.ctx.font = "20px Bomberman";
        canvasContext.ctx.fillStyle = "rgb(250, 250, 250)";
        canvasContext.ctx.textAlign = "center";
        canvasContext.ctx.textBaseline = "center";
        canvasContext.ctx.fillText("Credit : Freuhlon", (canvasContext.screenWidth / 2), this.imageTitlePosition + 440);


    }

    manageOverflowMenu(minSelectableOption, maxSelectableOption, selectedOption) {
        this.selectedOption = selectedOption;
        if (selectedOption > maxSelectableOption) {
            this.selectedOption = maxSelectableOption;
            document.dispatchEvent(new CustomEvent('action', {
                detail: {
                    type: Action.MENU_OVERFLOW,
                    payload: {selectedOption: this.selectedOption}
                }
            }));
        }
        if (selectedOption < minSelectableOption) {
            this.selectedOption = minSelectableOption;
            document.dispatchEvent(new CustomEvent('action', {
                detail: {
                    type: Action.MENU_OVERFLOW,
                    payload: {selectedOption: this.selectedOption}
                }
            }));
        }
    }

    static getNewScreen(selectionOption, currentScreen, gameStatus) {
        if (currentScreen === "TITLE") {
            if (selectionOption === 1) {
                return "LOBBY";
            } else if (selectionOption === 2) {
                return "SCORES";
            } else if (selectionOption === 3) {
                return "OPTIONS"
            }
        }
        if (currentScreen === "OPTIONS") {
            return "TITLE";
        }
        if (currentScreen === "SCORES") {
            return "TITLE";
        }
        if (currentScreen === "LOBBY" && gameStatus === GameStatus.READY) {
            return "NEW_GAME";
        }
    }

}