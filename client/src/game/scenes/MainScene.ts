import { Scene } from 'phaser';
import { Player } from '../gameobjects/Player';
import { Ball } from '../gameobjects/Ball';
import { HudScene } from './HudScene';
import { socket } from '../../app/data/socket.service';
import * as Phaser from 'phaser';
import { unpack } from 'msgpackr';

const SIM_DT_MS = 15;
const INTERP_DELAY_MS = 100; // adjust based on network conditions

export class MainScene extends Scene {
    localPlayerSprite: Player;
    ball: Ball;
    allPlayerSprites: Array<Player> = [];

    scoreA: number = 0;
    scoreB: number = 0;

    currentUserIndex: number;

    initialGameData: any;

    hudScene: HudScene;

    socket: any;

    snapshots: Array<any> = [];

    constructor() {
        super('MainScene');
    }

    create() {
        this.add.image(0, 56, 'field').setOrigin(0, 0);

        if (!this.scene.isPaused()) {
            this.scene.pause();
        }
        this.physics.world.setBounds(0, 82, 1280, 612);

        this.socket = this.game.registry.get('socket');

        this.initialGameData = this.game.registry.get('initialGameData');
        this.currentUserIndex = this.game.registry.get('currentUserIndex');
        console.log(
            'initial game data',
            this.initialGameData,
            this.currentUserIndex,
        );

        this.scoreA = this.initialGameData.score.A;
        this.scoreB = this.initialGameData.score.B;

        this.ball = new Ball(
            this,
            this.initialGameData.b.x,
            this.initialGameData.b.y,
        );
        this.initialGameData.players.forEach((player: any, i: number) => {
            const isCurrentUser = i === this.currentUserIndex;
            const playerSprite = new Player(
                this,
                this.initialGameData.p[i].x,
                this.initialGameData.p[i].y,
                isCurrentUser,
                player.team,
                player.host,
                player.name,
            );
            if (isCurrentUser) {
                this.localPlayerSprite = playerSprite;
            }
            this.allPlayerSprites.push(playerSprite);
        });

        const goalA = this.physics.add
            .staticImage(0, 301, 'goal')
            .setOrigin(0, 0)
            .setFlipX(true);
        goalA.refreshBody();
        const goalB = this.physics.add
            .staticImage(1190, 301, 'goal')
            .setOrigin(0, 0);
        goalB.refreshBody();

        const gameResetListener = (data: any) => {
            console.log('GAME RESET EVENT');
            this.scoreA = data.score.A;
            this.scoreB = data.score.B;
            this.hudScene.resetScore(this.scoreA, this.scoreB);
            this.initialGameData.gameTimeout = data.gameTimeout;
            this.localPlayerSprite.setInteractive();
            this.cameras.main.setAlpha(1);
            this.scene.resume();
        };
        const gameTimeoutUpdateListener = (remainingSeconds: number) => {
            this.hudScene.updateRemainingTime(remainingSeconds);
        };
        const gameoverListener = () => {
            this.handleGameOver();
        };
        const scoreUpdateListener = (score: any) => {
            const scoreForTeam = score.A > this.scoreA ? 1 : 2;
            this.scoreA = score.A;
            this.scoreB = score.B;
            this.localPlayerSprite.disableInteractive();
            this.updateHudScore(scoreForTeam);
        };

        const goalResetListener = () => {
            this.localPlayerSprite.setInteractive();
            this.hudScene.goalReset();
            this.cameras.main.setAlpha(1);
        };

        const snapshotUpdateListener = (snapshot: any) => {
            this.snapshots.push({
                ...unpack(snapshot),
                recvClientTime: performance.now(),
            });
            if (this.snapshots.length > 30) this.snapshots.shift();
        };

        this.scene
            .get('HudScene')
            .events.on(Phaser.Scenes.Events.CREATE, () => {
                console.log('CREATED');
                this.hudScene = this.scene.get('HudScene') as HudScene;
                this.socket.on('GAME_RESET', gameResetListener);
                this.socket.on(
                    'GAME_TIMEOUT_UPDATE',
                    gameTimeoutUpdateListener,
                );
                this.socket.on('GAMEOVER', gameoverListener);
                this.socket.on('SCORE_UPDATE', scoreUpdateListener);
                this.socket.on('GOAL_RESET', goalResetListener);
                this.socket.on('SNAPSHOT_UPDATE', snapshotUpdateListener);

                if (this.initialGameData.gameTimeout === 0) {
                    console.log(this.initialGameData.gameTimeout);
                    this.handleGameOver();
                } else {
                    this.cameras.main.fadeIn(1000, 23, 23, 23);
                }
                this.scene.resume();
            });

        this.scene.launch('HudScene', {
            scoreA: this.scoreA,
            scoreB: this.scoreB,
            gameTimeout: this.initialGameData.gameTimeout,
        });

        this.events.once(Phaser.Scenes.Events.DESTROY, () => {
            console.log('DESTROY');
            this.socket.off('GAME_RESET', gameResetListener);
            this.socket.off('GAME_TIMEOUT_UPDATE', gameTimeoutUpdateListener);
            this.socket.off('GAMEOVER', gameoverListener);
            this.socket.off('SCORE_UPDATE', scoreUpdateListener);
            this.socket.off('GOAL_RESET', goalResetListener);
            this.socket.off('SNAPSHOT_UPDATE', snapshotUpdateListener);
        });
    }

