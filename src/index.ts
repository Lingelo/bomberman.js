import { Title } from './menus/title';
import { Keyboard } from './utils/keyboard';
import { Options } from './menus/options';
import { Information } from './menus/information';
import { Credits } from './menus/credits';
import { Lobby } from './menus/lobby';
import { Game } from './game/game';
import { MultiplayerGame, setCurrentMultiplayerGame } from './game/multiplayer-game';
import { Action } from './state/actions';
import { GAMESTATUS } from './game/game-status';
import { GamePad } from './utils/gamepad';
import { GameUtils } from './utils/game-utils';
import { Character } from './game/character';
import { DIRECTION } from './game/direction';
import { networkClient } from './utils/network';
import { BackgroundMusicManager } from './utils/music';
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

let currentScreen: Menu | Game | MultiplayerGame = new Title();

// Initialize background music manager
const backgroundMusic = BackgroundMusicManager.getInstance();
// Start music on first user interaction (click on canvas)
canvas.addEventListener('click', () => {
  backgroundMusic.start();
}, { once: true });

subscribe(() => {
  const newScreenCode = getState().currentScreenCode;
  if (currentScreen.code === newScreenCode) {
    return;
  }

  switch (newScreenCode) {
    case 'TITLE':
      currentScreen = new Title();
      backgroundMusic.start();
      break;
    case 'OPTIONS':
      currentScreen = new Options();
      backgroundMusic.start();
      break;
    case 'INFORMATION':
      currentScreen = new Information();
      backgroundMusic.start();
      break;
    case 'CREDITS':
      currentScreen = new Credits();
      backgroundMusic.start();
      break;
    case 'LOBBY':
      currentScreen = new Lobby();
      backgroundMusic.start();
      break;
    case 'NEW_GAME': {
      const walls = GameUtils.initWalls(getState().map, getState().characters);
      const bonus = GameUtils.initBonus(getState().map, getState().characters);

      currentScreen = new Game(getState().map, walls, getState().characters, bonus);
      setCurrentMultiplayerGame(null);
      backgroundMusic.stop();

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
    case 'MULTIPLAYER_GAME': {
      const lobbyState = networkClient.lobbyState;
      if (!lobbyState) {
        dispatch({ type: Action.ESCAPE });
        break;
      }

      const characters: Character[] = [];
      lobbyState.players.forEach(player => {
        const char = new Character(player.color as 0 | 1 | 2 | 3, player.x, player.y, DIRECTION.DOWN);
        char.isBot = false;
        characters.push(char);
      });

      const walls = GameUtils.initWalls(getState().map, characters);
      const bonus = GameUtils.initBonus(getState().map, characters);

      const localPlayer = lobbyState.players.find(p => p.id === networkClient.localPlayerId);
      const localColor = localPlayer ? localPlayer.color : 0;

      const mpGame = new MultiplayerGame(getState().map, walls, characters, bonus, localColor);
      currentScreen = mpGame;
      setCurrentMultiplayerGame(mpGame);
      backgroundMusic.stop();

      dispatch({
        type: Action.INIT_GAME,
        payload: {
          status: GAMESTATUS.IN_PROGRESS,
          walls,
          bonus,
          characters,
        },
      });
      break;
    }
  }
});

const step = (): void => {
  currentScreen.update(canvasContext);
  controller.listen();
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
