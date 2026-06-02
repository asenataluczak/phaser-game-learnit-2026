import { Component, inject } from '@angular/core';
import { LobbyStore } from '../data/lobby.store';

@Component({
    selector: 'app-main-menu',
    templateUrl: './main-menu.component.html',
})
export class MainMenu {
    readonly lobbyStore = inject(LobbyStore);

    createGame(playerName: string) {
        if (!playerName) return;
        this.lobbyStore.createGame(playerName);
    }

    joinGame(playerName: string, gameId: string) {
        if (!playerName || !gameId) return;
        this.lobbyStore.joinGame(playerName, gameId);
    }
}
