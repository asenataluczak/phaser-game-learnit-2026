import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { Player } from '../utils/player.interface';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    private router = inject(Router);
    private socket: Socket;

    playersInLobbyChange$ = new Subject<Array<Player>>();
    gameIdChange$ = new Subject<string>();

    connect(playerName: string, gameId: string, userId: string) {
        this.socket = io('http://localhost:3000', {
            query: {
                username: playerName,
                gameId,
                userId,
            },
        });

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
    }
}
