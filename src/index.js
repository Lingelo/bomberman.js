import {Title} from "./menus/title";
import {State} from "./state/state";
import {Keyboard} from "./utils/keyboard";
import {Options} from "./menus/options";
import {Game} from "./game/game";
import {Action} from "./state/actions";
import {GAMESTATUS} from "./game/geme-status";
import {GamePad} from "./utils/gamepad";
import {GameUtils} from "./utils/game-utils";
import {Music} from "./utils/music";

const screenWidth = 960;
const screenHeight = 640;

const canvas = document.getElementById('canvas');
canvas.width = screenWidth;
canvas.height = screenHeight;
const ctx = canvas.getContext('2d');

const canvasContext = {
    screenWidth,
    screenHeight,
    ctx
};

const state = new State();
state.createStore();

const controller = new Keyboard();
controller.bind();
const gamepads = new GamePad();

let currentScreen = new Title();
let songMenu;
Music.menu().then(song => {
    songMenu = song
    songMenu.play();
});
document.addEventListener('state', (state) => {
    if (currentScreen.code !== state.detail.currentScreenCode) {
        switch (state.detail.currentScreenCode) {
            case 'TITLE':
                currentScreen = new Title();
                break;
            case 'OPTIONS':
                currentScreen = new Options();
                break;
            case 'NEW_GAME': {
                songMenu.pause();
                const walls = GameUtils.initWalls(state.detail.map, state.detail.characters);
                const bonus = GameUtils.initBonus(state.detail.map, state.detail.characters);
                document.dispatchEvent(new CustomEvent('action', {
                    detail: {
                        type: Action.INIT_GAME,
                        payload: {
                            status: GAMESTATUS.IN_PROGRESS,
                            walls,
                            bonus
                        }
                    }
                }));
                currentScreen = new Game(state.detail.map, walls, state.detail.characters, bonus);
            }
        }
    }
});


const step = () => {
    currentScreen.update(canvasContext);
    gamepads.listen();
    requestAnimationFrame(step);
};

requestAnimationFrame(step);

const metrics = {
    width: 0,
    height: 0,
    computedWidth: function () { // computed width
        return metrics.width;
    },
    computedHeight: function () { // computed height
        return metrics.height;
    }
};

const stretch = () => {
    metrics.width = document.body.offsetWidth;
    metrics.height = document.body.offsetHeight;
    canvas.style.width = metrics.computedWidth() + 'px';
    canvas.style.height = metrics.computedHeight() + 'px';
};

stretch();
window.addEventListener('resize', stretch, false);
