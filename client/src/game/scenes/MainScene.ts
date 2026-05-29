import { Scene } from 'phaser';
import { Player } from '../gameobjects/Player';
import { Ball } from '../gameobjects/Ball';
import { HudScene } from './HudScene';
import { socket } from '../../app/data/socket.service';
import * as Phaser from 'phaser';

const SIM_DT_MS = 15;
const INTERP_DELAY_MS = 100; // adjust based on network conditions

export class MainScene extends Scene {
    keyObjects: Record<string, Phaser.Input.Keyboard.Key> = {};

    localPlayerSprite: Player;
    ball: Ball;
    allPlayerSprites: Array<Player> = [];

    scoreA: number = 0;
    scoreB: number = 0;
    canScoreIncrease: boolean = true;
    gameOverTimeoutInSeconds: number = 180;

    otherPlayersData: Array<Player> = [];
    currentUserIndex: number;

    initialGameData: any;

    hudScene: HudScene;

    socket: any;

    snapshots: Array<any> = [];

    accumMs = 0;

    inputSeq = 0;
    pendingInputs: Array<any> = [];
    localState = { x: 0, y: 0 }; // initialize when you get initial spawn

    constructor() {
        super('MainScene');
    }

    create() {
        this.add.image(0, 0, 'field').setOrigin(0, 0);
        this.scene.pause();
        this.physics.world.setBounds(0, 56, 1280, 664);

        this.socket = socket;

        this.initialGameData = this.game.registry.get('initialGameData');
        this.currentUserIndex = this.game.registry.get('currentUserIndex');
        console.log(
            'initial game data',
            this.initialGameData,
            this.currentUserIndex,
        );
        this.otherPlayersData = this.initialGameData.players.filter(
            (_: any, i: number) => i !== this.currentUserIndex,
        );
        this.ball = new Ball(
            this,
            this.initialGameData.ballSpriteData.x,
            this.initialGameData.ballSpriteData.y,
        );
        this.initialGameData.players.forEach((player: any, i: number) => {
            const isCurrentUser = i === this.currentUserIndex;
            const playerSprite = new Player(
                this,
                this.initialGameData.playerSpriteListData[i].x,
                this.initialGameData.playerSpriteListData[i].y,
                isCurrentUser,
                player.team,
            );
            if (isCurrentUser) {
                this.localPlayerSprite = playerSprite;
                console.log(
                    'CURRENT USER SPRITE',
                    this.localPlayerSprite,
                    this.initialGameData.playerSpriteListData,
                );
            }
            this.allPlayerSprites.push(playerSprite);

            // this.physics.add.collider(playerSprite, this.ball);
        });
        this.scene.resume();

        this.socket.on('SNAPSHOT_UPDATE', (snapshot: any) => {
            this.snapshots.push({
                ...snapshot,
                recvClientTime: performance.now(),
            });
            if (this.snapshots.length > 30) this.snapshots.shift();
        });

        // local state + pending inputs
        this.inputSeq = 0;
        this.pendingInputs = [];
        this.localState = {
            x: this.localPlayerSprite.x,
            y: this.localPlayerSprite.y,
        };

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

        this.physics.add.overlap(this.ball, goalA, () => {
            if (!this.canScoreIncrease) return;
            this.scoreA++;

            this.updateScore();
            this.resetAfterGoal();
        });
        this.physics.add.overlap(this.ball, goalB, () => {
            if (!this.canScoreIncrease) return;
            this.scoreB++;

            this.updateScore();
            this.resetAfterGoal();
        });

        this.scene.launch('HudScene');
        this.hudScene = this.scene.get('HudScene') as HudScene;
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.gameOverTimeoutInSeconds === 0) {
                    this.game.events.removeListener('start-game');

                    // TODO: implement game over logic
                    console.log(`Score: ${this.scoreA} : ${this.scoreB}`);
                    this.scene.pause();
                } else {
                    this.gameOverTimeoutInSeconds--;
                    this.hudScene.updateRemainingTime(
                        this.gameOverTimeoutInSeconds,
                    );
                }
            },
        });
    }

    override update(time: number, delta: number) {
        // 1) Fixed-step prediction loop (optional, for local player responsiveness)
        this.accumMs += delta;
        while (this.accumMs >= SIM_DT_MS) {
            this.fixedPredictTick();
            this.accumMs -= SIM_DT_MS;
        }
        // 2) Render/interpolate server-authoritative objects (ball + other players)
        this.interpolateSnapshotPositions();

        // 3) Render local player sprite from predicted localState (if predicting)
        // this.localPlayerSprite.setPosition(
        //         this.localState.x,
        //         this.localState.y,
        //     );
    }

    fixedPredictTick() {
        // 1) read input
        // 2) apply same deterministic movement locally (client prediction)
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
            const kickDir = this.localPlayerSprite.kick();
            const cmd = {
                seq: ++this.inputSeq,
                ...kickDir,
            };
            this.localState.x = this.localPlayerSprite.x;
            this.localState.y = this.localPlayerSprite.y;
            // this.localPlayerSprite.setPosition(
            //     this.localState.x,
            //     this.localState.y,
            // );

            if (cmd.dir) {
                console.log('EMIT KICK', cmd, this.currentUserIndex);
                this.socket.emit('INPUT', cmd, this.currentUserIndex);
                this.pendingInputs.push(cmd);
            }
        }

        // 3) send input cmd to server (NOT position)
        // 4) store cmd in pendingInputs for reconciliation (requires server ack)
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

        // Ball interpolation
        const ax = a.ballSpriteData.x;
        const ay = a.ballSpriteData.y;
        const bx = b.ballSpriteData.x;
        const by = b.ballSpriteData.y;
        this.ball.setPosition(
            Phaser.Math.Linear(ax, bx, t),
            Phaser.Math.Linear(ay, by, t),
        );

        // Remote players interpolation (by id)
        // ... find matching player in a & b, then Linear(x), Linear(y), set sprite position ...
        this.allPlayerSprites.forEach((player: any, i: number) => {
            // if (i === this.currentUserIndex) return;
            const ax = a.playerSpriteListData[i].x;
            const ay = a.playerSpriteListData[i].y;
            const bx = b.playerSpriteListData[i].x;
            const by = b.playerSpriteListData[i].y;
            this.allPlayerSprites[i].setPosition(
                Phaser.Math.Linear(ax, bx, t),
                Phaser.Math.Linear(ay, by, t),
            );
            if (i === this.currentUserIndex) {
                this.localPlayerSprite.setPosition(
                    Phaser.Math.Linear(ax, bx, t),
                    Phaser.Math.Linear(ay, by, t),
                );
            }
        });
    }

    private updateScore() {
        this.canScoreIncrease = false;
        this.hudScene.updateScore(this.scoreA, this.scoreB);
    }

    private resetAfterGoal() {
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                this.ball.setPosition(500, 300);
                this.ball.body.stop();
                this.canScoreIncrease = true;
            },
        });
    }
}
