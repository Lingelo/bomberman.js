import {Sprite} from "../utils/sprite";
import {Action} from "../state/actions";
import {COLOR} from "../game/color";
import {GAMESTATUS} from "../game/geme-status";
import {dispatch, getState, subscribe} from "../state/redux";

export class Menu {

    constructor() {
        this.imageTitlePosition = 800;
        this.fontSize = 30;
        this.selectedOption = 1;
        this.playersDilayed = [];

        subscribe( ()=> {
            this.playersDilayed = getState().characters;
        });
    }

    update(canvasContext) {
        this.render(canvasContext);
    }

    render(canvasContext) {
        canvasContext.ctx.fillStyle = "rgb(52,173,98)";
        canvasContext.ctx.fillRect(0, 400, canvasContext.screenWidth, canvasContext.screenHeight);
        canvasContext.ctx.fillStyle = "lightblue";
        canvasContext.ctx.fillRect(0, 0, canvasContext.screenWidth, 400);


        if(this.playersDilayed && this.playersDilayed.length === 0) {
            canvasContext.ctx.font = "20px Bomberman";
            canvasContext.ctx.textAlign = "center";
            canvasContext.ctx.textBaseline = "top";
            canvasContext.ctx.fillStyle = "red";
            canvasContext.ctx.fillText("Connect 2 controllers", (canvasContext.screenWidth / 2) + 5, 20);
        } else {
            let offset = 100;
            canvasContext.ctx.font = "25px Bomberman";
            canvasContext.ctx.textAlign = "center";
            canvasContext.ctx.textBaseline = "top";
            canvasContext.ctx.fillStyle = "red";

            this.playersDilayed.forEach( (player, index) => {
                if(index === COLOR.WHITE) {
                    canvasContext.ctx.fillStyle = "white";
                }
                if(index === COLOR.BLACK) {
                    canvasContext.ctx.fillStyle = "black";
                }
                if(index === COLOR.RED) {
                    canvasContext.ctx.fillStyle = "red";
                }
                if(index === COLOR.BLUE) {
                    canvasContext.ctx.fillStyle = "blue";
                }
                canvasContext.ctx.fillText("Player " + (index + 1), 100 + offset, 20);
                offset = offset + 200;
            });
        }

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

            dispatch({
                type: Action.MENU_OVERFLOW,
                payload: {selectedOption: this.selectedOption}
            });
        }
        if (selectedOption < minSelectableOption) {
            this.selectedOption = minSelectableOption;

            dispatch({
                type: Action.MENU_OVERFLOW,
                payload: {selectedOption: this.selectedOption}
            });
        }
    }

    static getNewScreen(selectionOption, currentScreen, gameStatus) {
        if (currentScreen === "TITLE") {
            if (selectionOption === 1 && gameStatus === GAMESTATUS.READY) {
                return "NEW_GAME";
            } else if (selectionOption === 2) {
                return "OPTIONS"
            }
        }
        if (currentScreen === "OPTIONS") {
            return "TITLE";
        }
    }

}