import {Flame} from "./flame";
import {CARDINAL} from "./cardinal";
import {Action} from "../state/actions";
import {CharacterStatus} from "./character-status";
import {dispatch} from "../state/redux";

export class Blast {
    constructor(bomb, character, map, walls, bombs, characters, bonus) {
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
        this.character = character;
        this.canPropagate = {north: true, east: true, south: true, west: true};
        this.bonus = bonus;
    }

    render(canvasContext) {
        let radius = this.radius;
        this.animationState++;

        if (this.time++ > this.timer) {
            const currentBlast = this;

            dispatch({type: Action.BLAST_VANISHED, payload: {payload: {blast: currentBlast}}});

        }

        let power = this.computePower();

        if (this.animationState <= this.radius) {
            radius = this.animationState;
        }

        this.flames.push(new Flame(this.x, this.y, power, CARDINAL.MIDDLE));

        this.computeNorth(radius, power, this.canPropagate.north);
        this.computeEast(radius, power, this.canPropagate.east);
        this.computeSouth(radius, power, this.canPropagate.south);
        this.computeWest(radius, power, this.canPropagate.west);

        this.flames.forEach(flame => {
            flame.render(canvasContext);

            this.bombs.forEach(function (bomb) {
                if (bomb.x === flame.x && bomb.y === flame.y) {

                    dispatch({
                        type: Action.ADD_BLAST,
                        payload: {bomb, character : bomb.character}
                    });

                    dispatch({
                        type: Action.BOMB_EXPLODED,
                        payload: {bomb: bomb}
                    });
                }
            });

            this.bonus.forEach(item => {
                if(item.x === flame.x && item.y === flame.y) {
                    dispatch({
                        type: Action.BONUS_EXPLODED,
                        payload: {item}
                    });
                }
            });

            this.characters.forEach(character => {
                if (character.x === flame.x && character.y === flame.y && character.status === CharacterStatus.ALIVE) {
                    dispatch({
                        type: Action.KILL,
                        payload: {character: character}
                    });
                }
            });

        });
    }

    computeNorth(radius, power) {
        let indexBlastNorth = 1;
        while (indexBlastNorth < this.radius) {

            const canPropagate =
                this.map[this.y - indexBlastNorth][this.x] === 2 && this.canPropagate.north;
            const canVanish = this.walls[this.x][this.y - indexBlastNorth] && !this.walls[this.x][this.y - indexBlastNorth].destroyed;

            if (!canPropagate) {
                break;
            } else if (canVanish && canPropagate) {
                this.canPropagate.north = false;
                this.flames.push(new Flame(this.x, this.y - indexBlastNorth, power, CARDINAL.NORTH_END));
                dispatch({
                    type: Action.DESTROY,
                    payload: {destroyedX: this.x, destroyedY: this.y - 1}
                });

            } else if (!canVanish && canPropagate) {
                if ((indexBlastNorth + 1) === this.radius) {
                    this.flames.push(new Flame(this.x, this.y - indexBlastNorth, power, CARDINAL.NORTH_END));
                } else {
                    this.flames.push(new Flame(this.x, this.y - indexBlastNorth, power, CARDINAL.NORTH_MIDDLE));
                }
            }
            indexBlastNorth++;

        }
    }

    computeEast(radius, power) {
        let indexBlastEast = 1;
        while (indexBlastEast < this.radius) {

            const canPropagate =
                this.map[this.y][this.x + indexBlastEast] === 2 && this.canPropagate.east;
            const canVanish = this.walls[this.x + indexBlastEast][this.y] && !this.walls[this.x + indexBlastEast][this.y].destroyed;

            if (!canPropagate) {
                break;
            } else if (canPropagate && canVanish) {
                this.canPropagate.east = false;
                this.flames.push(new Flame(this.x + indexBlastEast, this.y, power, CARDINAL.EAST_END));
                dispatch({
                    type: Action.DESTROY,
                    payload: {destroyedX: this.x + indexBlastEast, destroyedY: this.y}
                });


            } else if (canPropagate && !canVanish) {
                if ((indexBlastEast + 1) === this.radius) {
                    this.flames.push(new Flame(this.x + indexBlastEast, this.y, power, CARDINAL.EAST_END));
                } else {
                    this.flames.push(new Flame(this.x + indexBlastEast, this.y, power, CARDINAL.EAST_MIDDLE));
                }
            }
            indexBlastEast++;

        }
    }

    computeSouth(radius, power) {
        let indexBlastSouth = 1;
        while (indexBlastSouth < this.radius) {

            const canPropagate =
                this.map[this.y + indexBlastSouth][this.x] === 2 && this.canPropagate.south;
            const canVanish = this.walls[this.x][this.y + indexBlastSouth] && !this.walls[this.x][this.y + indexBlastSouth].destroyed;

            if (!canPropagate) {
                break;
            } else if (canPropagate && canVanish) {
                this.canPropagate.south = false;
                this.flames.push(new Flame(this.x, this.y + indexBlastSouth, power, CARDINAL.SOUTH_END));

                dispatch({
                    type: Action.DESTROY,
                    payload: {destroyedX: this.x, destroyedY: this.y + indexBlastSouth}
                });

            } else if (canPropagate && !canVanish) {
                if ((indexBlastSouth + 1) === this.radius) {
                    this.flames.push(new Flame(this.x, this.y + indexBlastSouth, power, CARDINAL.SOUTH_END));
                } else {
                    this.flames.push(new Flame(this.x, this.y + indexBlastSouth, power, CARDINAL.SOUTH_MIDDLE));
                }
            }
            indexBlastSouth++;

        }
    }

    computeWest(radius, power) {

        let indexBlastWest = 1;
        while (indexBlastWest < this.radius) {

            const canPropagate =
                this.map[this.y][this.x - indexBlastWest] === 2 && this.canPropagate.west;
            const canVanish = this.walls[this.x - indexBlastWest][this.y] && !this.walls[this.x - indexBlastWest][this.y].destroyed;

            if (!canPropagate) {
                break;
            } else if (canPropagate && canVanish) {
                this.canPropagate.west = false;
                this.flames.push(new Flame(this.x - indexBlastWest, this.y, power, CARDINAL.WEST_END));

                dispatch({
                    type: Action.DESTROY,
                    payload: {destroyedX: this.x - indexBlastWest, destroyedY: this.y}
                });

            } else if (canPropagate && !canVanish) {
                if ((indexBlastWest + 1) === this.radius) {
                    this.flames.push(new Flame(this.x - indexBlastWest, this.y, power, CARDINAL.WEST_END));
                } else {
                    this.flames.push(new Flame(this.x - indexBlastWest, this.y, power, CARDINAL.WEST_MIDDLE));
                }
            }
            indexBlastWest++;

        }
    }

    computePower() {
        let power = 0;
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
        return power;
    }
}