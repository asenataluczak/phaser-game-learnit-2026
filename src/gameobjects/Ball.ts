import type { Physics } from "phaser";

export class Ball extends Phaser.Physics.Arcade.Image {
    declare body: Physics.Arcade.Body;

    constructor(scene: Phaser.Scene) {
        super(scene, 500, 300, "ball");

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);

        this.setCollideWorldBounds();
        this.setDisplaySize(80, 80);
        this.setCircle(255);
        this.setBounce(0.8, 0.8);
        this.setMass(0.5);
    }
}
