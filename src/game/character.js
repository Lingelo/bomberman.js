import {DIRECTION} from "./direction";
import {Sprite} from "../utils/sprite";
import {CharacterStatus} from "./character-status";
import {Action} from "../state/actions";

export class Character {

    constructor(color, x, y, direction, gamePadIndex) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.animationState = -1;
        this.color = color;
        this.radius = 2;
        this.status = CharacterStatus.ALIVE;
        this.offsetX = 0;
        this.offsetY = 0;
        this.animationDuration = 15;
        this.bombMax = 1;
        this.bombUsed = 0;
        this.pixelsToTreat = 0;
        this.gamePadIndex = gamePadIndex;
        this.nextFrame = this.getNextFrame(direction);
        document.addEventListener('state', (state) => {
            this.bonus = state.detail.bonus;
            const player = state.detail.characters.find(character => character.color === state.detail.currentPlayerColor);
            if(player) {
                this.radius = player.radius;
                this.animationDuration = player.animationDuration;
                this.bombMax = player.bombMax;
            }

        });
    }


    render(canvasContext) {

        switch (this.status) {
            case CharacterStatus.ALIVE:
                this.renderAlive(canvasContext);
                break;
            case CharacterStatus.DEAD:
                this.renderDead(canvasContext);
                break;
            case CharacterStatus.VICTORIOUS:
                this.renderVictory(canvasContext);
                break;
        }
    }

    renderAlive(canvasContext) {
        let frame = 1;
        if (this.animationState >= this.animationDuration) {
            this.animationState = -1;
        } else if (this.animationState >= 0) {
            frame = Math.floor(this.animationState / 8);
            if (frame > 3) {
                frame %= 4;
            }

            this.pixelsToTreat = 32 - (32 * (this.animationState / this.animationDuration));

            if (this.pixelsToTreat < 32 / 2) {
                this.x = this.nextFrame.x;
                this.y = this.nextFrame.y;
            }

            if (this.direction === DIRECTION.TOP) {
                this.offsetY = this.pixelsToTreat;
            } else if (this.direction === DIRECTION.DOWN) {
                this.offsetY = -this.pixelsToTreat;
            } else if (this.direction === DIRECTION.LEFT) {
                this.offsetX = this.pixelsToTreat;
            } else if (this.direction === DIRECTION.RIGHT) {
                this.offsetX = -this.pixelsToTreat;
            }

            this.animationState++;
        }

        const getNextImageFrame = () => {
            switch (frame) {
                case 0 :
                    return 1;
                case 1 :
                    return 0;
                case 2 :
                    return -1;
                case 3 :
                    return 0;

            }
        };

        let targetX;
        let targetY;
        if (this.animationState !== -1) {
            targetX = this.nextFrame.x * 32 + this.offsetX;
            targetY = this.nextFrame.y * 32 - 8 + this.offsetY;
        } else {
            targetX = this.x * 32 + this.offsetX;
            targetY = this.y * 32 - 8 + this.offsetY;
        }
        canvasContext.ctx.drawImage(
            Sprite.characterAlive(),
            Sprite.characterAlive().width * (getNextImageFrame() + this.direction),
            Sprite.characterAlive().height * this.color,
            Sprite.characterAlive().width,
            Sprite.characterAlive().height,
            targetX,
            targetY,
            32,
            32
        );
    }

    getNextFrame(direction) {
        let coord = {x: this.x, y: this.y};
        switch (direction) {
            case DIRECTION.DOWN :
                coord.y++;
                break;
            case DIRECTION.LEFT :
                coord.x--;
                break;
            case DIRECTION.RIGHT :
                coord.x++;
                break;
            case DIRECTION.TOP :
                coord.y--;
                break;
        }
        return coord;
    }

    move(direction, state) {
        if (this.animationState >= 0)
            return;

        if (!direction) {
            return;
        }

        this.direction = direction;

        this.nextFrame = this.getNextFrame(direction);

        if (this.nextFrame.x < 0 || this.nextFrame.y < 0 ||
            this.nextFrame.x >= state.map[0].length || this.nextFrame.y >= state.map.length) {
            return;
        }

        if (state.map[this.nextFrame.y][this.nextFrame.x] !== 2) {
            return;
        }

        if (state.walls[this.nextFrame.x][this.nextFrame.y] && !state.walls[this.nextFrame.x][this.nextFrame.y].destroyed) {
            return;
        }


        this.bonus.forEach(bonus => {
            if (bonus.x === this.nextFrame.x && bonus.y === this.nextFrame.y) {
                document.dispatchEvent(new CustomEvent('action', {
                    detail: {
                        type: Action.GET_BONUS,
                        payload: {
                            bonus: bonus,
                            playerColor: this.color
                        }
                    }
                }));
            }
        });

        for (let bomb in state.bombs) {
            if (state.bombs[bomb].x === this.nextFrame.x && state.bombs[bomb].y === this.nextFrame.y) {
                return;
            }
        }

        this.animationState = 1;

    }

    renderDead(canvasContext) {

        if (this.status === CharacterStatus.ALIVE) {
            this.status = CharacterStatus.DEAD;
            this.animationState = 0;
        }

        canvasContext.ctx.drawImage(
            Sprite.characterDead(),
            Sprite.characterDead().width * Math.floor(this.animationState / 10),
            Sprite.characterDead().height * this.color,
            Sprite.characterDead().width,
            Sprite.characterDead().height,
            this.x * 32,
            this.y * 32,
            32,
            32
        );

        this.animationState++;

    }

    renderVictory(canvasContext) {

        let frame = Math.floor(this.animationState / this.animationDuration);

        let image = 1;
        if(frame % 2 === 0) {
            image = 0
        } else {
            image = 1;
        }

        canvasContext.ctx.drawImage(
            Sprite.characterVictory(),
            Sprite.characterVictory().width * image,
            Sprite.characterVictory().height * this.color,
            Sprite.characterVictory().width,
            Sprite.characterVictory().height,
            this.x * 32,
            this.y * 32,
            32,
            32
        );
        this.animationState++;
    }
}