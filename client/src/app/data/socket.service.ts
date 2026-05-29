import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { Player } from '../utils/player.interface';

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

    connect(playerName: string, gameId: string, userId: string) {
        this.socket = io('http://localhost:3000', {
            query: {
                username: playerName,
                gameId,
                userId,
            },
        });
        socket = this.socket;
        console.log(this.socket);

        this.socket.on('connect', () => {
            console.log('Connected to Socket.IO server', this.socket.id);
        });

        this.socket.on('disconnect', () => {
            this.router.navigateByUrl('/');
        });

        this.socket.on('USERS_IN_LOBBY_CHANGE', (res) => {
            this.playersInLobbyChange$.next(res.users);
            this.gameIdChange$.next(res.gameId);
        });

        this.socket.on('GAME_STARTED', (snapshot) => {
            this.gameInitialDataChange$.next(snapshot);
        });
    }

    emitStartGame(gameId: string) {
        this.socket.emit('START_GAME', { gameId });
    }
}
