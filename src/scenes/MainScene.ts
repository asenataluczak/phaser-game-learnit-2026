import { Scene } from "phaser";
import { Player } from "../gameobjects/Player";
import { Ball } from "../gameobjects/Ball";
import { HudScene } from "./HudScene";

export class MainScene extends Scene {
    keyObjects: Record<string, Phaser.Input.Keyboard.Key> = {};

    player: Player;
    ball: Ball;

    scoreA: number = 0;
    scoreB: number = 0;
    canScoreIncrease: boolean = true;
    gameOverTimeoutInSeconds: number = 10;

    hudScene: HudScene;

    constructor() {
        super("MainScene");
    }

    create() {
        this.add.image(0, 0, "field").setOrigin(0, 0);

        const goalA = this.physics.add
            .staticImage(16, 268, "goal")
            .setOrigin(0, 0)
            .setDisplaySize(56, 240)
            .setVisible(false);
        goalA.refreshBody();
        const goalB = this.physics.add
            .staticImage(1207, 268, "goal")
            .setOrigin(0, 0)
            .setDisplaySize(56, 240)
            .setVisible(false);
        goalB.refreshBody();

        this.player = new Player(this);
        this.ball = new Ball(this);

        this.physics.add.collider(this.ball, this.player);
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

        this.keyObjects = this.input.keyboard!.addKeys({
            up: "W",
            down: "S",
            left: "A",
            right: "D",
        }) as Record<string, Phaser.Input.Keyboard.Key>;

        this.scene.launch("HudScene");
        this.hudScene = this.scene.get("HudScene") as HudScene;
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.gameOverTimeoutInSeconds === 0) {
                    this.game.events.removeListener("start-game");

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

    update() {
        if (this.player.isLoadingKick) {
            this.player.loadKick(
                this.input.activePointer.x,
                this.input.activePointer.y,
            );
        }

        if (this.player.isLoadingKick && !this.input.activePointer.isDown) {
            this.player.kick();
        }

        if (this.keyObjects.up.isDown) {
            this.ball.move("up");
        }
        if (this.keyObjects.down.isDown) {
            this.ball.move("down");
        }
        if (this.keyObjects.left.isDown) {
            this.ball.move("left");
        }
        if (this.keyObjects.right.isDown) {
            this.ball.move("right");
        }
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
