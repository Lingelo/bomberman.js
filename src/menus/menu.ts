import { Sprite } from '../utils/sprite';
import { Action } from '../state/actions';
import { GAMESTATUS } from '../game/game-status';
import { dispatch, getState, subscribe } from '../state/redux';
import type { CanvasContext } from '../types';
import type { Character } from '../game/character';

export class Menu {
  imageTitlePosition: number;
  fontSize: number;
  selectedOption: number;
  playersDilayed: Character[];
  code: string;

  constructor() {
    this.imageTitlePosition = 800;
    this.fontSize = 30;
    this.selectedOption = 1;
    this.playersDilayed = [];
    this.code = '';

    subscribe(() => {
      this.playersDilayed = getState().characters;
    });
  }

  update(canvasContext: CanvasContext): void {
    this.render(canvasContext);
  }

  render(canvasContext: CanvasContext): void {
    // Retro dark background
    canvasContext.ctx.fillStyle = '#0a0a0a';
    canvasContext.ctx.fillRect(0, 0, canvasContext.screenWidth, canvasContext.screenHeight);

    // Scanline effect (subtle)
    for (let y = 0; y < canvasContext.screenHeight; y += 4) {
      canvasContext.ctx.fillStyle = 'rgba(0,0,0,0.1)';
      canvasContext.ctx.fillRect(0, y, canvasContext.screenWidth, 2);
    }

    const playerCount = this.playersDilayed ? this.playersDilayed.length : 0;

    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.textAlign = 'center';
    canvasContext.ctx.textBaseline = 'top';

    if (playerCount < 2) {
      // Flashing effect for warning
      const flash = Math.floor(Date.now() / 500) % 2 === 0;
      canvasContext.ctx.fillStyle = flash ? '#ff0066' : '#ff3399';
      canvasContext.ctx.fillText(
        `NEED ${2 - playerCount} MORE PLAYER${2 - playerCount > 1 ? 'S' : ''}`,
        canvasContext.screenWidth / 2,
        12
      );
    } else {
      canvasContext.ctx.fillStyle = '#00ff66';
      canvasContext.ctx.fillText(
        `${playerCount} PLAYERS READY!`,
        canvasContext.screenWidth / 2,
        12
      );
    }

    if (this.imageTitlePosition > 170) {
      this.imageTitlePosition -= 15;
    }

    // Title image with slight transparency
    canvasContext.ctx.globalAlpha = 0.3;
    canvasContext.ctx.drawImage(
      Sprite.titleWallpaper(),
      0,
      this.imageTitlePosition + 5,
      canvasContext.screenWidth,
      canvasContext.screenHeight - 160
    );
    canvasContext.ctx.globalAlpha = 1;

    if (this.fontSize < 32) {
      this.fontSize++;
    }

    // Retro neon title
    canvasContext.ctx.font = `${this.fontSize}px "Press Start 2P"`;
    canvasContext.ctx.textAlign = 'center';
    canvasContext.ctx.textBaseline = 'top';

    // Glow effect
    canvasContext.ctx.shadowColor = '#ff00ff';
    canvasContext.ctx.shadowBlur = 20;
    canvasContext.ctx.fillStyle = '#ff00ff';
    canvasContext.ctx.fillText('BOMBERMAN', canvasContext.screenWidth / 2, 50);

    canvasContext.ctx.shadowColor = '#00ffff';
    canvasContext.ctx.fillStyle = '#00ffff';
    canvasContext.ctx.fillText('BOMBERMAN', canvasContext.screenWidth / 2 - 2, 48);

    canvasContext.ctx.shadowBlur = 0;
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('BOMBERMAN', canvasContext.screenWidth / 2 - 1, 49);

    // Credit
    canvasContext.ctx.font = '6px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#666666';
    canvasContext.ctx.textBaseline = 'middle';
    canvasContext.ctx.fillText(
      '© LINGELO',
      canvasContext.screenWidth / 2,
      canvasContext.screenHeight - 15
    );
  }

  manageOverflowMenu(
    minSelectableOption: number,
    maxSelectableOption: number,
    selectedOption: number
  ): void {
    this.selectedOption = selectedOption;
    if (selectedOption > maxSelectableOption) {
      this.selectedOption = maxSelectableOption;
      dispatch({
        type: Action.MENU_OVERFLOW,
        payload: { selectedOption: this.selectedOption },
      });
    }
    if (selectedOption < minSelectableOption) {
      this.selectedOption = minSelectableOption;
      dispatch({
        type: Action.MENU_OVERFLOW,
        payload: { selectedOption: this.selectedOption },
      });
    }
  }

  static getNewScreen(
    selectionOption: number,
    currentScreen: string,
    gameStatus: string
  ): string | undefined {
    if (currentScreen === 'TITLE') {
      if (selectionOption === 1 && gameStatus === GAMESTATUS.READY) {
        return 'NEW_GAME';
      }
      if (selectionOption === 2) {
        return 'LOBBY';
      }
      if (selectionOption === 3) {
        return 'OPTIONS';
      }
      if (selectionOption === 4) {
        return 'INFORMATION';
      }
      return undefined;
    }
    if (currentScreen === 'OPTIONS') {
      return 'TITLE';
    }
    if (currentScreen === 'INFORMATION') {
      return 'TITLE';
    }
    if (currentScreen === 'LOBBY') {
      return undefined;
    }
    return undefined;
  }
}
