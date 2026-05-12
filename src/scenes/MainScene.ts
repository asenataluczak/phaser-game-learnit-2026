import { Scene } from "phaser";

export class MainScene extends Scene {
    keyObjects: Record<string, Phaser.Input.Keyboard.Key> = {};
    playerBody!: Phaser.Physics.Arcade.Body;

    constructor() {
        super("MainScene");
    }

    create() {
        // statyczny asset
        const image = this.add.image(0, 0, "background").setOrigin(0, 0);
        const floor = this.add
            .image(0, this.scale.height, "floor")
            .setOrigin(0, 1);

        // dynamiczny asset (+ interaktywny)
        // const sprite = this.add
        //     .sprite(200, 300, "player")
        //     .setOrigin(0, 0)
        //     .setScale(2)
        //     .setInteractive();

        // sprite.on("pointerdown", () => {
        //     console.log('dfhjksd')
        // })

        const player = this.physics.add
            .sprite(400, 200, "player")
            .setScale(2)
            .setCircle(16)
            .setMass(0.5);
        this.physics.add.existing(floor, true);
        this.playerBody = player.body;

        (floor.body as Phaser.Physics.Arcade.StaticBody)
            .setSize(this.scale.width, 30)
            .setOffset(0, 30);
        console.log(floor);

        const ballBody = this.physics.add
            .sprite(500, 300, "player")
            .setScale(1.5, 1.5);

        ballBody.setCollideWorldBounds();
        ballBody.tint = 0x00ff00;
        ballBody.setCircle(16);
        ballBody.setBounce(0.8, 0.8);
        ballBody.setMass(2);

        this.physics.add.collider(player, floor);
        this.physics.add.collider(ballBody, floor);
        this.physics.add.collider(ballBody, player);

        player.setCollideWorldBounds(true);
        player.setBounce(0.6);

        // console.log(this);
        // console.log(this.game)
        // console.log(this.game.scene.dump())

        this.keyObjects = this.input.keyboard!.addKeys({
            up: "W",
            down: "S",
            left: "A",
            right: "D",
        }) as Record<string, Phaser.Input.Keyboard.Key>;
    }

    update() {
        if (this.keyObjects.up.isDown) {
            this.playerBody.setVelocityY(-600);
        }
        if (this.keyObjects.down.isDown) {
            this.playerBody.setVelocityY(600);
        }
        if (this.keyObjects.left.isDown) {
            this.playerBody.setVelocityX(-600);
        }
        if (this.keyObjects.right.isDown) {
            this.playerBody.setVelocityX(600);
        }
    }
}
