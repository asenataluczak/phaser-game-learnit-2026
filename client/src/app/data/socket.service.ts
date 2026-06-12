import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { Player } from '../utils/player.interface';
import { environment } from '../../environments/environment';

export let socket: Socket;

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    private router = inject(Router);
    socket: Socket;

    playersInLobbyChange$ = new Subject<Array<Player>>();
    gameInitialDataChange$ = new Subject<any>();
    gameIdChange$ = new Subject<string>();
    disconnected$ = new Subject<any>();
    gameEnded$ = new Subject<void>();

    connect(playerName: string, userId: string, gameId?: string) {
        this.socket = io(environment.API_URL, {
            query: {
                username: playerName,
                gameId,
                userId,
            },
            path: environment.API_PATH,
        });
        socket = this.socket;
        console.log(this.socket);

        this.socket.on('connect', () => {
            console.log('Connected to Socket.IO server', this.socket.id);
        });

        this.socket.on('disconnect', (reason) => {
            if (reason === 'io server disconnect') {
                this.disconnected$.next(reason);
            }
        });

        this.socket.on('USERS_IN_LOBBY_CHANGE', (res) => {
            this.playersInLobbyChange$.next(res.users);
        });

        this.socket.on('GAME_ID_ASSIGNED', ({ gameId }) => {
            this.gameIdChange$.next(gameId);
        });

        this.socket.on('GAME_STARTED', (snapshot) => {
            this.gameInitialDataChange$.next(snapshot);
        });

        this.socket.on('GAME_ENDED', () => {
            this.gameEnded$.next();
        });
    }

    emitStartGame(gameId: string) {
        this.socket.emit('START_GAME', { gameId });
    }

    emitCreateGame() {
        this.socket.emit('CREATE_GAME');
    }

    emitJoinGame(gameId: string) {
        this.socket.emit('JOIN_GAME', { gameId });
    }

    emitLeaveGame(gameId: string) {
        this.socket.emit('LEAVE_GAME', { gameId });
    }

    emitEndGame(gameId: string) {
        this.socket.emit('END_GAME', { gameId });
    }
}
