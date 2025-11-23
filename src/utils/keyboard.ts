import { Action } from '../state/actions';
import { DIRECTION } from '../game/direction';
import { COLOR } from '../game/color';
import { GAMESTATUS } from '../game/game-status';
import { dispatch, getState } from '../state/redux';

interface Keys {
  up: number;
  down: number;
  left: number;
  right: number;
  space: number;
  enter: number;
  escape: number;
  b: number;
  z: number;
  q: number;
  s: number;
  d: number;
}

export class Keyboard {
  private keys: Keys;
  private handledKeys: boolean[];

  constructor() {
    this.keys = {
      up: 38,
      down: 40,
      left: 37,
      right: 39,
      space: 32,
      enter: 13,
      escape: 27,
      b: 66,
      z: 90, // AZERTY: Z for up
      q: 81, // AZERTY: Q for left
      s: 83, // AZERTY: S for down
      d: 68, // AZERTY: D for right
    };

    this.handledKeys = [];
    this.handledKeys[this.keys.up] = false;
    this.handledKeys[this.keys.down] = false;
    this.handledKeys[this.keys.left] = false;
    this.handledKeys[this.keys.right] = false;
    this.handledKeys[this.keys.space] = false;
    this.handledKeys[this.keys.enter] = false;
    this.handledKeys[this.keys.escape] = false;
    this.handledKeys[this.keys.b] = false;
    this.handledKeys[this.keys.z] = false;
    this.handledKeys[this.keys.q] = false;
    this.handledKeys[this.keys.s] = false;
    this.handledKeys[this.keys.d] = false;
  }

  bind(): void {
    addEventListener('keyup', (e: KeyboardEvent) => {
      delete this.handledKeys[e.keyCode];
    }, false);

    addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.handledKeys[e.keyCode]) {
        this.handledKeys[e.keyCode] = true;
      }

      const state = getState();
      const inGame = state.gameStatus === GAMESTATUS.IN_PROGRESS;

      // In-game controls for P1 (WHITE player)
      if (inGame) {
        const keymap = state.keymap;

        // Check movement based on keymap
        let moveDir: typeof DIRECTION.TOP | typeof DIRECTION.DOWN | typeof DIRECTION.LEFT | typeof DIRECTION.RIGHT | null = null;

        if (keymap === 'ZQSD') {
          if (e.keyCode === this.keys.z) moveDir = DIRECTION.TOP;
          else if (e.keyCode === this.keys.s) moveDir = DIRECTION.DOWN;
          else if (e.keyCode === this.keys.q) moveDir = DIRECTION.LEFT;
          else if (e.keyCode === this.keys.d) moveDir = DIRECTION.RIGHT;
        } else if (keymap === 'WASD') {
          if (e.keyCode === 87) moveDir = DIRECTION.TOP; // W
          else if (e.keyCode === 83) moveDir = DIRECTION.DOWN; // S
          else if (e.keyCode === 65) moveDir = DIRECTION.LEFT; // A
          else if (e.keyCode === 68) moveDir = DIRECTION.RIGHT; // D
        }

        // Arrow keys always work
        if (e.keyCode === this.keys.up) moveDir = DIRECTION.TOP;
        else if (e.keyCode === this.keys.down) moveDir = DIRECTION.DOWN;
        else if (e.keyCode === this.keys.left) moveDir = DIRECTION.LEFT;
        else if (e.keyCode === this.keys.right) moveDir = DIRECTION.RIGHT;

        if (moveDir) {
          dispatch({
            type: Action.MOVE,
            payload: { color: COLOR.WHITE, direction: moveDir },
          });
          return;
        }

        if (e.keyCode === this.keys.space) {
          dispatch({
            type: Action.DROP_BOMB,
            payload: { color: COLOR.WHITE },
          });
          return;
        }
        if (e.keyCode === this.keys.escape) {
          dispatch({ type: Action.RESET });
          return;
        }
      }

      // Menu controls
      switch (e.keyCode) {
        case this.keys.up:
          dispatch({ type: Action.UP });
          break;
        case this.keys.down:
          dispatch({ type: Action.DOWN });
          break;
        case this.keys.enter:
          dispatch({ type: Action.ENTER });
          break;
        case this.keys.escape:
          dispatch({ type: Action.RESET });
          break;
        case this.keys.left:
          dispatch({ type: Action.LEFT });
          break;
        case this.keys.right:
          dispatch({ type: Action.RIGHT });
          break;
        case this.keys.b:
          dispatch({ type: Action.ADD_BOT });
          break;
        case this.keys.space:
          // Add P1 (keyboard player) in menu
          dispatch({
            type: Action.ADD_PLAYER,
            payload: { index: COLOR.WHITE },
          });
          break;
      }
    }, false);
  }
}
