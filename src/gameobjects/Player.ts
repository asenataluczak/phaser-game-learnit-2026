import type { GameObjects, Physics } from "phaser";

export class Player extends Phaser.Physics.Arcade.Image {
    declare body: Physics.Arcade.Body;

    debugGfx: GameObjects.Graphics;

    isLoadingKick: boolean = false;

    constructor(scene: Phaser.Scene) {
        super(scene, 400, 200, "player");

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        this.debugGfx = this.scene.add.graphics();

        this.setCollideWorldBounds();
        this.setDisplaySize(100, 100);
        this.setCircle(145);
        this.setMass(2);
        this.setBounce(0.6);
        this.setInteractive();

        this.listenForLoadingKick();
    }

    loadKick(mx: number, my: number) {
        const px = this.x;
        const py = this.y;

        let targetX = 2 * px - mx;
        let targetY = 2 * py - my;

        const dx = targetX - px;
        const dy = targetY - py;

        const vectorToTarget = new Phaser.Math.Vector2(dx, dy);
        if (vectorToTarget.length() > 200) {
            vectorToTarget.setLength(200);
            targetX = vectorToTarget.x + px;
            targetY = vectorToTarget.y + py;
        }

        this.debugGfx.clear();
        this.debugGfx.fillStyle(0xff0000, 1);
        this.debugGfx.fillCircle(mx, my, 5);
        this.debugGfx.fillStyle(0x0000ff, 1);
        this.debugGfx.fillCircle(px, py, 5);
        this.debugGfx.fillStyle(0x0000ff, 1);
        this.debugGfx.fillCircle(targetX, targetY, 5);
        this.debugGfx.lineStyle(2, 0x0000ff, 1);
        this.debugGfx.lineBetween(targetX, targetY, px, py);
    }

    kick() {
        this.debugGfx.clear();
        this.isLoadingKick = false;
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

    listenForLoadingKick() {
        this.on("pointerdown", () => {
            this.isLoadingKick = true;
        });
    }
}
