import type { Physics } from "phaser";

export class Ball extends Phaser.Physics.Arcade.Image {
    declare body: Physics.Arcade.Body;

    constructor(scene: Phaser.Scene) {
        super(scene, 500, 300, "player");

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);

        this.setCollideWorldBounds();
        this.setScale(1.5, 1.5);
        this.setCircle(16);
        this.tint = 0x00ff00;
        this.setCircle(16);
        this.setBounce(0.8, 0.8);
        this.setMass(2);
    }
}
