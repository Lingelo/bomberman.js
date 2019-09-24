import {Ground} from "./ground";
import {Board} from "./board";
import {Block} from "./block";
import {CharacterStatus} from "./character-status";
import {Action} from "../state/actions";
import {dispatch, getState, subscribe} from "../state/redux";

export class Game {
    constructor(map, walls, characters, bonus) {
        this.map = map;
        this.characters = characters;
        this.walls = walls;
        this.bonus = bonus;
        this.bombs = [];
        this.blasts = [];
        this.code = "NEW_GAME";

        subscribe(()=> {
            this.walls = getState().walls;
            this.characters = getState().characters;
            this.bonus = getState().bonus;
            this.bombs = getState().bombs;
            this.blasts = getState().blasts;
            this.map = getState().map;
        });
    }

    update(canvasContext) {
        this.render(canvasContext);
    }

    render(canvasContext) {

        const canvas = document.getElementById('canvas');
        canvas.width = this.map[0] && this.map[0].length * 32;
        canvas.height = this.map.length * 32;

        canvasContext.screenWidth = canvas.width;
        canvasContext.screenHeight = canvas.height;

        canvasContext.ctx.fillStyle = "black";
        canvasContext.ctx.fillRect(0, 0, canvasContext.screenWidth, canvasContext.screenHeight);

        this.ground = new Ground(canvasContext);
        this.frameUpLeft = new Board("UP_LEFT", canvasContext);
        this.frameUpRight = new Board("UP_RIGHT", canvasContext);
        this.frameUp = new Board("UP", canvasContext);
        this.frameBottomLeft = new Board("BOTTOM_LEFT", canvasContext);
        this.frameBottomRight = new Board("BOTTOM_RIGHT", canvasContext);
        this.frameBottom = new Board("BOTTOM", canvasContext);
        this.frameLeft = new Board("LEFT", canvasContext);
        this.frameRight = new Board("RIGHT", canvasContext);
        this.block = new Block(canvasContext);

        for (let x = 0, l = this.map.length; x < l; x++) {
            for (let y = 0, k = this.map[x].length; y < k; y++) {
                switch (this.map[x][y]) {
                    case 2:
                        this.ground.render(x, y);
                        break;
                    case 12:
                        this.frameUpLeft.render(x, y);
                        break;
                    case 14:
                        this.frameUp.render(x, y);
                        break;
                    case 16:
                        this.frameUpRight.render(x, y);
                        break;
                    case 8:
                        this.frameBottomLeft.render(x, y);
                        break;
                    case 4:
                        this.frameBottomRight.render(x, y);
                        break;
                    case 6:
                        this.frameBottom.render(x, y);
                        break;
                    case 11:
                        this.frameLeft.render(x, y);
                        break;
                    case 9:
                        this.frameRight.render(x, y);
                        break;
                    case 10:
                        this.block.render(x, y);
                }

            }
        }

        this.bonus.forEach(bonus => {
            bonus.render(canvasContext);
        });

        for (let i = 0, l = this.walls.length; i < l; i++) {
            for (let j = 0, m = this.walls[i].length; j < m; j++) {
                if (this.walls[i][j]) {
                    this.walls[i][j].render(canvasContext);
                }
            }
        }

        this.bombs.forEach(bomb => {
            bomb.render(canvasContext);
        });

        this.blasts.forEach(blast => {
            blast.render(canvasContext);
        });

        this.characters.forEach(character => {
            character.render(canvasContext);
        });

        this.computeVictory(this.characters)

    }

    computeVictory(characters) {

        const aliveCharacters = this.characters.filter(character => character.status === CharacterStatus.ALIVE);
        if (aliveCharacters.length === 1 && aliveCharacters[0].status !== CharacterStatus.VICTORY) {

            dispatch({
                type: Action.VICTORY, payload: {
                    character: aliveCharacters[0]
                }
            });
        }
    }
}