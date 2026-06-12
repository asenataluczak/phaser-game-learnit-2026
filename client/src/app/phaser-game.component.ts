import { Component, effect, inject, OnInit } from '@angular/core';
import Phaser from 'phaser';
import StartGame from '../game/main';
import { EventBus } from '../game/EventBus';
import { LobbyStore } from './data/lobby.store';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'phaser-game',
    templateUrl: './phaser-game.component.html',
    standalone: true,
    imports: [RouterLink],
})
export class PhaserGame implements OnInit {
    scene: Phaser.Scene;
    game: Phaser.Game;
    sceneCallback: (scene: Phaser.Scene) => void;
    lobbyStore = inject(LobbyStore);

    constructor() {
        effect(() => {
            const players = this.lobbyStore.playersInLobby();
            const currentUserIndex = this.lobbyStore
                .initialGameData()
                ?.players?.findIndex(
                    (p: any) => p.id === this.lobbyStore.user()?.id,
                );
            const initialGameData = this.lobbyStore.initialGameData();
            if (currentUserIndex >= 0 && players.length && initialGameData) {
                this.game = StartGame(
                    'game-container',
                    players,
                    currentUserIndex,
                    initialGameData,
                );
            }
        });
    }

    ngOnInit() {
        EventBus.on('current-scene-ready', (scene: Phaser.Scene) => {
            this.scene = scene;

            if (this.sceneCallback) {
                this.sceneCallback(scene);
            }
        });
    }

    ngOnDestroy() {
        if (this.game) {
            this.game.destroy(true);
        }
    }
}
