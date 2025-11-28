import { Action } from '../state/actions';
import { DIRECTION, type Direction } from '../game/direction';
import { dispatch, getState } from '../state/redux';
import { getCurrentMultiplayerGame } from '../game/multiplayer-game';
import { GAMESTATUS } from '../game/game-status';

export class GamePad {
  private bombToucheds: boolean[];
  private directionToucheds: Map<number, Direction | null>;

  constructor() {
    this.bombToucheds = [false, false, false, false];
    this.directionToucheds = new Map();

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
    const state = getState();
    const inGame = state.gameStatus === GAMESTATUS.IN_PROGRESS;
    const multiplayerGame = getCurrentMultiplayerGame();

    const gamepads = navigator.getGamepads();
    [gamepads[0], gamepads[1], gamepads[2], gamepads[3]]
      .filter((gamepad): gamepad is Gamepad => !!gamepad)
      .forEach((gamepad, index) => {
        // Bomb drop (one-shot action)
        if (gamepad.buttons[0].pressed && !this.bombToucheds[index]) {
          this.bombToucheds[index] = true;
          if (multiplayerGame && inGame && index === multiplayerGame.localPlayerColor) {
            multiplayerGame.sendDropBomb();
          } else {
            dispatch({
              type: Action.DROP_BOMB,
              payload: { color: index },
            });
          }
        } else if (!gamepad.buttons[0].pressed && this.bombToucheds[index]) {
          this.bombToucheds[index] = false;
        }

        // Determine current direction
        let currentDir: Direction | null = null;
        if (gamepad.buttons[14].pressed) {
          currentDir = DIRECTION.LEFT;
        } else if (gamepad.buttons[15].pressed) {
          currentDir = DIRECTION.RIGHT;
        } else if (gamepad.buttons[12].pressed) {
          currentDir = DIRECTION.TOP;
        } else if (gamepad.buttons[13].pressed) {
          currentDir = DIRECTION.DOWN;
        }

        const lastDir = this.directionToucheds.get(index) || null;

        if (multiplayerGame && inGame && index === multiplayerGame.localPlayerColor) {
          // Multiplayer: send only when direction changes (new press)
          if (currentDir !== null && currentDir !== lastDir) {
            multiplayerGame.sendMove(currentDir);
          }
        } else if (!multiplayerGame) {
          // Solo mode: send every frame when pressed
          if (currentDir !== null) {
            dispatch({
              type: Action.MOVE,
              payload: { color: index, direction: currentDir },
            });
          }
        }

        // Update tracked direction
        this.directionToucheds.set(index, currentDir);
      });
  }
}
