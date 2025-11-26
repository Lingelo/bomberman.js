import { GAMESTATUS } from '../game/game-status';
import { Music } from '../utils/music';
import { Menu } from '../menus/menu';
import { COLOR } from '../game/color';
import { Character } from '../game/character';
import { DIRECTION, type Direction } from '../game/direction';
import { Blast } from '../game/blast';
import { Bomb } from '../game/bomb';
import { CharacterStatus } from '../game/character-status';
import { BONUSTYPE } from '../game/bonus-type';
import { ARENAS } from '../game/arenas';
import { Action } from './actions';
import type { GameState, GameAction, KeymapType } from '../types';

const map = [
  [12, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 16],
  [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
  [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
  [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
  [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
  [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
  [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
  [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
  [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
  [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
  [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
  [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
  [8, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4],
];

// Load options from localStorage
const loadVolume = (): number => {
  const saved = localStorage.getItem('bomberman-volume');
  return saved ? parseInt(saved, 10) : 50;
};

const loadKeymap = (): KeymapType => {
  const saved = localStorage.getItem('bomberman-keymap');
  return (saved as KeymapType) || 'ZQSD';
};

const initialState: GameState = {
  gameStatus: GAMESTATUS.INITIALISATION,
  selectedOption: 1,
  currentScreenCode: 'TITLE',
  map,
  characters: [],
  bonus: [],
  bombs: [],
  walls: [],
  blasts: [],
  selectedArena: 0,
  volume: loadVolume(),
  keymap: loadKeymap(),
};

export function reducer(action: GameAction, state: GameState = initialState): GameState {
  switch (action.type) {
    case Action.UP:
      Music.menuBeep().then((song) => song.play());
      return {
        ...state,
        selectedOption: state.selectedOption - 1,
      };

    case Action.DOWN:
      Music.menuBeep().then((song) => song.play());
      return {
        ...state,
        selectedOption: state.selectedOption + 1,
      };

    case Action.LEFT:
      Music.menuBeep().then((song) => song.play());
      if (state.currentScreenCode === 'TITLE') {
        const newArena = (state.selectedArena - 1 + ARENAS.length) % ARENAS.length;
        return {
          ...state,
          selectedArena: newArena,
          map: ARENAS[newArena].map,
        };
      }
      if (state.currentScreenCode === 'OPTIONS' && state.selectedOption === 1) {
        const newVolume = Math.max(0, state.volume - 10);
        localStorage.setItem('bomberman-volume', newVolume.toString());
        return {
          ...state,
          volume: newVolume,
        };
      }
      if (state.currentScreenCode === 'OPTIONS' && state.selectedOption === 2) {
        const keymaps: KeymapType[] = ['ZQSD', 'WASD', 'ARROWS'];
        const currentIndex = keymaps.indexOf(state.keymap);
        const newIndex = (currentIndex - 1 + keymaps.length) % keymaps.length;
        localStorage.setItem('bomberman-keymap', keymaps[newIndex]);
        return {
          ...state,
          keymap: keymaps[newIndex],
        };
      }
      return state;

    case Action.RIGHT:
      Music.menuBeep().then((song) => song.play());
      if (state.currentScreenCode === 'TITLE') {
        const newArena = (state.selectedArena + 1) % ARENAS.length;
        return {
          ...state,
          selectedArena: newArena,
          map: ARENAS[newArena].map,
        };
      }
      if (state.currentScreenCode === 'OPTIONS' && state.selectedOption === 1) {
        const newVolume = Math.min(100, state.volume + 10);
        localStorage.setItem('bomberman-volume', newVolume.toString());
        return {
          ...state,
          volume: newVolume,
        };
      }
      if (state.currentScreenCode === 'OPTIONS' && state.selectedOption === 2) {
        const keymaps: KeymapType[] = ['ZQSD', 'WASD', 'ARROWS'];
        const currentIndex = keymaps.indexOf(state.keymap);
        const newIndex = (currentIndex + 1) % keymaps.length;
        localStorage.setItem('bomberman-keymap', keymaps[newIndex]);
        return {
          ...state,
          keymap: keymaps[newIndex],
        };
      }
      return state;

    case Action.ENTER: {
      const newScreen = Menu.getNewScreen(
        state.selectedOption,
        state.currentScreenCode,
        state.gameStatus
      );

      // No valid action - play error sound or no sound
      if (!newScreen) {
        // Trying to start game without enough players
        if (state.currentScreenCode === 'TITLE' && state.selectedOption === 1 && state.gameStatus !== GAMESTATUS.READY) {
          Music.menuPrevious().then((song) => song.play());
        }
        // No sound for other invalid actions
        return state;
      }

      // Valid action - play appropriate sound
      if (
        newScreen === 'TITLE' &&
        [GAMESTATUS.INITIALISATION, GAMESTATUS.READY].includes(state.gameStatus as typeof GAMESTATUS.INITIALISATION)
      ) {
        Music.menuPrevious().then((song) => song.play());
      } else {
        Music.menuNext().then((song) => song.play());
      }

      return {
        ...state,
        selectedOption: 1,
        currentScreenCode: newScreen,
      };
    }

    case Action.ADD_PLAYER: {
      const characters = [...state.characters];
      let gameStatus = state.gameStatus;
      const payload = action.payload as { index: number };

      if ([GAMESTATUS.INITIALISATION, GAMESTATUS.READY].includes(gameStatus as typeof GAMESTATUS.INITIALISATION)) {
        if (!characters.find((character) => character.color === payload.index)) {
          switch (payload.index) {
            case COLOR.WHITE:
              characters.push(new Character(COLOR.WHITE, 1, 1, DIRECTION.DOWN));
              break;
            case COLOR.BLACK:
              characters.push(new Character(COLOR.BLACK, 1, 11, DIRECTION.DOWN));
              break;
            case COLOR.BLUE:
              characters.push(new Character(COLOR.BLUE, 13, 1, DIRECTION.DOWN));
              break;
            case COLOR.RED:
              characters.push(new Character(COLOR.RED, 13, 11, DIRECTION.DOWN));
              break;
          }
        }

        if (characters.length >= 2) {
          gameStatus = GAMESTATUS.READY;
        }
      }

      return {
        ...state,
        characters,
        gameStatus,
      };
    }

    case Action.ADD_BOT: {
      const characters = [...state.characters];
      let gameStatus = state.gameStatus;

      if ([GAMESTATUS.INITIALISATION, GAMESTATUS.READY].includes(gameStatus as typeof GAMESTATUS.INITIALISATION)) {
        // Count existing bots
        const botCount = characters.filter((c) => c.isBot).length;

        // Limit to 3 bots maximum (P1 is always human)
        if (botCount >= 3) {
          return state;
        }

        // Get available colors in display order (P2=BLACK, P3=RED, P4=BLUE)
        const availableColors = [COLOR.BLACK, COLOR.RED, COLOR.BLUE].filter(
          (color) => !characters.find((c) => c.color === color)
        );

        if (availableColors.length > 0) {
          const botColor = availableColors[0];
          let botChar: Character;

          switch (botColor) {
            case COLOR.BLACK:
              botChar = new Character(COLOR.BLACK, 1, 11, DIRECTION.DOWN);
              break;
            case COLOR.BLUE:
              botChar = new Character(COLOR.BLUE, 13, 1, DIRECTION.DOWN);
              break;
            case COLOR.RED:
            default:
              botChar = new Character(COLOR.RED, 13, 11, DIRECTION.DOWN);
              break;
          }

          botChar.isBot = true;
          characters.push(botChar);

          if (characters.length >= 2) {
            gameStatus = GAMESTATUS.READY;
          }
        }
      }

      return {
        ...state,
        characters,
        gameStatus,
      };
    }

    case Action.MENU_OVERFLOW: {
      const payload = action.payload as { selectedOption: number };
      return {
        ...state,
        selectedOption: payload.selectedOption,
      };
    }

    case Action.RESET: {
      setTimeout(() => {
        location.reload();
      }, 100);
      return state;
    }

    case Action.ADD_BLAST: {
      const payload = action.payload as { bomb: Bomb; character: Character };
      state.blasts.push(
        new Blast(
          payload.bomb,
          payload.character,
          state.map,
          state.walls,
          state.bombs,
          state.characters,
          state.bonus
        )
      );
      return {
        ...state,
      };
    }

    case Action.BLAST_VANISHED: {
      const payload = action.payload as { blast: Blast };
      state.blasts.splice(state.blasts.indexOf(payload.blast), 1);
      return {
        ...state,
      };
    }

    case Action.DROP_BOMB: {
      if (state.gameStatus === GAMESTATUS.IN_PROGRESS) {
        const payload = action.payload as { color: number };
        const character = state.characters.find((c) => c.color === payload.color);
        if (character && character.bombUsed < character.bombMax) {
          character.bombUsed++;
          const bomb = new Bomb(character);
          state.bombs.push(bomb);
          Music.bombDrop().then((song) => song.play());
        }
      }
      return {
        ...state,
      };
    }

    case Action.BOMB_EXPLODED: {
      const payload = action.payload as { bomb: Bomb };
      const character = state.characters.find((c) => c.color === payload.bomb.character.color);
      if (character) {
        character.bombUsed--;
      }
      state.bombs.splice(state.bombs.indexOf(payload.bomb), 1);
      Music.explosion().then((song) => song.play());
      return {
        ...state,
      };
    }

    case Action.DESTROY: {
      const payload = action.payload as { destroyedX: number; destroyedY: number };
      if (state.walls[payload.destroyedX][payload.destroyedY]) {
        state.walls[payload.destroyedX][payload.destroyedY]!.destroyed = true;
      }
      return {
        ...state,
      };
    }

    case Action.KILL: {
      const payload = action.payload as { character: Character };
      const character = state.characters.find((c) => c.color === payload.character.color);
      if (character) {
        character.status = CharacterStatus.DEAD;
      }
      Music.death().then((song) => song.play());
      return {
        ...state,
      };
    }

    case Action.VICTORY: {
      const payload = action.payload as { character: Character };
      const player = state.characters.find((c) => c.color === payload.character.color);
      if (player) {
        player.status = CharacterStatus.VICTORY;
      }
      Music.win().then((song) => song.play());
      return {
        ...state,
        gameStatus: GAMESTATUS.END,
      };
    }

    case Action.INIT_GAME: {
      const payload = action.payload as {
        walls: typeof state.walls;
        bonus: typeof state.bonus;
        characters?: typeof state.characters;
      };
      return {
        ...state,
        gameStatus: GAMESTATUS.IN_PROGRESS,
        walls: payload.walls,
        bonus: payload.bonus,
        characters: payload.characters || state.characters,
      };
    }

    case Action.GET_BONUS: {
      const payload = action.payload as { bonus: { type: number; x: number; y: number }; playerColor: number };
      const character = state.characters.find((c) => c.color === payload.playerColor);

      if (character) {
        switch (payload.bonus.type) {
          case BONUSTYPE.POWER:
            character.radius++;
            break;
          case BONUSTYPE.BOMB:
            character.bombMax++;
            break;
          case BONUSTYPE.SPEED:
            if (character.animationDuration > 8) {
              character.animationDuration = character.animationDuration - 1;
            }
            break;
        }
      }

      const bonusIndex = state.bonus.findIndex(
        (b) => b.x === payload.bonus.x && b.y === payload.bonus.y
      );
      if (bonusIndex > -1) {
        state.bonus.splice(bonusIndex, 1);
      }
      Music.bonus().then((song) => song.play());

      return {
        ...state,
      };
    }

    case Action.MOVE: {
      if (state.gameStatus === GAMESTATUS.IN_PROGRESS) {
        const payload = action.payload as { color: number; direction: Direction };
        const character = state.characters.find((c) => c.color === payload.color);
        if (character) {
          character.move(payload.direction, state);
        }
      }
      return {
        ...state,
      };
    }

    case Action.BONUS_EXPLODED: {
      const payload = action.payload as { item: { x: number; y: number } };
      const bonusIndex = state.bonus.findIndex(
        (b) => b.x === payload.item.x && b.y === payload.item.y
      );
      if (bonusIndex > -1) {
        state.bonus.splice(bonusIndex, 1);
      }
      return {
        ...state,
      };
    }

    case Action.VOLUME_UP: {
      const newVolume = Math.min(100, state.volume + 10);
      localStorage.setItem('bomberman-volume', newVolume.toString());
      Music.menuBeep().then((song) => {
        song.volume = newVolume / 100;
        song.play();
      });
      return {
        ...state,
        volume: newVolume,
      };
    }

    case Action.VOLUME_DOWN: {
      const newVolume = Math.max(0, state.volume - 10);
      localStorage.setItem('bomberman-volume', newVolume.toString());
      Music.menuBeep().then((song) => {
        song.volume = newVolume / 100;
        song.play();
      });
      return {
        ...state,
        volume: newVolume,
      };
    }

    case Action.CHANGE_KEYMAP: {
      const keymaps: KeymapType[] = ['ZQSD', 'WASD', 'ARROWS'];
      const payload = action.payload as { direction: 'next' | 'prev' };
      const currentIndex = keymaps.indexOf(state.keymap);
      let newIndex: number;

      if (payload.direction === 'next') {
        newIndex = (currentIndex + 1) % keymaps.length;
      } else {
        newIndex = (currentIndex - 1 + keymaps.length) % keymaps.length;
      }

      localStorage.setItem('bomberman-keymap', keymaps[newIndex]);
      Music.menuBeep().then((song) => song.play());
      return {
        ...state,
        keymap: keymaps[newIndex],
      };
    }

    case 'SET_SCREEN': {
      const payload = action.payload as { screen: string };
      return {
        ...state,
        currentScreenCode: payload.screen,
        selectedOption: 1,
      };
    }

    default:
      return state;
  }
}
