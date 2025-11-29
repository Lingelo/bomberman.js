import { Action } from '../state/actions';
import { DIRECTION } from '../game/direction';
import { COLOR } from '../game/color';
import { GAMESTATUS } from '../game/game-status';
import { dispatch, getState } from '../state/redux';
import { getCurrentMultiplayerGame } from '../game/multiplayer-game';
import { networkClient } from './network';

interface Keys {
  up: number;
  down: number;
  left: number;
  right: number;
  space: number;
  enter: number;
  escape: number;
  shift: number;
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
  private keyUpHandler: ((e: KeyboardEvent) => void) | null = null;
  private keyDownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    this.keys = {
      up: 38,
      down: 40,
      left: 37,
      right: 39,
      space: 32,
      enter: 13,
      escape: 27,
      shift: 16,
      b: 66,
      z: 90, // AZERTY: Z for up
      q: 81, // AZERTY: Q for left
      s: 83, // AZERTY: S for down
      d: 68, // AZERTY: D for right
    };

    this.pressedKeys = new Set();
    this.handledOneShot = new Set();
  }

  unbind(): void {
    if (this.keyUpHandler) {
      window.removeEventListener('keyup', this.keyUpHandler);
      this.keyUpHandler = null;
    }
    if (this.keyDownHandler) {
      window.removeEventListener('keydown', this.keyDownHandler);
      this.keyDownHandler = null;
    }
    this.pressedKeys.clear();
    this.handledOneShot.clear();
  }

  bind(): void {
    // Clean up any existing listeners first
    this.unbind();

    this.keyUpHandler = (e: KeyboardEvent) => {
      this.pressedKeys.delete(e.keyCode);
      this.handledOneShot.delete(e.keyCode);

      // In multiplayer, send STOP only if NO movement keys are still pressed
      const multiplayerGame = getCurrentMultiplayerGame();
      if (multiplayerGame) {
        const state = getState();
        const keymap = state.keymap;
        const isMovementKey =
          e.keyCode === this.keys.up || e.keyCode === this.keys.down ||
          e.keyCode === this.keys.left || e.keyCode === this.keys.right ||
          (keymap === 'ZQSD' && (e.keyCode === this.keys.z || e.keyCode === this.keys.s ||
           e.keyCode === this.keys.q || e.keyCode === this.keys.d)) ||
          (keymap === 'WASD' && (e.keyCode === 87 || e.keyCode === 83 ||
           e.keyCode === 65 || e.keyCode === 68));

        if (isMovementKey) {
          // Check if any other movement key is still pressed
          const stillHasMovementKey =
            this.pressedKeys.has(this.keys.up) || this.pressedKeys.has(this.keys.down) ||
            this.pressedKeys.has(this.keys.left) || this.pressedKeys.has(this.keys.right) ||
            (keymap === 'ZQSD' && (this.pressedKeys.has(this.keys.z) || this.pressedKeys.has(this.keys.s) ||
             this.pressedKeys.has(this.keys.q) || this.pressedKeys.has(this.keys.d))) ||
            (keymap === 'WASD' && (this.pressedKeys.has(87) || this.pressedKeys.has(83) ||
             this.pressedKeys.has(65) || this.pressedKeys.has(68)));

          if (!stillHasMovementKey) {
            networkClient.sendAction({ type: 'STOP' });
          }
        }
      }
    };

    this.keyDownHandler = (e: KeyboardEvent) => {
      this.pressedKeys.add(e.keyCode);

      const state = getState();
      const inGame = state.gameStatus === GAMESTATUS.IN_PROGRESS;
      const multiplayerGame = getCurrentMultiplayerGame();

      // In-game actions
      if (inGame) {
        // One-shot actions
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
        // Detonate remote bombs with Shift
        if (e.keyCode === this.keys.shift && !this.handledOneShot.has(e.keyCode)) {
          this.handledOneShot.add(e.keyCode);
          if (multiplayerGame) {
            networkClient.sendAction({ type: 'DETONATE' });
          } else {
            dispatch({
              type: Action.DETONATE,
              payload: { color: COLOR.WHITE },
            });
          }
          return;
        }

        // Movement in multiplayer: send once on keydown
        if (multiplayerGame) {
          const keymap = state.keymap;
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

          if (moveDir !== null && !this.handledOneShot.has(e.keyCode)) {
            this.handledOneShot.add(e.keyCode);
            multiplayerGame.sendMove(moveDir);
          }
          return;
        }
        // Solo mode: movement handled in listen()
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
    };

    // Register event listeners
    addEventListener('keyup', this.keyUpHandler, false);
    addEventListener('keydown', this.keyDownHandler, false);
  }

  listen(): void {
    const state = getState();
    const inGame = state.gameStatus === GAMESTATUS.IN_PROGRESS;
    const multiplayerGame = getCurrentMultiplayerGame();

    // Only handle continuous movement in solo mode
    if (!inGame || multiplayerGame) {
      return;
    }

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
      // Solo mode: send every frame for smooth movement
      dispatch({
        type: Action.MOVE,
        payload: { color: COLOR.WHITE, direction: moveDir },
      });
    }
  }
}
