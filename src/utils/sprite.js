import title from '../assets/images/title_bombers.png';
import ground from '../assets/images/chemin.png';
import wall from '../assets/images/arena_wall.png';
import walk from '../assets/images/arena_bomber_walk.png';
import death from '../assets/images/arena_bomber_death.png';
import bomb from '../assets/images/arena_bomb.png';
import flame from '../assets/images/arena_flame.png';
import item from '../assets/images/arena_item.png';
import winner from '../assets/images/winner_bomber.png';

export class Sprite {
  static titleWallpaper() {
    if (this.titleImage) {
      return this.titleImage;
    }
    this.titleImage = new Image();
    this.titleImage.src = title;

    return this.titleImage;
  }

  static ground() {
    if (this.groundImage) {
      return this.groundImage;
    }
    this.groundImage = new Image();
    this.groundImage.src = ground;
    return this.groundImage;
  }

  static wall() {
    if (this.wallImage) {
      return this.wallImage;
    }
    this.wallImage = new Image();
    this.wallImage.src = wall;
    this.wallImage.width = 32;
    this.wallImage.height = 32;
    return this.wallImage;
  }

  static characterAlive() {
    if (this.characterAliveImage) {
      return this.characterAliveImage;
    }
    this.characterAliveImage = new Image();
    this.characterAliveImage.src = walk;
    this.characterAliveImage.width = 43;
    this.characterAliveImage.height = 45;
    return this.characterAliveImage;
  }

  static characterDead() {
    if (this.characterDeadImage) {
      return this.characterDeadImage;
    }
    this.characterDeadImage = new Image();
    this.characterDeadImage.src = death;
    this.characterDeadImage.width = 517 / 12;
    this.characterDeadImage.height = 316 / 7;
    return this.characterDeadImage;
  }

  static bomb() {
    if (this.bombImage) {
      return this.bombImage;
    }
    this.bombImage = new Image();
    this.bombImage.src = bomb;
    this.bombImage.width = 100 / 3;
    this.bombImage.height = 34;
    return this.bombImage;
  }

  static flame() {
    if (this.flameImage) {
      return this.flameImage;
    }
    this.flameImage = new Image();
    this.flameImage.src = flame;
    this.flameImage.width = 925 / 28;
    this.flameImage.height = 34;
    return this.flameImage;
  }

  static bonus() {
    if (this.itemImage) {
      return this.itemImage;
    }
    this.itemImage = new Image();
    this.itemImage.src = item;
    this.itemImage.width = 529 / 16;
    this.itemImage.height = 34;
    return this.itemImage;
  }

  static characterVictory() {
    if (this.imageVictory) {
      return this.imageVictory;
    }
    this.imageVictory = new Image();
    this.imageVictory.width = 101 / 4;
    this.imageVictory.height = 166 / 5;
    this.imageVictory.src = winner;
    return this.imageVictory;
  }
}
