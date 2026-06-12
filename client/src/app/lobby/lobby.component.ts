import { Component, computed, effect, inject, signal } from '@angular/core';
import { Player } from '../utils/player.interface';
import { Router, RouterLink } from '@angular/router';
import { LobbyStore } from '../data/lobby.store';

@Component({
    selector: 'app-lobby',
    templateUrl: './lobby.component.html',
    imports: [RouterLink],
})
export class Lobby {
    lobbyStore = inject(LobbyStore);

    playersA = computed(() =>
        this.lobbyStore.playersInLobby().filter((p: Player) => p.team === 1),
    );
    playersB = computed(() =>
        this.lobbyStore.playersInLobby().filter((p: Player) => p.team === 2),
    );

    showInfoMessage = signal(false);

    infoMessageEffect = effect(() => {
        const message = this.lobbyStore.connectionInfoMessage();
        const isHost = this.lobbyStore.isHost();
        if (message && !isHost) {
            this.showInfoMessage.set(true);
            setTimeout(() => {
                this.showInfoMessage.set(false);
                this.lobbyStore.clearInfoMessage();
            }, 5000);
        }
    });

    startGame() {
        this.lobbyStore.startGame();
    }
}
