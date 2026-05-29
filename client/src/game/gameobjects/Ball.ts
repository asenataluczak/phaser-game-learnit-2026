import { Physics } from 'phaser';

export class Ball extends Physics.Arcade.Image {
    declare body: Physics.Arcade.Body;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'ball');

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);

        this.setCollideWorldBounds();
        this.setDisplaySize(80, 80);
        this.setCircle(255);
        this.setBounce(0.8, 0.8);
        this.setMass(0.5);
        this.setDamping(true);
        this.setDrag(0.7);
    }

    move(direction: 'up' | 'down' | 'left' | 'right') {
        if (direction === 'up') {
            this.body.setVelocityY(-600);
        }
        if (direction === 'down') {
            this.body.setVelocityY(600);
        }
        if (direction === 'left') {
            this.body.setVelocityX(-600);
        }
        if (direction === 'right') {
            this.body.setVelocityX(600);
        }
    }
}
