import { Component, computed, effect, inject, signal } from '@angular/core';
import { Player } from '../utils/player.interface';
import { Router } from '@angular/router';
import { LobbyStore } from '../data/lobby.store';

@Component({
    selector: 'app-lobby',
    templateUrl: './lobby.component.html',
})
export class Lobby {
    private readonly router = inject(Router);

    lobbyStore = inject(LobbyStore);

    playersA = computed(() =>
        this.lobbyStore.playersInLobby().filter((p: Player) => p.team === 1),
    );
    playersB = computed(() =>
        this.lobbyStore.playersInLobby().filter((p: Player) => p.team === 2),
    );

    startGame() {
        this.lobbyStore.startGame();
    }
}
