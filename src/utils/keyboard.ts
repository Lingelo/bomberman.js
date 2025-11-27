import { Action } from '../state/actions';
import { DIRECTION } from '../game/direction';
import { COLOR } from '../game/color';
import { GAMESTATUS } from '../game/game-status';
import { dispatch, getState } from '../state/redux';
import { getCurrentMultiplayerGame } from '../game/multiplayer-game';

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
  private pressedKeys: Set<number>;
  private handledOneShot: Set<number>;

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

    this.pressedKeys = new Set();
    this.handledOneShot = new Set();
  }

  bind(): void {
    addEventListener('keyup', (e: KeyboardEvent) => {
      this.pressedKeys.delete(e.keyCode);
      this.handledOneShot.delete(e.keyCode);
    }, false);

    addEventListener('keydown', (e: KeyboardEvent) => {
      this.pressedKeys.add(e.keyCode);

      const state = getState();
      const inGame = state.gameStatus === GAMESTATUS.IN_PROGRESS;
      const multiplayerGame = getCurrentMultiplayerGame();

      // In-game one-shot actions (space, escape)
      if (inGame) {
        if (e.keyCode === this.keys.space && !this.handledOneShot.has(e.keyCode)) {
          this.handledOneShot.add(e.keyCode);
          if (multiplayerGame) {
            multiplayerGame.sendDropBomb();
          } else {
            dispatch({
              type: Action.DROP_BOMB,
              payload: { color: COLOR.WHITE },
            });
          }
          return;
        }
        if (e.keyCode === this.keys.escape && !this.handledOneShot.has(e.keyCode)) {
          this.handledOneShot.add(e.keyCode);
          dispatch({ type: Action.RESET });
          return;
        }
        // Movement is now handled in listen()
        return;
      }

      // Menu controls (one-shot)
      if (this.handledOneShot.has(e.keyCode)) {
        return;
      }
      this.handledOneShot.add(e.keyCode);

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

  listen(): void {
    const state = getState();
    const inGame = state.gameStatus === GAMESTATUS.IN_PROGRESS;
    if (!inGame) {
      return;
    }

    const multiplayerGame = getCurrentMultiplayerGame();
    const keymap = state.keymap;

    // Check movement based on keymap
    let moveDir: typeof DIRECTION.TOP | typeof DIRECTION.DOWN | typeof DIRECTION.LEFT | typeof DIRECTION.RIGHT | null = null;

    if (keymap === 'ZQSD') {
      if (this.pressedKeys.has(this.keys.z)) moveDir = DIRECTION.TOP;
      else if (this.pressedKeys.has(this.keys.s)) moveDir = DIRECTION.DOWN;
      else if (this.pressedKeys.has(this.keys.q)) moveDir = DIRECTION.LEFT;
      else if (this.pressedKeys.has(this.keys.d)) moveDir = DIRECTION.RIGHT;
    } else if (keymap === 'WASD') {
      if (this.pressedKeys.has(87)) moveDir = DIRECTION.TOP; // W
      else if (this.pressedKeys.has(83)) moveDir = DIRECTION.DOWN; // S
      else if (this.pressedKeys.has(65)) moveDir = DIRECTION.LEFT; // A
      else if (this.pressedKeys.has(68)) moveDir = DIRECTION.RIGHT; // D
    }

    // Arrow keys always work (and override keymap if pressed)
    if (this.pressedKeys.has(this.keys.up)) moveDir = DIRECTION.TOP;
    else if (this.pressedKeys.has(this.keys.down)) moveDir = DIRECTION.DOWN;
    else if (this.pressedKeys.has(this.keys.left)) moveDir = DIRECTION.LEFT;
    else if (this.pressedKeys.has(this.keys.right)) moveDir = DIRECTION.RIGHT;

    if (moveDir !== null) {
      if (multiplayerGame) {
        multiplayerGame.sendMove(moveDir);
      } else {
        dispatch({
          type: Action.MOVE,
          payload: { color: COLOR.WHITE, direction: moveDir },
        });
      }
    }
  }
}
