import {Title} from "./menus/title";
import {State} from "./state/state";
import {Controller} from "./utils/controller";
import {Options} from "./menus/options";
import {Scores} from "./menus/scores";
import {Game} from "./game/game";
import {Lobby} from "./menus/lobby";
import {MultiPlayer} from "./multi/multi-player";
import {Action} from "./state/actions";

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

const controller = new Controller();
controller.bind();

let currentScreen = new Title();
document.addEventListener('state', (state) => {
    if (currentScreen.code !== state.detail.currentScreenCode) {
        switch (state.detail.currentScreenCode) {
            case 'TITLE':
                currentScreen = new Title();
                break;
            case 'OPTIONS':
                currentScreen = new Options();
                break;
            case 'SCORES':
                currentScreen = new Scores();
                break;
            case 'LOBBY':
                currentScreen = new Lobby();
                document.dispatchEvent(new CustomEvent('action', {
                    detail: {
                        type: Action.CONNECT,
                    }
                }));
                break;
            case 'NEW_GAME': {
                currentScreen = new Game();
            }
        }
    }
});


const step = () => {
    currentScreen.update(canvasContext);
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
