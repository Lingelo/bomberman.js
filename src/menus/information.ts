import { getState, subscribe } from '../state/redux';
import { Menu } from './menu';
import type { CanvasContext } from '../types';

export class Information extends Menu {
  constructor() {
    super();
    this.code = 'INFORMATION';
    this.selectedOption = 1;

    subscribe(() => {
      // Only manage overflow if we're still on this screen
      if (getState().currentScreenCode === 'INFORMATION') {
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
    canvasContext.ctx.fillText('HOW TO PLAY', canvasContext.screenWidth / 2, 160);
    canvasContext.ctx.shadowBlur = 0;

    // Game description
    canvasContext.ctx.font = '6px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText(
      'DESTROY WALLS AND ELIMINATE',
      canvasContext.screenWidth / 2,
      200
    );
    canvasContext.ctx.fillText(
      'YOUR OPPONENTS WITH BOMBS!',
      canvasContext.screenWidth / 2,
      215
    );

    // Controls section
    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ff00ff';
    canvasContext.ctx.fillText('CONTROLS', canvasContext.screenWidth / 2, 250);

    canvasContext.ctx.font = '6px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.fillText('MENU:', canvasContext.screenWidth / 2 - 80, 275);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('ARROWS = NAVIGATE', canvasContext.screenWidth / 2 + 30, 275);

    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.fillText('JOIN:', canvasContext.screenWidth / 2 - 80, 295);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('SPACE = ADD P1', canvasContext.screenWidth / 2 + 30, 295);

    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.fillText('BOTS:', canvasContext.screenWidth / 2 - 80, 315);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('B = ADD CPU', canvasContext.screenWidth / 2 + 30, 315);

    // Keyboard controls
    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ff00ff';
    canvasContext.ctx.fillText('KEYBOARD', canvasContext.screenWidth / 2, 350);

    canvasContext.ctx.font = '6px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.fillText('MOVE:', canvasContext.screenWidth / 2 - 80, 375);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('ZQSD / ARROWS', canvasContext.screenWidth / 2 + 30, 375);

    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.fillText('BOMB:', canvasContext.screenWidth / 2 - 80, 395);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('SPACE', canvasContext.screenWidth / 2 + 30, 395);

    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.fillText('QUIT:', canvasContext.screenWidth / 2 - 80, 415);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('ESC', canvasContext.screenWidth / 2 + 30, 415);

    // Gamepad controls
    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ff00ff';
    canvasContext.ctx.fillText('GAMEPADS (P1-P4)', canvasContext.screenWidth / 2, 450);

    canvasContext.ctx.font = '6px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('CONNECT = AUTO JOIN', canvasContext.screenWidth / 2, 475);
    canvasContext.ctx.fillText('D-PAD = MOVE  A = BOMB', canvasContext.screenWidth / 2, 490);

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
