import { Component, inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SocketService } from '../data/socket.service';
import { LobbyStore } from '../data/lobby.store';

@Component({
    selector: 'app-main-menu',
    templateUrl: './main-menu.component.html',
})
export class MainMenu {
    private readonly socketService = inject(SocketService);
    readonly lobbyStore = inject(LobbyStore);

    constructor() {
        console.log('main menu constructor');
    }

    connect(playerName: string, gameId?: string) {
        this.lobbyStore.connectNewUser(playerName, gameId || '');
    }

    createGame(playerName: string) {
        if (!playerName) return;
        this.lobbyStore.createGame(playerName);
    }

    joinGame(playerName: string, gameId: string) {
        if (!playerName || !gameId) return;
        this.lobbyStore.joinGame(playerName, gameId);
    }
}
