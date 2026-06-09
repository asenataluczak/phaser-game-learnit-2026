import {
    patchState,
    signalStore,
    withComputed,
    withHooks,
    withMethods,
    withState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
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
    initialGameData: any;
    connectionErrorMessage: string | null;
}

const initialState: LobbyState = {
    gameId: null,
    user: null,
    player: null,
    playersInLobby: [],
    initialGameData: null,
    connectionErrorMessage: null,
};

export const LobbyStore = signalStore(
    { providedIn: 'root' },
    withState<LobbyState>(initialState),
    withDevtools('lobby'),
    withComputed((store) => ({
        isHost: computed(() => store.player()?.host),
        player: computed(() =>
            store
                .playersInLobby()
                .find((p: Player) => p.id === store.user()?.id),
        ),
    })),
    withMethods((store, socketService = inject(SocketService)) => ({
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

            if (socketService.socket?.connected) return;
            socketService.connect(name, newUserId, gameId || '');
        },
        startGame() {
            socketService.emitStartGame(store.gameId() || '');
        },
        createGame(name: string) {
            if (!socketService.socket?.connected) {
                this.connectNewUser(name);
                return;
            }
            socketService.emitCreateGame();
        },
        joinGame(name: string, gameId: string) {
            if (!socketService.socket?.connected) {
                this.connectNewUser(name, gameId);
                return;
            }
            socketService.emitJoinGame(gameId);
        },
        resetConnectionError() {
            patchState(store, {
                connectionErrorMessage: null,
                gameId: null,
            });
        },
    })),
    withHooks(
        (store, router = inject(Router), socket = inject(SocketService)) => ({
            onInit() {
                const userId = localStorage.getItem('USER_ID');
                const username = localStorage.getItem('USER_NAME');
                patchState(store, {
                    user: {
                        id: userId || '',
                        name: username || '',
                    },
                });

                socket.playersInLobbyChange$.subscribe((players) => {
                    console.log(players);
                    const currentUser = players.find(
                        (p: Player) => p.id === store.user()?.id,
                    );

                    if (!currentUser) {
                        console.log(
                            'Current user not found in lobby, navigating to main menu',
                            currentUser,
                            players,
                        );
                        router.navigateByUrl('/');
                        return;
                    }

                    patchState(store, {
                        playersInLobby: players,
                    });
                });

                socket.gameIdChange$.subscribe((gameId) => {
                    patchState(store, {
                        gameId,
                    });
                    if (gameId === 'undefined') return;
                    if (gameId && !store.initialGameData()) {
                        router.navigate([`/lobby/${gameId}`]);
                    }
                });

                socket.gameInitialDataChange$.subscribe((snapshot) => {
                    const path = snapshot.gameInProgress ? '/game' : '/lobby';
                    router.navigate([path, snapshot.gameId]);

                    patchState(store, {
                        initialGameData: snapshot,
                    });
                });

                socket.disconnected$.subscribe(() => {
                    router.navigate(['/']);

                    patchState(store, {
                        connectionErrorMessage: 'Game in progress or does not exist',
                    });
                });

                router.events
                    .pipe(filter((event) => event instanceof ActivationEnd))
                    .subscribe((route) => {
                        const gameId = (route as ActivationEnd).snapshot.params[
                            'id'
                        ];

                        if (!window.location.href.includes('/game/')) {
                            socket.emitGameStop();
                        }

                        console.log('Route change, gameId:', gameId);
                        if (!gameId) return;
                        const userId = localStorage.getItem('USER_ID');
                        const username = localStorage.getItem('USER_NAME');

                        patchState(store, {
                            gameId,
                        });
                        if (!userId || !username) {
                            router.navigateByUrl('/');
                            return;
                        }

                        patchState(store, {
                            user: {
                                id: userId,
                                name: username,
                            },
                        });
                        if (!socket.socket?.connected) {
                            socket.connect(username, userId, gameId);
                        }
                    });
            },
        }),
    ),
);
