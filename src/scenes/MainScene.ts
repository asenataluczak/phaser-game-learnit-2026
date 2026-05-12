import { Scene } from "phaser";

export class MainScene extends Scene {
    constructor() {
        super("MainScene");
    }

    create() {
        this.add.image(0, 0, "background").setOrigin(0, 0);
        this.add.image(0, this.scale.height, "floor").setOrigin(0, 1);
    }

    update() {}
}
