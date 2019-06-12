import {Flame} from "./flame";
import {CARDINAL} from "./cardinal";
import {Action} from "../state/actions";

export class Blast {
    constructor(bomb, character, map, walls, bombs, characters) {
        this.walls = walls;
        this.map = map;
        this.x = bomb.x;
        this.y = bomb.y;
        this.animationState = 0;
        this.time = 0;
        this.radius = character.radius;
        this.timer = 20;
        this.flames = [];
        this.bombs = bombs;
        this.characters = characters;
        this.cpt = -1;
        this.character = character;

    }

    render(canvasContext) {
        let radius = this.radius;
        this.animationState++;
        this.cpt++;
        this.flames.push([]);


        if (this.time++ > this.timer) {
            const currentBlast = this;
            document.dispatchEvent(new CustomEvent('action', {
                detail: {
                    type: Action.BLAST_VANISHED,
                    payload: {blast: currentBlast}
                }
            }));
        }

        let power;
        switch (this.radius) {
            case 1 :
                power = 0;
                break;
            case 2 :
                power = 0;
                break;
            case 3 :
                power = 1;
                break;
            case 4 :
                power = 1;
                break;
            case 5 :
                power = 2;
                break;
            case 6 :
                power = 2;
                break;
        }

        if (this.animationState <= this.radius) {
            radius = this.animationState;
        }

        this.flames[this.cpt].push(new Flame(this.x, this.y, power, CARDINAL.MIDDLE));

        for (let i = 1, l = radius; i <= l; i++) {
            if (this.map[this.y - i][this.x] !== 2) {
                i = radius + 1;
            } else {
                if (this.walls[this.x][this.y - i]) {
                    this.flames[this.cpt].push(new Flame(this.x, this.y - i, power, CARDINAL.NORTH_END));

                    if (!this.walls[this.x][this.y - i].destroyed) {
                        document.dispatchEvent(new CustomEvent('action', {
                            detail: {
                                type: Action.DESTROY,
                                payload: {destroyedX: this.x, destroyedY: this.y - 1}
                            }
                        }));
                    }

                    i = radius + 1;
                } else {
                    if (i === l || this.map[this.y - i - 1][this.x] !== 2) {
                        this.flames[this.cpt].push(new Flame(this.x, this.y - i, power, CARDINAL.NORTH_END));
                    } else {
                        this.flames[this.cpt].push(new Flame(this.x, this.y - i, power, CARDINAL.NORTH_MIDDLE));
                    }
                }
            }
        }

        for (let i = 1, l = radius; i <= l; i++) {
            if (this.map[this.y][this.x + i] !== 2) {

                i = radius + 1;
            } else {
                if (this.walls[this.x + i][this.y]) {
                    this.flames[this.cpt].push(new Flame(this.x + i, this.y, power, CARDINAL.EAST_END));

                    if (!this.walls[this.x + i][this.y].destroyed) {
                        document.dispatchEvent(new CustomEvent('action', {
                            detail: {
                                type: Action.DESTROY,
                                payload: {destroyedX: this.x + i, destroyedY: this.y}
                            }
                        }));
                    }

                    i = radius + 1;
                } else {
                    if (i === l || this.map[this.y][this.x + i + 1] !== 2) {
                        this.flames[this.cpt].push(new Flame(this.x + i, this.y, power, CARDINAL.EAST_END));
                    } else {
                        this.flames[this.cpt].push(new Flame(this.x + i, this.y, power, CARDINAL.EAST_MIDDLE));
                    }
                }
            }
        }

        for (let i = 1, l = radius; i <= l; i++) {
            if (this.map[this.y + i][this.x] !== 2) {
                i = radius + 1;
            } else {
                if (this.walls[this.x][this.y + i]) {
                    this.flames[this.cpt].push(new Flame(this.x, this.y + i, power, CARDINAL.SOUTH_END));

                    if (!this.walls[this.x][this.y + i].destroyed) {
                        document.dispatchEvent(new CustomEvent('action', {
                            detail: {
                                type: Action.DESTROY,
                                payload: {destroyedX: this.x, destroyedY: this.y + i}
                            }
                        }));
                    }

                    i = radius + 1;
                } else {
                    if (i === l || this.map[this.y + i + 1][this.x] !== 2) {
                        this.flames[this.cpt].push(new Flame(this.x, this.y + i, power, CARDINAL.SOUTH_END));
                    } else {
                        this.flames[this.cpt].push(new Flame(this.x, this.y + i, power, CARDINAL.SOUTH_MIDDLE));
                    }
                }
            }
        }

        for (let i = 1, l = radius; i <= l; i++) {
            if (this.map[this.y][this.x - i] !== 2) {

                i = radius + 1;
            } else {
                if (this.walls[this.x - i][this.y]) {
                    this.flames[this.cpt].push(new Flame(this.x - i, this.y, power, CARDINAL.WEST_END));

                    if (!this.walls[this.x - i][this.y].destroyed) {
                        document.dispatchEvent(new CustomEvent('action', {
                            detail: {
                                type: Action.DESTROY,
                                payload: {destroyedX: this.x - i, destroyedY: this.y}
                            }
                        }));
                    }

                    i = radius + 1;
                } else {
                    if (i === l || this.map[this.y][this.x - i - 1] !== 2) {
                        this.flames[this.cpt].push(new Flame(this.x - i, this.y, power, CARDINAL.WEST_END));
                    } else {
                        this.flames[this.cpt].push(new Flame(this.x - i, this.y, power, CARDINAL.WEST_MIDDLE));
                    }
                }
            }
        }

        if (this.flames[this.cpt]) {
            for (let i = 0, l = this.flames[this.cpt].length; i < l; i++) {
                const flame = this.flames[this.cpt][i];
                const character = this.character;
                flame.render(canvasContext);

                this.bombs.forEach(function (bomb) {
                    if (bomb.x === flame.x && bomb.y === flame.y) {
                        document.dispatchEvent(new CustomEvent('action', {
                            detail: {
                                type: Action.ADD_BLAST,
                                payload: {bomb: bomb, character: character}
                            }
                        }));

                        document.dispatchEvent(new CustomEvent('action', {
                            detail: {
                                type: Action.BOMB_EXPLODED,
                                payload: {bomb: bomb}
                            }
                        }));
                    }
                });
                this.characters.forEach(function (character) {
                    if (character.x === flame.x && character.y === flame.y) {
                        document.dispatchEvent(new CustomEvent('action', {
                            detail: {
                                type: Action.KILL,
                                payload: {character: character}
                            }
                        }));
                    }
                });

            }
        }
    }
}