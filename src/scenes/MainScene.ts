import { Scene } from "phaser";
import { Player } from "../gameobjects/Player";
import { Ball } from "../gameobjects/Ball";

export class MainScene extends Scene {
    keyObjects: Record<string, Phaser.Input.Keyboard.Key> = {};

    player: Player;
    ball: Ball;

    constructor() {
        super("MainScene");
    }

    create() {
        this.add.image(0, 0, "field").setOrigin(0, 0);

        this.player = new Player(this);
        this.ball = new Ball(this);

        this.physics.add.collider(this.ball, this.player);

        this.keyObjects = this.input.keyboard!.addKeys({
            up: "W",
            down: "S",
            left: "A",
            right: "D",
        }) as Record<string, Phaser.Input.Keyboard.Key>;
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
            this.player.move("up");
        }
        if (this.keyObjects.down.isDown) {
            this.player.move("down");
        }
        if (this.keyObjects.left.isDown) {
            this.player.move("left");
        }
        if (this.keyObjects.right.isDown) {
            this.player.move("right");
        }
    }
}
