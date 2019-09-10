import {Action} from "../state/actions";
import {DIRECTION} from "../game/direction";

export class GamePad {

    constructor() {

        this.tic = 0;
        window.addEventListener("gamepadconnected", function (e) {
            document.dispatchEvent(new CustomEvent('action', {
                detail: {
                    type: Action.ADD_PLAYER,
                    payload: {
                        index: e.gamepad.index
                    }
                }
            }));
        }, false);
        window.addEventListener("gamepaddisconnected", function (e) {
        }, false);
    }

    listen() {

        this.tic++;
        if(this.tic > 5) {
            this.tic = 0;
        }

        //x : 0
        //LEFT : 14
        //DOWN :  13
        //RIGHT : 15
        //TOP:  12

        [navigator.getGamepads()[0],
            navigator.getGamepads()[1],
            navigator.getGamepads()[2],
            navigator.getGamepads()[3]
        ].filter(gamepad => !!gamepad)
            .forEach((gamepad, index) => {

                // X
                if (gamepad.buttons[0].pressed) {
                    if(this.tic === 4) {
                        document.dispatchEvent(new CustomEvent('action', {
                            detail: {
                                type: Action.DROP_BOMB,
                                payload: {
                                    color: index
                                }
                            }
                        }));
                    }

                }

                // LEFT
                if (gamepad.buttons[14].pressed) {
                    document.dispatchEvent(new CustomEvent('action', {
                        detail: {
                            type: Action.MOVE,
                            payload: {
                                color: index,
                                direction: DIRECTION.LEFT
                            }
                        },
                    }));
                }

                // DOWN
                if (gamepad.buttons[13].pressed) {
                    document.dispatchEvent(new CustomEvent('action', {
                        detail: {
                            type: Action.MOVE,
                            payload: {
                                color: index,
                                direction: DIRECTION.DOWN
                            }
                        },
                    }));
                }

                // RIGHT
                if (gamepad.buttons[15].pressed) {
                    document.dispatchEvent(new CustomEvent('action', {
                        detail: {
                            type: Action.MOVE,
                            payload: {
                                color: index,
                                direction: DIRECTION.RIGHT
                            }
                        },
                    }));
                }

                // UP
                if (gamepad.buttons[12].pressed) {
                    document.dispatchEvent(new CustomEvent('action', {
                        detail: {
                            type: Action.MOVE,
                            payload: {
                                color: index,
                                direction: DIRECTION.TOP
                            }
                        },
                    }));
                }
            });


    }

}