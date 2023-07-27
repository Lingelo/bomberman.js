export class Music {

    static menuNext() {

        return import('../assets/songs/MENU_NEXT.ogg').then((module) => {
            const song = module.default;
            const audio = new Audio(song);
            audio.load();
            return audio;
        })

    }

    static menuPrevious() {

        return import('../assets/songs/MENU_PREVIOUS.ogg').then((module) => {
            const song = module.default;
            const audio = new Audio(song);
            audio.load();
            return audio;
        })

    }

    static menuBeep() {

        return import('../assets/songs/MENU_BEEP.ogg').then((module) => {
            const song = module.default;
            const audio = new Audio(song);
            audio.load();
            return audio;
        })

    }

    static bombDrop() {

        return import('../assets/songs/BOMB_DROP.ogg').then((module) => {
            const song = module.default;
            const audio = new Audio(song);
            audio.load();
            return audio;
        })

    }

    static death() {

        return import('../assets/songs/BOMBER_DEATH.ogg').then((module) => {
            const song = module.default;
            const audio = new Audio(song);
            audio.load();
            return audio;
        })

    }

    static explosion() {
        return import('../assets/songs/EXPLOSION_02_2.ogg').then((module) => {
            const song = module.default;
            const audio = new Audio(song);
            audio.load();
            return audio;
        })
    }

    static bonus() {
        return import('../assets/songs/BREAK_1.ogg').then((module) => {
            const song = module.default;
            const audio = new Audio(song);
            audio.load();
            return audio;
        })
    }

    static win() {

        return import('../assets/songs/VICTORY.ogg').then((module) => {
            const song = module.default;
            const audio = new Audio(song);
            audio.load();
            return audio;
        })

    }
}
