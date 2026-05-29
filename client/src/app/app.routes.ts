import { Routes } from '@angular/router';
import { MainMenu } from './main-menu/main-menu.component';
import { Lobby } from './lobby/lobby.component';
import { PhaserGame } from './phaser-game.component';

export const routes: Routes = [
    {
        path: '',
        component: MainMenu,
    },
    {
        path: 'lobby/:id',
        component: Lobby,
    },
    {
        path: 'game/:id',
        component: PhaserGame,
    },
];