    accumMs = 0;
    override update(time: number, delta: number) {
        this.accumMs += delta;
        while (this.accumMs >= SIM_DT_MS) {
            this.inputTick();
            this.accumMs -= SIM_DT_MS;
        }

        this.interpolateSnapshotPositions();
    }

    inputTick() {
        if (this.localPlayerSprite.isLoadingKick) {
            this.localPlayerSprite.loadKick(
                this.input.activePointer.worldX,
                this.input.activePointer.worldY,
            );
        }

        if (
            this.localPlayerSprite.isLoadingKick &&
            !this.input.activePointer.isDown
        ) {
            const cmd = this.localPlayerSprite.kick();

            if (cmd?.dir) {
                console.log('EMIT KICK', cmd, this.currentUserIndex);
                this.socket.emit('INPUT', cmd, this.currentUserIndex);
            }
        }
    }

    interpolateSnapshotPositions() {
        if (this.snapshots.length < 2) return;

        const now = performance.now();
        const renderTime = now - INTERP_DELAY_MS;

        // Find two snapshots around renderTime
        let a = null,
            b = null;
        for (let i = 0; i < this.snapshots.length - 1; i++) {
            const s0 = this.snapshots[i];
            const s1 = this.snapshots[i + 1];
            if (
                s0.recvClientTime <= renderTime &&
                renderTime <= s1.recvClientTime
            ) {
                a = s0;
                b = s1;
                break;
            }
        }
        if (!a || !b) return;

        const t =
            (renderTime - a.recvClientTime) /
            (b.recvClientTime - a.recvClientTime);

        const ax = a.b.x;
        const ay = a.b.y;
        const bx = b.b.x;
        const by = b.b.y;
        this.ball.setPosition(
            Phaser.Math.Linear(ax, bx, t),
            Phaser.Math.Linear(ay, by, t),
        );

        this.allPlayerSprites.forEach((player: any, i: number) => {
            const ax = a.p[i].x;
            const ay = a.p[i].y;
            const bx = b.p[i].x;
            const by = b.p[i].y;
            if (i === this.currentUserIndex) {
                this.localPlayerSprite.updatePosition(
                    Phaser.Math.Linear(ax, bx, t),
                    Phaser.Math.Linear(ay, by, t),
                );
            } else {
                this.allPlayerSprites[i].updatePosition(
                    Phaser.Math.Linear(ax, bx, t),
                    Phaser.Math.Linear(ay, by, t),
                );
            }
        });
    }

    private handleGameOver() {
        this.cameras.main.setAlpha(0.1);
        this.hudScene.showGameOverScreen(
            this.scoreA,
            this.scoreB,
            this.localPlayerSprite.isHost,
            () => {
                this.socket.emit('RESTART_GAME', {});
            },
        );
        if (!this.scene.isPaused()) {
            this.scene.pause();
        }
    }

    private updateHudScore(team?: 1 | 2) {
        if (!team) return;
        this.hudScene.updateScore(this.scoreA, this.scoreB, team);
        this.cameras.main.shake(150, 0.01);
        this.cameras.main.setAlpha(0.5);
    }
}
