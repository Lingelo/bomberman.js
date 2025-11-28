import { getState, subscribe } from '../state/redux';
import { Menu } from './menu';
import type { CanvasContext } from '../types';

export class Credits extends Menu {
  constructor() {
    super();
    this.code = 'CREDITS';
    this.selectedOption = 1;

    subscribe(() => {
      if (getState().currentScreenCode === 'CREDITS') {
        this.selectedOption = getState().selectedOption;
        if (this.selectedOption !== 1) {
          this.manageOverflowMenu(1, 1, this.selectedOption);
        }
      }
    });
  }

  render(canvasContext: CanvasContext): void {
    super.render(canvasContext);

    canvasContext.ctx.textAlign = 'center';

    // Title
    canvasContext.ctx.font = '12px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#00ffff';
    canvasContext.ctx.shadowColor = '#00ffff';
    canvasContext.ctx.shadowBlur = 10;
    canvasContext.ctx.fillText('CREDITS', canvasContext.screenWidth / 2, 160);
    canvasContext.ctx.shadowBlur = 0;

    // Game credits
    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ff00ff';
    canvasContext.ctx.fillText('GAME', canvasContext.screenWidth / 2, 200);

    canvasContext.ctx.font = '6px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText(
      'BOMBERMAN.JS',
      canvasContext.screenWidth / 2,
      220
    );
    canvasContext.ctx.fillStyle = '#888888';
    canvasContext.ctx.fillText(
      'TYPESCRIPT + VITE',
      canvasContext.screenWidth / 2,
      235
    );

    // Music credits
    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ff00ff';
    canvasContext.ctx.fillText('MUSIC', canvasContext.screenWidth / 2, 270);

    canvasContext.ctx.font = '6px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.fillText(
      'POWERUP!',
      canvasContext.screenWidth / 2,
      290
    );
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText(
      'BY JEREMY BLAKE',
      canvasContext.screenWidth / 2,
      305
    );
    canvasContext.ctx.fillStyle = '#888888';
    canvasContext.ctx.fillText(
      'NO COPYRIGHT 8-BIT MUSIC',
      canvasContext.screenWidth / 2,
      320
    );
    canvasContext.ctx.font = '5px "Press Start 2P"';
    canvasContext.ctx.fillText(
      'YOUTUBE.COM/@JEREMYBLAKE',
      canvasContext.screenWidth / 2,
      335
    );

    // AI credits
    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ff00ff';
    canvasContext.ctx.fillText('AI SYSTEM', canvasContext.screenWidth / 2, 370);

    canvasContext.ctx.font = '6px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText(
      'A* PATHFINDING',
      canvasContext.screenWidth / 2,
      390
    );
    canvasContext.ctx.fillText(
      'DANGER ZONE PREDICTION',
      canvasContext.screenWidth / 2,
      405
    );
    canvasContext.ctx.fillText(
      'STRATEGIC BOT AI',
      canvasContext.screenWidth / 2,
      420
    );

    // Technology
    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ff00ff';
    canvasContext.ctx.fillText('TECH', canvasContext.screenWidth / 2, 455);

    canvasContext.ctx.font = '6px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#888888';
    canvasContext.ctx.fillText(
      'TYPESCRIPT VITE CANVAS NESTJS',
      canvasContext.screenWidth / 2,
      475
    );

    // Back option
    canvasContext.ctx.font = '10px "Press Start 2P"';
    const backColor = this.selectedOption === 1 ? '#ff00ff' : '#666666';
    if (this.selectedOption === 1) {
      canvasContext.ctx.shadowColor = backColor;
      canvasContext.ctx.shadowBlur = 15;
    }
    canvasContext.ctx.fillStyle = backColor;
    canvasContext.ctx.fillText('BACK', canvasContext.screenWidth / 2, 550);
    canvasContext.ctx.shadowBlur = 0;

    // Selector arrow
    if (this.selectedOption === 1) {
      canvasContext.ctx.fillStyle = '#ffff00';
      canvasContext.ctx.fillText('>', canvasContext.screenWidth / 2 - 50, 550);
    }
  }
}
