import {Action} from "../state/actions";
import {DIRECTION} from "../game/direction";
import {dispatch} from "../state/redux";

/**
 * Game PAD management :
 * X : 0
 * LEFT : 14
 * DOWN :  13
 * RIGHT : 15
 * TOP:  12
 */
export class GamePad {

    constructor() {

        this.toucheds = [false, false, false, false];
        window.addEventListener("gamepadconnected", function (e) {

            dispatch({
                type: Action.ADD_PLAYER,
                payload: {
                    index: e.gamepad.index
                }
            });
        }, false);

        window.addEventListener("gamepaddisconnected", function (e) {
        }, false);
    }

    listen() {

        [navigator.getGamepads()[0],
            navigator.getGamepads()[1],
            navigator.getGamepads()[2],
            navigator.getGamepads()[3]
        ].filter(gamepad => !!gamepad)
            .forEach((gamepad, index) => {

                // X
                if (gamepad.buttons[0].pressed && !this.toucheds[index]) {
                    this.toucheds[index] = true;
                    dispatch({
                        type: Action.DROP_BOMB,
                        payload: {
                            color: index
                        }
                    });
                } else if (!gamepad.buttons[0].pressed && this.toucheds[index]) {
                    this.toucheds[index] = false;
                }

                // LEFT
                if (gamepad.buttons[14].pressed) {

                    dispatch({
                        type: Action.MOVE,
                        payload: {
                            color: index,
                            direction: DIRECTION.LEFT
                        }
                    });
                }

                // DOWN
                if (gamepad.buttons[13].pressed) {
                    dispatch({
                        type: Action.MOVE,
                        payload: {
                            color: index,
                            direction: DIRECTION.DOWN
                        }
                    });
                }

                // RIGHT
                if (gamepad.buttons[15].pressed) {
                    dispatch({
                        type: Action.MOVE,
                        payload: {
                            color: index,
                            direction: DIRECTION.RIGHT
                        }
                    });
                }

                // UP
                if (gamepad.buttons[12].pressed) {
                    console.log('up')
                    dispatch({
                        type: Action.MOVE,
                        payload: {
                            color: index,
                            direction: DIRECTION.TOP
                        }
                    });
                }
            });


    }

}
