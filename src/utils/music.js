export class Music {

    static theme() {
        const themeMusic = new Audio("assets/title.wav");
        themeMusic.load();
        return themeMusic;
    }
}