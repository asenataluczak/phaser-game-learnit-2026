import {
    patchState,
    signalStore,
    withComputed,
    withHooks,
    withMethods,
    withState,
} from '@ngrx/signals';
import { inject } from '@angular/core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { ActivationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { Player, User } from '../utils/player.interface';
import { SocketService } from './socket.service';
import { nanoid } from 'nanoid';

interface LobbyState {
    gameId: string | null;
    user: User | null;
    player: Player | null;
    playersInLobby: Array<Player>;
}

const initialState: LobbyState = {
    gameId: null,
    user: null,
    player: null,
    playersInLobby: [],
};

export const LobbyStore = signalStore(
    { providedIn: 'root' },
    withState<LobbyState>(initialState),
    withDevtools('lobby'),
    withComputed((store) => ({
        isHost: () => store.player()?.host,
        player: () =>
            store
                .playersInLobby()
                .find((p: Player) => p.id === store.user()?.id),
    })),
    withMethods((store, socket = inject(SocketService)) => ({
        connectNewUser(name: string, gameId?: string) {
            const userId = localStorage.getItem('USER_ID');
            const newUserId = userId || nanoid(8);

            if (!userId) {
                localStorage.setItem('USER_ID', newUserId);
            }
            localStorage.setItem('USER_NAME', name || '');

            patchState(store, {
                user: {
                    id: newUserId,
                    name,
                },
            });
            socket.connect(name, gameId || '', newUserId);
        },
        startGame() {
            socket.emitStartGame(store.gameId() || '');
        },
    })),
    withHooks(
        (store, router = inject(Router), socket = inject(SocketService)) => ({
            onInit() {
                socket.playersInLobbyChange$.subscribe((players) => {
                    console.log(players);
                    const currentUser = players.find(
                        (p: Player) => p.id === store.user()?.id,
                    );

                    if (!currentUser) {
                        router.navigateByUrl('/');
                        return;
                    }

                    patchState(store, {
                        playersInLobby: players,
                    });

                    const allPlayersHavePosition = players.every(
                        (p: Player) => p.position?.x && p.position?.y,
                    );
                    if (allPlayersHavePosition) {
                        router.navigate(['/game', store.gameId()]);
                    }
                });

                socket.gameIdChange$.subscribe((gameId) => {
                    console.log('Game ID change received in store', gameId);
                    patchState(store, {
                        gameId,
                    });
                    if (gameId === 'undefined') return;
                    if (gameId && window.location.href.includes('/game/'))
                        return;
                    if (gameId && !window.location.href.includes('/lobby/')) {
                        router.navigate([`/lobby/${gameId}`]);
                    }
                });

                router.events
                    .pipe(filter((event) => event instanceof ActivationEnd))
                    .subscribe((route) => {
                        const gameId = (route as ActivationEnd).snapshot.params[
                            'id'
                        ];

                        console.log('Route change, gameId:', gameId);
                        if (!gameId) return;
                        const userId = localStorage.getItem('USER_ID');
                        const username = localStorage.getItem('USER_NAME');

                        if (!userId || !username) {
                            console.log(
                                'navigated by router events',
                                userId,
                                username,
                            );
                            router.navigateByUrl('/');
                            return;
                        }

                        patchState(store, {
                            user: {
                                id: userId,
                                name: username,
                            },
                        });
                        console.log(store.user());
                        socket.connect(username || '', gameId, userId || '');
                    });
            },
        }),
    ),
);
