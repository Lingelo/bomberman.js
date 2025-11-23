import { Title } from './menus/title';
import { Keyboard } from './utils/keyboard';
import { Options } from './menus/options';
import { Information } from './menus/information';
import { Game } from './game/game';
import { Action } from './state/actions';
import { GAMESTATUS } from './game/game-status';
import { GamePad } from './utils/gamepad';
import { GameUtils } from './utils/game-utils';
import { dispatch, getState, subscribe } from './state/redux';
import type { CanvasContext } from './types';
import type { Menu } from './menus/menu';

const screenWidth = 960;
const screenHeight = 640;

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = screenWidth;
canvas.height = screenHeight;
const ctx = canvas.getContext('2d')!;

const canvasContext: CanvasContext = {
  screenWidth,
  screenHeight,
  ctx,
};

const controller = new Keyboard();
controller.bind();
const gamepads = new GamePad();

let currentScreen: Menu | Game = new Title();

subscribe(() => {
  const newScreenCode = getState().currentScreenCode;
  if (currentScreen.code === newScreenCode) {
    return;
  }

  switch (newScreenCode) {
    case 'TITLE':
      currentScreen = new Title();
      break;
    case 'OPTIONS':
      currentScreen = new Options();
      break;
    case 'INFORMATION':
      currentScreen = new Information();
      break;
    case 'NEW_GAME': {
      const walls = GameUtils.initWalls(getState().map, getState().characters);
      const bonus = GameUtils.initBonus(getState().map, getState().characters);

      currentScreen = new Game(getState().map, walls, getState().characters, bonus);

      dispatch({
        type: Action.INIT_GAME,
        payload: {
          status: GAMESTATUS.IN_PROGRESS,
          walls,
          bonus,
        },
      });
      break;
    }
  }
});

const step = (): void => {
  currentScreen.update(canvasContext);
  gamepads.listen();
  requestAnimationFrame(step);
};

requestAnimationFrame(step);

interface Metrics {
  width: number;
  height: number;
  computedWidth: () => number;
  computedHeight: () => number;
}

const metrics: Metrics = {
  width: 0,
  height: 0,
  computedWidth() {
    return metrics.width;
  },
  computedHeight() {
    return metrics.height;
  },
};

const stretch = (): void => {
  metrics.width = document.body.offsetWidth;
  metrics.height = document.body.offsetHeight;
  canvas.style.width = `${metrics.computedWidth()}px`;
  canvas.style.height = `${metrics.computedHeight()}px`;
};

stretch();
window.addEventListener('resize', stretch, false);
