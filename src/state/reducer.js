import {GAMESTATUS} from "../game/geme-status";
import {Action} from "./actions";
import {Music} from "../utils/music";
import {Menu} from "../menus/menu";
import {COLOR} from "../game/color";
import {Character} from "../game/character";
import {DIRECTION} from "../game/direction";
import {Blast} from "../game/blast";
import {Bomb} from "../game/bomb";
import {CharacterStatus} from "../game/character-status";
import {BONUSTYPE} from "../game/bonus-type";

const map = [
    [12, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 16],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [8, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4]
];

const initialState =  {
    gameStatus: GAMESTATUS.INITIALISATION,
    selectedOption: 1,
    currentScreenCode: "TITLE",
    map,
    characters: [],
    bonus: [],
    bombs: [],
    walls: [],
    blasts: []
};

function reducer(action, state = initialState) {
    switch (action.type) {
        case Action.UP:
            Music.menuBeep().then(song => song.play());
            return {
                ...state,
                selectedOption: state.selectedOption - 1
            };
        case Action.DOWN:
            Music.menuBeep().then(song => song.play());
            return {
                ...state,
                selectedOption: state.selectedOption + 1
            };
        case Action.LEFT: {
            Music.menuBeep().then(song => song.play());
            return state;
        }
        case Action.RIGHT: {
            Music.menuBeep().then(song => song.play());
            return state;
        }
        case Action.ENTER:
            let newScreen = Menu.getNewScreen(state.selectedOption, state.currentScreenCode, state.gameStatus);
            if(newScreen === "TITLE" && [GAMESTATUS.INITIALISATION, GAMESTATUS.READY].includes(state.gameStatus)) {
                Music.menuPrevious().then(song => song.play());
            } else {
                Music.menuNext().then(song => song.play());
            }

            return {
                ...state,
                selectedOption: 1,
                currentScreenCode: newScreen
            };

        case Action.ADD_PLAYER:
            const characters = state.characters;
            let gameStatus = state.gameStatus;
            if (!characters.find(character => character.color === action.payload.index)) {

                switch (action.payload.index) {
                    case COLOR.WHITE:
                        characters.push(new Character(COLOR.WHITE, 1, 1, DIRECTION.DOWN));
                        break;
                    case COLOR.BLACK: {
                        characters.push(new Character(COLOR.BLACK, 1, 11, DIRECTION.DOWN));
                        break;
                    }
                    case COLOR.BLUE: {
                        characters.push(new Character(COLOR.BLUE, 13, 1, DIRECTION.DOWN));
                        break;
                    }
                    case COLOR.RED:
                        characters.push(new Character(COLOR.RED, 13, 11, DIRECTION.DOWN));
                        break;
                }

            }

            if(characters.length >= 2) {
                gameStatus = GAMESTATUS.READY;
            }

            return {
                ...state,
                characters,
                gameStatus
            };
        case Action.MENU_OVERFLOW: {
            return {
                ...state,
                selectedOption: action.payload.selectedOption
            }
        }
        case Action.RESET: {
            setTimeout(function () {
                location.reload()
            }, 100);
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
            if (state.gameStatus === GAMESTATUS.IN_PROGRESS) {
                const bombUsed = state.characters.find(character => character.color === action.payload.color).bombUsed;
                const bombMax = state.characters.find(character => character.color === action.payload.color).bombMax;

                if (bombUsed < bombMax) {
                    state.characters.find(character => character.color === action.payload.color).bombUsed++;
                    let bomb = new Bomb(state.characters.find(character => character.color === action.payload.color));
                    state.bombs.push(bomb);
                    Music.bombDrop().then(song => song.play());
                }

            }
            return {
                ...state,
            };
        case Action.BOMB_EXPLODED:
            state.characters.find(character => character.color === action.payload.bomb.character.color).bombUsed--;
            state.bombs.splice(state.bombs.indexOf(action.payload.bomb), 1);
            Music.explosion().then(song => song.play());
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
            Music.death().then(song => song.play());
            return {
                ...state,
            };
        case Action.VICTORY:
            const player = state.characters.find(character => character.color === action.payload.character.color);
            player.status = CharacterStatus.VICTORIOUS;
            Music.win().then(song => song.play());
            return {
                ...state,
                gameStatus: GAMESTATUS.END
            };
        case Action.INIT_GAME:
            return {
                ...state,
                gameStatus: GAMESTATUS.IN_PROGRESS,
                currentScreenCode: action.payload.currentScreenCode,
                walls: action.payload.walls,
                bonus: action.payload.bonus
            };

        case Action.GET_BONUS:
            switch (action.payload.bonus.type) {
                case BONUSTYPE.POWER:
                    state.characters.find(character => character.color === action.payload.playerColor).radius++;
                    break;
                case BONUSTYPE.BOMB:
                    state.characters.find(character => character.color === action.payload.playerColor).bombMax++;
                    break;
                case BONUSTYPE.SPEED:
                    const thePlayer = state.characters.find(character => character.color === action.payload.playerColor);
                    if (state.characters.find(character => character.color === action.payload.playerColor) > 8) {
                        state.characters.find(character => character.color === action.payload.playerColor).animationDuration = thePlayer.animationDuration - 1;
                    }
                    break;
            }
            const bonus = state.bonus.find(bonus => bonus.x === action.payload.bonus.x && bonus.y === action.payload.bonus.y);
            state.bonus.splice(state.bonus.indexOf(bonus), 1);
            Music.bonus().then(song => song.play());

            return {
                ...state
            };

        case Action.MOVE: {
            if (state.gameStatus === GAMESTATUS.IN_PROGRESS) {
                state.characters.find(character => character.color === action.payload.color).move(action.payload.direction, state);
            }
            return {
                ...state
            };

        }
    }
}

export { reducer }