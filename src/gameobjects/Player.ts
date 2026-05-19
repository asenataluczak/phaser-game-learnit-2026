import type { Physics } from "phaser";

export class Player extends Phaser.Physics.Arcade.Image {
    declare body: Physics.Arcade.Body;

    constructor(scene: Phaser.Scene) {
        super(scene, 400, 200, "player");

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);

        this.setCollideWorldBounds();
        this.setDisplaySize(100, 100);
        this.setCircle(145);
        this.setMass(2);
        this.setBounce(0.6);
    }

    move(direction: "up" | "down" | "left" | "right") {
        if (direction === "up") {
            this.body.setVelocityY(-600);
        }
        if (direction === "down") {
            this.body.setVelocityY(600);
        }
        if (direction === "left") {
            this.body.setVelocityX(-600);
        }
        if (direction === "right") {
            this.body.setVelocityX(600);
        }
    }
}
