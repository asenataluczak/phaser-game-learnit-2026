import * as Phaser from 'phaser';

// Class to preload all the assets
// Remember you can load this assets in another scene if you need it
export class Preloader extends Phaser.Scene {
    constructor() {
        super({ key: 'Preloader' });
    }

    preload() {
        // Load all the assets
        this.load.setPath('assets');
        this.load.image('field', 'field.png');

        this.load.image('player', 'player.png');
        this.load.image('ball', 'ball.png');

        // Fonts
        this.load.bitmapFont(
            'pixelfont',
            'fonts/pixelfont.png',
            'fonts/pixelfont.xml',
        );
        this.load.image('knighthawks', 'fonts/knight3.png');

        // Event to update the loading bar
        // this.load.on("progress", (progress: any) => {
        //     console.log("Loading: " + Math.round(progress * 100) + "%");
        // });
    }

    create() {
        // When all the assets are loaded go to the next scene
        this.scene.start("MainScene");
    }
}
