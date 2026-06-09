import { Physics } from 'phaser';

export class Ball extends Physics.Arcade.Image {
    declare body: Physics.Arcade.Body;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'ball');

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);

        const size = 55;
        this.setCollideWorldBounds();
        this.setDisplaySize(size, size);
        this.setOrigin(0, 0);
        this.body.setCircle(size / 2 / this.scaleX);
        this.setBounce(0.8, 0.8);
        this.setMass(0.5);
        this.setDamping(true);
        this.setDrag(0.7);
        this.refreshBody();
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
