import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { LobbyStore } from '../data/lobby.store';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/internal/operators/filter';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-main-menu',
    templateUrl: './main-menu.component.html',
    imports: [ReactiveFormsModule, RouterLink],
})
export class MainMenu implements OnInit {
    readonly lobbyStore = inject(LobbyStore);
    private readonly destroyRef = inject(DestroyRef);

    gameIdInput = new FormControl(this.lobbyStore.gameId() || '');

    ngOnInit() {
        this.gameIdInput.valueChanges
            .pipe(
                filter(
                    (value) =>
                        value !== this.lobbyStore.gameId() &&
                        !!this.lobbyStore.connectionErrorMessage(),
                ),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => {
                this.lobbyStore.resetConnectionError();
            });
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
