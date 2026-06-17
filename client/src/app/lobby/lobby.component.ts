import { Component, computed, effect, inject, signal } from '@angular/core';
import { Player } from '../utils/player.interface';
import { Router, RouterLink } from '@angular/router';
import { LobbyStore } from '../data/lobby.store';
import { SocketService } from '../data/socket.service';

@Component({
    selector: 'app-lobby',
    templateUrl: './lobby.component.html',
    imports: [RouterLink],
})
export class Lobby {
    socket = inject(SocketService)
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

    playersReadyCount = signal('(0/0)');

    playersReadyCountEffect = effect(() => {
        const playersReady = this.lobbyStore.playersInLobby().filter(player => player.ready).length;
        const playersTotalCount = this.lobbyStore.playersInLobby().length
        this.playersReadyCount.set(`(${playersReady}/${playersTotalCount})`);
    });

    isEveryoneReady = signal(false);

    allReadyEffect = effect(() => {
        const areAllReady = this.lobbyStore.playersInLobby().every(player => player.ready);
        this.isEveryoneReady.set(areAllReady);
    });

    startGame() {
        this.lobbyStore.startGame();
    }

    setPlayerReady(state : boolean) {
        this.socket.emitReadyStatusChange(this.lobbyStore.gameId()!, this.lobbyStore.player()!.id!, state);
    }
}
