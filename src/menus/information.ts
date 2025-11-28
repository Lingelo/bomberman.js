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
    const centerX = canvasContext.screenWidth / 2;

    // Title
    canvasContext.ctx.font = '14px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#00ffff';
    canvasContext.ctx.shadowColor = '#00ffff';
    canvasContext.ctx.shadowBlur = 10;
    canvasContext.ctx.fillText('HOW TO PLAY', centerX, 130);
    canvasContext.ctx.shadowBlur = 0;

    // Controls section - LEFT SIDE
    canvasContext.ctx.font = '9px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ff00ff';
    canvasContext.ctx.fillText('CONTROLS', centerX - 130, 165);

    canvasContext.ctx.font = '7px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.textAlign = 'left';
    const leftX = centerX - 220;

    canvasContext.ctx.fillText('MOVE', leftX, 190);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('ZQSD / WASD / ARROWS', leftX + 90, 190);

    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.fillText('BOMB', leftX, 210);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('SPACE', leftX + 90, 210);

    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.fillText('DETONATE', leftX, 230);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('SHIFT (WITH REMOTE)', leftX + 90, 230);

    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.fillText('ADD BOT', leftX, 250);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('B (IN MENU)', leftX + 90, 250);

    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.fillText('QUIT', leftX, 270);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('ESC', leftX + 90, 270);

    // Power-ups section - RIGHT SIDE
    canvasContext.ctx.textAlign = 'center';
    canvasContext.ctx.font = '9px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ff00ff';
    canvasContext.ctx.fillText('POWER-UPS', centerX + 130, 165);

    canvasContext.ctx.font = '7px "Press Start 2P"';
    canvasContext.ctx.textAlign = 'left';
    const rightX = centerX + 30;

    canvasContext.ctx.fillStyle = '#00ff00';
    canvasContext.ctx.fillText('BOMB', rightX, 190);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('+1 BOMB', rightX + 75, 190);

    canvasContext.ctx.fillStyle = '#00ff00';
    canvasContext.ctx.fillText('FIRE', rightX, 210);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('+1 RANGE', rightX + 75, 210);

    canvasContext.ctx.fillStyle = '#00ff00';
    canvasContext.ctx.fillText('SPEED', rightX, 230);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('FASTER', rightX + 75, 230);

    canvasContext.ctx.fillStyle = '#00ff00';
    canvasContext.ctx.fillText('KICK', rightX, 250);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('PUSH BOMBS', rightX + 75, 250);

    canvasContext.ctx.fillStyle = '#00ff00';
    canvasContext.ctx.fillText('PUNCH', rightX, 270);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('THROW BOMBS', rightX + 75, 270);

    canvasContext.ctx.fillStyle = '#00ff00';
    canvasContext.ctx.fillText('REMOTE', rightX, 290);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('MANUAL DET.', rightX + 75, 290);

    canvasContext.ctx.fillStyle = '#ff0000';
    canvasContext.ctx.fillText('SKULL', rightX, 310);
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('CURSE!', rightX + 75, 310);

    // Power-up details
    canvasContext.ctx.textAlign = 'center';
    canvasContext.ctx.font = '9px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ff00ff';
    canvasContext.ctx.fillText('SPECIAL MOVES', centerX, 355);

    canvasContext.ctx.font = '7px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.fillText('KICK: WALK INTO BOMB TO PUSH', centerX, 380);
    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.fillText('PUNCH: SPACE ON BOMB TO THROW', centerX, 400);
    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.fillText('REMOTE: SHIFT TO DETONATE', centerX, 420);

    // Skull effects
    canvasContext.ctx.font = '9px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ff0000';
    canvasContext.ctx.fillText('SKULL CURSES (8 SEC)', centerX, 455);

    canvasContext.ctx.font = '7px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('SLOW - FAST - REVERSE - NO/AUTO BOMBS', centerX, 480);

    // Gamepad
    canvasContext.ctx.font = '9px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ff00ff';
    canvasContext.ctx.fillText('GAMEPAD', centerX, 515);

    canvasContext.ctx.font = '7px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText('CONNECT = JOIN | D-PAD = MOVE | A = BOMB', centerX, 540);

    // Back option
    canvasContext.ctx.font = '10px "Press Start 2P"';
    const backColor = this.selectedOption === 1 ? '#ff00ff' : '#666666';
    if (this.selectedOption === 1) {
      canvasContext.ctx.shadowColor = backColor;
      canvasContext.ctx.shadowBlur = 15;
    }
    canvasContext.ctx.fillStyle = backColor;
    canvasContext.ctx.fillText('BACK', centerX, 590);
    canvasContext.ctx.shadowBlur = 0;

    // Selector arrow
    if (this.selectedOption === 1) {
      canvasContext.ctx.fillStyle = '#ffff00';
      canvasContext.ctx.fillText('>', centerX - 50, 590);
    }
  }
}
