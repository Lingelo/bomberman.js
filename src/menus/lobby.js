import {Menu} from "./menu";
import {GameStatus} from "../game/geme-status";

export class Lobby extends Menu {
    constructor() {
        super();
        this.code = "LOBBY";
        this.gameStatus = null;
        this.characters = [];
        document.addEventListener('state', (state) => {
            this.gameStatus = state.detail.gameStatus;
            this.characters = state.detail.characters;
        });
    }

    render(canvasContext) {
        super.render(canvasContext);

        canvasContext.ctx.font = 35 + "px Bomberman";

        let cpt = 0;
        for (let i = 0; i < 4; i++) {
            const label = this.characters[i] ? `Player ${i + 1} : Ready` : '. . .';
            canvasContext.ctx.fillText( label, canvasContext.screenWidth / 2, 300 + cpt);
            cpt = cpt + 40;
        }

        canvasContext.ctx.fillStyle = this.gameStatus === GameStatus.READY ? "yellow" : "rgb(250, 250, 250)";
        canvasContext.ctx.fillText(this.gameStatus === GameStatus.READY ? "Go !" : "Wait ...", canvasContext.screenWidth / 2, 540);
    }

}