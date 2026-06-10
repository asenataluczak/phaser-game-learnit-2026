import { Game } from 'phaser';
import { Preloader } from './preloader';
import { MainScene } from './scenes/MainScene';
import * as Phaser from 'phaser';
import { HudScene } from './scenes/HudScene';
import { Player } from '../app/utils/player.interface';

// More information about config: https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: Phaser.AUTO,
    parent: 'phaser-container',
    width: 1280,
    height: 720,
    backgroundColor: '#085000',
    pixelArt: true,
    roundPixel: false,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        max: {
            width: 1280,
            height: 720,
        },
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0, x: 0 },
            debug: true,
        },
    },
    scene: [Preloader, MainScene, HudScene],
};

const StartGame = (
    parent: string,
    players: Array<Player>,
    currentUserIndex: number,
    initialGameData: any,
) => {
    const game = new Game({ ...config, parent });
    console.log(players, currentUserIndex);
    game.registry.set('currentUserIndex', currentUserIndex);
    game.registry.set('players', players);
    game.registry.set('initialGameData', initialGameData);
    return game;
};

export default StartGame;
