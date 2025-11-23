import { Action } from '../state/actions';
import { DIRECTION } from '../game/direction';
import { dispatch } from '../state/redux';

export class GamePad {
  private toucheds: boolean[];

  constructor() {
    this.toucheds = [false, false, false, false];

    window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
      dispatch({
        type: Action.ADD_PLAYER,
        payload: {
          index: e.gamepad.index,
        },
      });
    }, false);

    window.addEventListener('gamepaddisconnected', () => {}, false);
  }

  listen(): void {
    const gamepads = navigator.getGamepads();
    [gamepads[0], gamepads[1], gamepads[2], gamepads[3]]
      .filter((gamepad): gamepad is Gamepad => !!gamepad)
      .forEach((gamepad, index) => {
        if (gamepad.buttons[0].pressed && !this.toucheds[index]) {
          this.toucheds[index] = true;
          dispatch({
            type: Action.DROP_BOMB,
            payload: { color: index },
          });
        } else if (!gamepad.buttons[0].pressed && this.toucheds[index]) {
          this.toucheds[index] = false;
        }

        if (gamepad.buttons[14].pressed) {
          dispatch({
            type: Action.MOVE,
            payload: { color: index, direction: DIRECTION.LEFT },
          });
        }

        if (gamepad.buttons[13].pressed) {
          dispatch({
            type: Action.MOVE,
            payload: { color: index, direction: DIRECTION.DOWN },
          });
        }

        if (gamepad.buttons[15].pressed) {
          dispatch({
            type: Action.MOVE,
            payload: { color: index, direction: DIRECTION.RIGHT },
          });
        }

        if (gamepad.buttons[12].pressed) {
          dispatch({
            type: Action.MOVE,
            payload: { color: index, direction: DIRECTION.TOP },
          });
        }
      });
  }
}
