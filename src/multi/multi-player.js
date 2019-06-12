import {Action} from "../state/actions";
import {Character} from "../game/character";
import {DIRECTION} from "../game/direction";
import {GameStatus} from "../game/geme-status";
import {BonusMapper} from "../mapper/bonus-mapper";
import {WallMapper} from "../mapper/wall-mapper";

export class MultiPlayer {
    constructor() {
        this.connection = new WebSocket('ws://localhost:8080');
        this.playerHasChoosen = false;
        this.gameStatus = GameStatus.INITIALISATION;
        this.bonusMapper = new BonusMapper();
        this.wallMapper = new WallMapper();

        document.addEventListener('state', (state) => {
            this.playerHasChoosen = !!state.detail.currentPlayerColor;
            this.gameStatus = state.detail.gameStatus;
            this.currentScreenCode = state.detail.currentScreenCode;
            this.characters = state.detail.characters;
        });

        this.connection.onerror = error => {
            console.log(`WebSocket error: ${error}`)
        };

        this.connection.addEventListener('message', event => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case "CONSUME_BONUS":
                    document.dispatchEvent(new CustomEvent('action', {
                        detail: {
                            type: Action.CONSUME_BONUS,
                            payload: {
                                bonus: data.bonus
                            }
                        }
                    }));
                    break;
                case "CHARACTERS_LIST":
                    if (this.gameStatus !== GameStatus.IN_PROGRESS) {
                        const characters = [];
                        data.characters.forEach(character => {
                            characters.push(new Character(character.color, character.x, character.y, DIRECTION.DOWN))
                        });
                        document.dispatchEvent(new CustomEvent('action', {
                            detail: {
                                type: Action.INIT_CHARACTERS,
                                payload: {characters: characters}
                            }
                        }));
                    }

                    if (data.characters.length > 1) {
                        this.ready();
                    }
                    break;
                case "PLAYER_CHOSEN": {
                    if (!this.playerHasChoosen && this.gameStatus !== GameStatus.IN_PROGRESS && this.currentScreenCode === "LOBBY") {
                        document.dispatchEvent(new CustomEvent('action', {
                            detail: {
                                type: Action.PLAYER_CHOSEN,
                                payload: {currentPlayerColor: data.currentPlayerColor}
                            }
                        }));
                    }
                    break;
                }
                case "CHANGE_GAME_STATUS": {
                    if (this.gameStatus !== GameStatus.IN_PROGRESS && data.status === GameStatus.IN_PROGRESS) {
                        this.init();
                        document.dispatchEvent(new CustomEvent('action', {
                            detail: {
                                type: Action.CHANGE_GAME_STATUS,
                                payload: {status: GameStatus.IN_PROGRESS, currentScreenCode: "NEW_GAME"}
                            }
                        }));
                    }
                    if (this.gameStatus !== GameStatus.READY && data.status === GameStatus.READY) {
                        this.init();
                        document.dispatchEvent(new CustomEvent('action', {
                            detail: {
                                type: Action.CHANGE_GAME_STATUS,
                                payload: {status: GameStatus.READY, currentScreenCode: "LOBBY"}
                            }
                        }));
                    }
                    break;

                }
                case "INIT": {
                    document.dispatchEvent(new CustomEvent('action', {
                        detail: {
                            type: Action.INIT,
                            payload: {
                                map: data.map,
                                walls: this.wallMapper.mapToFront(data.walls),
                                bonus: data.bonus.map(bonusServer => this.bonusMapper.mapToFront(bonusServer))
                            }
                        }
                    }));
                    break;
                }
                case "MOVE": {
                    document.dispatchEvent(new CustomEvent('action', {
                        detail: {
                            type: Action.MOVE,
                            payload: {
                                currentPlayerColor: data.currentPlayerColor,
                                direction: data.direction
                            }
                        }
                    }));
                    break;
                }
                case "DROP_BOMB": {
                    document.dispatchEvent(new CustomEvent('action', {
                        detail: {
                            type: Action.ADD_BOMB,
                            payload: {
                                currentPlayerColor: data.currentPlayerColor,
                            }
                        }
                    }));
                    break;
                }
                case "NO_CHARACTERS":
                    console.log("Plus de place");
                    break;
                default:
                    console.log("Action server inconnue");
            }
        });
    }

    launch() {
        this.connection.send(JSON.stringify({
            type: "LAUNCH",
        }))
    }

    init() {
        this.connection.send(JSON.stringify({
            type: "INIT",
        }))
    }

    move(playerColor, direction) {
        this.connection.send(JSON.stringify({
            type: 'MOVE',
            direction: direction,
            currentPlayerColor: playerColor
        }))
    }

    dropBomb(playerColor) {
        this.connection.send(JSON.stringify({
            type: "DROP_BOMB",
            currentPlayerColor: playerColor
        }))
    }

    victory(playerColor) {
        this.connection.send(JSON.stringify(
            {
                type: "VICTORY",
                currentPlayerColor: playerColor
            }
        ))
    }

    leave(playerColor) {
        this.connection.send(JSON.stringify(
            {
                type: "LEAVE",
                currentPlayerColor: playerColor
            }
        ))
    }

    ready() {
        this.connection.send(JSON.stringify(
            {
                type: "READY",
            }
        ))
    }

    consumeBonus(bonus, currentPlayerColor) {
        this.connection.send(JSON.stringify(
            {
                type: "BONUS",
                bonus: bonus,
                currentPlayerColor: currentPlayerColor
            }
        ))
    }
}