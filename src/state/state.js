import {DIRECTION} from "../game/direction";
import {Bomb} from "../game/bomb";
import {Blast} from "../game/blast";
import {CharacterStatus} from "../game/character-status";
import {Menu} from "../menus/menu";
import {Action} from "./actions";
import {MultiPlayer} from "../multi/multi-player";
import {GameStatus} from "../game/geme-status";
import {BonusTypes} from "../game/bonus-types";

export class State {

    constructor() {
        this.initialState();
        this.connection = null;
    }

    initialState() {
        this.state = {
            gameStatus: "INITIALISATION",
            selectedOption: 1,
            currentScreenCode: "TITLE",
            map: [],
            currentPlayerColor: 0,
            characters: [],
            bonus: [],
            bombs: [],
            walls: [],
            blasts: []
        };
    }

    createStore() {
        const that = this;
        document.addEventListener('action', function (e) {
            that.state = that.reducer(that.state, e.detail);
            document.dispatchEvent(new CustomEvent('state', {detail: that.state}));
        }, false);

    }

    reducer(state, action) {
        if (!state) {
            return this.initialState();
        }

        switch (action.type) {
            case Action.UP:
                if (this.connection && state.gameStatus === GameStatus.IN_PROGRESS) {
                    state.characters.find(character => character.color === state.currentPlayerColor).move(DIRECTION.TOP, state);
                    this.connection.move(state.currentPlayerColor, DIRECTION.TOP);
                }
                return {
                    ...state,
                    selectedOption: state.selectedOption - 1
                };
            case Action.DOWN:
                if (this.connection && state.gameStatus === GameStatus.IN_PROGRESS) {
                    state.characters.find(character => character.color === state.currentPlayerColor).move(DIRECTION.DOWN, state);
                    this.connection.move(state.currentPlayerColor, DIRECTION.DOWN);
                }
                return {
                    ...state,
                    selectedOption: state.selectedOption + 1
                };
            case Action.LEFT: {
                if (this.connection && state.gameStatus === GameStatus.IN_PROGRESS) {
                    state.characters.find(character => character.color === state.currentPlayerColor).move(DIRECTION.LEFT, state);
                    this.connection.move(state.currentPlayerColor, DIRECTION.LEFT);
                }
                return state;
            }
            case Action.RIGHT: {
                if (this.connection && state.gameStatus === GameStatus.IN_PROGRESS) {
                    state.characters.find(character => character.color === state.currentPlayerColor).move(DIRECTION.RIGHT, state);
                    this.connection.move(state.currentPlayerColor, DIRECTION.RIGHT);
                }
                return state;
            }
            case Action.ENTER:
                let newScreen = Menu.getNewScreen(state.selectedOption, state.currentScreenCode, state.gameStatus);
                if (this.connection && state.gameStatus !== GameStatus.IN_PROGRESS) {
                    this.connection.launch();
                }

                return {
                    ...state,
                    selectedOption: 1,
                    currentScreenCode: newScreen
                };
            case Action.MENU_OVERFLOW: {
                return {
                    ...state,
                    selectedOption: action.payload.selectedOption
                }
            }
            case Action.INIT:
                return {
                    ...state,
                    map: action.payload.map,
                    walls: action.payload.walls,
                    bonus: action.payload.bonus,
                };
            case Action.INIT_CHARACTERS:
                state.characters = action.payload.characters;
                return {
                    ...state
                };
            case Action.PLAYER_CHOSEN:
                return {
                    ...state,
                    currentPlayerColor: action.payload.currentPlayerColor
                };
            case Action.CONNECT:
                this.connection = new MultiPlayer();
                return {
                    ...state,
                    selectedOption: 1,
                };
            case Action.RESET: {
                setTimeout(function () {
                    location.reload()
                }, 100);
                if (this.connection) {
                    this.connection.leave();
                }
                return this.state;
            }
            case Action.ADD_BLAST:
                state.blasts.push(new Blast(action.payload.bomb, action.payload.character, state.map, state.walls, state.bombs, state.characters));
                return {
                    ...state,
                };
            case Action.BLAST_VANISHED:
                state.blasts.splice(state.blasts.indexOf(action.payload.blast), 1);
                return {
                    ...state
                };
            case Action.DROP_BOMB:
                const bombUsed = state.characters.find(character => character.color === action.payload.currentPlayerColor).bombUsed;
                const bombMax = state.characters.find(character => character.color === action.payload.currentPlayerColor).bombMax;
                if (bombUsed <= bombMax) {
                    if (this.connection && state.gameStatus === GameStatus.IN_PROGRESS) {
                        this.connection.dropBomb(state.currentPlayerColor);
                    }
                    state.characters.find(character => character.color === action.payload.currentPlayerColor).bombUsed++;
                    state.bombs.push(new Bomb(state.characters.find(character => character.color === action.payload.currentPlayerColor)));
                }
                return {
                    ...state,
                };
            case Action.BOMB_EXPLODED:
                state.characters.find(character => character.color === state.currentPlayerColor).bombUsed--;
                state.bombs.splice(state.bombs.indexOf(action.payload.bomb), 1);
                return {
                    ...state
                };
            case Action.DESTROY:
                state.walls[action.payload.destroyedX][action.payload.destroyedY].destroyed = true;
                return {
                    ...state,
                };
            case Action.KILL:
                state.characters.find(character => character.color === action.payload.character.color).status = CharacterStatus.DEAD;
                return {
                    ...state,
                };
            case Action.VICTORY:
                const player = state.characters.find(character => character.color === action.payload.character.color);
                player.status = CharacterStatus.VICTORIOUS;
                this.connection.victory(player.currentPlayerColor);
                return {
                    ...state,
                };
            case Action.CHANGE_GAME_STATUS:
                return {
                    ...state,
                    gameStatus: action.payload.status,
                    currentScreenCode: action.payload.currentScreenCode
                };
            case Action.MOVE: {
                state.characters.find(character => character.color === action.payload.currentPlayerColor).move(action.payload.direction, state);
                return {
                    ...state,
                }
            }
            case Action.ADD_BOMB: {
                state.characters.find(character => character.color === action.payload.currentPlayerColor).bombUsed++;
                state.bombs.push(new Bomb(state.characters.find(character => character.color === action.payload.currentPlayerColor)));
                return {
                    ...state,
                }
            }
            case Action.CONSUME_BONUS: {
                switch (action.payload.bonus.type) {
                    case BonusTypes.POWER:
                        state.characters.find(character => character.color === state.currentPlayerColor).radius++;
                        break;
                    case BonusTypes.BOMB:
                        state.characters.find(character => character.color === state.currentPlayerColor).bombMax++;
                        break;
                    case BonusTypes.SPEED:
                        const thePlayer = state.characters.find(character => character.color === state.currentPlayerColor);
                        if(state.characters.find(character => character.color === state.currentPlayerColor) > 8) {
                            state.characters.find(character => character.color === state.currentPlayerColor).animationDuration = thePlayer.animationDuration - 1;
                        }
                        break;
                }
                const bonus = state.bonus.find(bonus => bonus.x === action.payload.bonus.x && bonus.y === action.payload.bonus.y);
                state.bonus.splice(state.bonus.indexOf(bonus), 1);
                return {
                    ...state,
                }
            }
            case Action.GET_BONUS: {
                this.connection.consumeBonus(action.payload.bonus, state.currentPlayerColor);
                return {
                    ...state
                }
            }
        }

    }
}