import { Scene } from "phaser";
import { Player } from "../gameobjects/Player";

export class MainScene extends Scene {
    keyObjects: Record<string, Phaser.Input.Keyboard.Key> = {};

    player: Player;

    constructor() {
        super("MainScene");
    }

    create() {
        this.add.image(0, 0, "background").setOrigin(0, 0);

        this.player = new Player(this);

        const ballBody = this.physics.add
            .sprite(500, 300, "player")
            .setScale(1.5, 1.5);

        ballBody.setCollideWorldBounds();
        ballBody.tint = 0x00ff00;
        ballBody.setCircle(16);
        ballBody.setBounce(0.8, 0.8);
        ballBody.setMass(2);

        this.physics.add.collider(ballBody, this.player);

        this.keyObjects = this.input.keyboard!.addKeys({
            up: "W",
            down: "S",
            left: "A",
            right: "D",
        }) as Record<string, Phaser.Input.Keyboard.Key>;
    }

    update() {
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
