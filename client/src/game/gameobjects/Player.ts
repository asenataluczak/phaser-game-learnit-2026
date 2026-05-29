import { GameObjects, Physics } from 'phaser';
import * as Phaser from 'phaser';

export class Player extends Physics.Arcade.Image {
    declare body: Physics.Arcade.Body;

    debugGfx: GameObjects.Graphics;

    isLoadingKick: boolean = false;
    distance: number;
    dx: number;
    dy: number;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        isCurrentUser: boolean,
        team: 1 | 2,
    ) {
        super(scene, x, y, 'player');

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        this.debugGfx = this.scene.add.graphics();

        if (isCurrentUser) {
            this.setTint(0x0088aa);
        }

        this.setCollideWorldBounds();
        // this.setDisplaySize(100, 100);
        this.setCircle(145);
        this.setMass(2);
        this.setBounce(0.6);
        this.setInteractive();
        this.setDamping(true);
        this.setDrag(0.4);

        this.listenForLoadingKick();
    }

    loadKick(mx: number, my: number) {
        const px = this.x;
        const py = this.y;

        let targetX = 2 * px - mx;
        let targetY = 2 * py - my;

        this.dx = targetX - px;
        this.dy = targetY - py;

        const vectorToTarget = new Phaser.Math.Vector2(this.dx, this.dy);
        if (vectorToTarget.length() > 200) {
            vectorToTarget.setLength(200);
            targetX = vectorToTarget.x + px;
            targetY = vectorToTarget.y + py;
        }

        const vectorToBorder = vectorToTarget.clone().setLength(56);
        const borderX = px + vectorToBorder.x;
        const borderY = py + vectorToBorder.y;

        this.distance = Phaser.Math.Distance.Between(mx, my, px, py);
        if (this.body.hitTest(targetX, targetY)) {
            this.distance = 0;
        }

        this.debugGfx.clear();
        this.debugGfx.fillStyle(0xff0000, 1);
        this.debugGfx.fillCircle(mx, my, 5);
        this.debugGfx.fillCircle(borderX, borderY, 5);
        this.debugGfx.fillStyle(0xffff00, 1);
        this.debugGfx.fillCircle(px, py, 5);
        this.debugGfx.fillStyle(0xff0f00, 1);
        this.debugGfx.fillCircle(targetX, targetY, 5);
        this.debugGfx.lineStyle(2, 0x0000ff, 1);
        this.debugGfx.lineBetween(borderX, borderY, targetX, targetY);
    }

    kick() {
        this.debugGfx.clear();
        this.isLoadingKick = false;

        if (!this.distance) {
            return;
        }
        const k = 2;
        let speed = this.distance * k;

        speed = Phaser.Math.Clamp(speed, 100, 600);

        const rawVelocity = new Phaser.Math.Vector2(
            this.dx,
            this.dy,
        ).normalize();

        const dirX = rawVelocity.x * speed;
        const dirY = rawVelocity.y * speed;
        // this.body.setVelocity(dirX, dirY);

        return {
            type: 'kick',
            dir: { x: dirX, y: dirY },
        };
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

    listenForLoadingKick() {
        this.on('pointerdown', () => {
            this.isLoadingKick = true;
        });
    }
}
