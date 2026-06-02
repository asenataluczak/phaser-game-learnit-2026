import { Scene } from 'phaser';
import { Player } from '../gameobjects/Player';
import { Ball } from '../gameobjects/Ball';
import { HudScene } from './HudScene';
import { socket } from '../../app/data/socket.service';
import * as Phaser from 'phaser';
import { unpack } from 'msgpackr';

const SIM_DT_MS = 15;
const INTERP_DELAY_MS = 100; // adjust based on network conditions

const GAME_TIMEOUT = 180;

export class MainScene extends Scene {
    localPlayerSprite: Player;
    ball: Ball;
    allPlayerSprites: Array<Player> = [];

    scoreA: number = 0;
    scoreB: number = 0;
    gameOverTimeoutInSeconds: number = GAME_TIMEOUT;

    currentUserIndex: number;

    initialGameData: any;

    hudScene: HudScene;

    socket: any;

    snapshots: Array<any> = [];

    timer: any;

    constructor() {
        super('MainScene');
    }

    create() {
        this.add.image(0, 0, 'field').setOrigin(0, 0);
        this.scene.pause();
        this.physics.world.setBounds(0, 56, 1280, 664);

        this.socket = socket;

        this.socket.on('GAME_RESET', (initialGameData: any) => {
            this.localPlayerSprite.setInteractive();
            if (!this.gameOverTimeoutInSeconds) {
                this.gameOverTimeoutInSeconds = GAME_TIMEOUT;
                this.hudScene.scene.restart();
            }
            this.scene.resume();
        });

        this.initialGameData = this.game.registry.get('initialGameData');
        this.currentUserIndex = this.game.registry.get('currentUserIndex');
        console.log(
            'initial game data',
            this.initialGameData,
            this.currentUserIndex,
        );

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
        this.scene.resume();

        this.socket.on('SNAPSHOT_UPDATE', (snapshot: any) => {
            if (!this.gameOverTimeoutInSeconds) return;

            this.snapshots.push({
                ...unpack(snapshot),
                recvClientTime: performance.now(),
            });
            if (this.snapshots.length > 30) this.snapshots.shift();
        });

        this.socket.on('SCORE_UPDATE', (score: any) => {
            const scoreForTeam = score.A > this.scoreA ? 1 : 2;
            this.scoreA = score.A;
            this.scoreB = score.B;
            this.localPlayerSprite.disableInteractive();
            this.updateHudScore(scoreForTeam);
            this.resetAfterGoal();
        });

        const goalA = this.physics.add
            .staticImage(16, 268, 'goal')
            .setOrigin(0, 0)
            .setDisplaySize(56, 240)
            .setVisible(false);
        goalA.refreshBody();
        const goalB = this.physics.add
            .staticImage(1207, 268, 'goal')
            .setOrigin(0, 0)
            .setDisplaySize(56, 240)
            .setVisible(false);
        goalB.refreshBody();

        this.scene.launch('HudScene');
        this.hudScene = this.scene.get('HudScene') as HudScene;
        this.timer = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.gameOverTimeoutInSeconds === 0) {
                    this.handleGameOver();
                } else {
                    this.gameOverTimeoutInSeconds--;
                    this.hudScene.updateRemainingTime(
                        this.gameOverTimeoutInSeconds,
                    );
                }
            },
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
            }

            this.allPlayerSprites[i].updatePosition(
                Phaser.Math.Linear(ax, bx, t),
                Phaser.Math.Linear(ay, by, t),
            );
        });
    }

    private handleGameOver() {
        this.timer.pause = true;
        this.game.events.removeListener('start-game');

        let canPress = true;
        this.hudScene.showGameOverScreen(
            this.scoreA,
            this.scoreB,
            this.localPlayerSprite.isHost,
            () => {
                if (!canPress) return;
                this.socket.emit('START_GAME', {
                    gameId: this.initialGameData.gameId,
                    reset: true,
                });
                canPress = false;
            },
        );
        this.socket.emit('GAME_STOPPED');
        this.scene.pause();
    }

    private updateHudScore(team: 1 | 2) {
        this.hudScene.updateScore(this.scoreA, this.scoreB);

        if (this.localPlayerSprite.team === team) {
            this.cameras.main.fadeIn(4000, 8, 80, 0);
        } else {
            this.cameras.main.fadeIn(4000, 80, 8, 0);
        }
    }

    private resetAfterGoal() {
        this.time.addEvent({
            delay: 3000,
            callback: () => {
                this.localPlayerSprite.setInteractive();
                this.socket.emit('START_GAME', {
                    gameId: this.initialGameData.gameId,
                    reset: true,
                });
            },
        });
    }
}
