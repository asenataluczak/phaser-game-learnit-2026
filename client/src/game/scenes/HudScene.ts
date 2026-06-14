import { GameObjects, Scene } from 'phaser';

export class HudScene extends Scene {
    scoreAText: GameObjects.BitmapText;
    scoreBText: GameObjects.BitmapText;
    remainingTimeInMinutesText: GameObjects.BitmapText;
    remainingTimeInSecondsText: GameObjects.BitmapText;
    gameoverText: GameObjects.BitmapText;
    restartText: GameObjects.BitmapText;

    constructor() {
        super('HudScene');
    }

    create({ scoreA, scoreB, gameTimeout }: any) {
        this.add
            .bitmapText(300, 10, 'pixelfont', 'Team A', 32)
            .setDropShadow(0, 4, 0xff0000, 0.8);
        this.add
            .bitmapText(830, 10, 'pixelfont', 'Team B', 32)
            .setDropShadow(0, 4, 0x0000ff, 0.8);
        this.scoreAText = this.add
            .bitmapText(480, 2, 'pixelfont', scoreA, 54)
            .setDropShadow(0, 4, 0xff0000, 0.8);
        this.scoreBText = this.add
            .bitmapText(765, 2, 'pixelfont', scoreB, 54)
            .setDropShadow(0, 4, 0x0000ff, 0.8);
        this.add.bitmapText(this.scale.width / 2 - 5, 12, 'pixelfont', ':', 36);
        this.remainingTimeInMinutesText = this.add.bitmapText(
            565,
            12,
            'pixelfont',
            this.getParsedTime(gameTimeout),
            36,
        );
        this.remainingTimeInSecondsText = this.add.bitmapText(
            662,
            12,
            'pixelfont',
            this.getParsedTime(gameTimeout, false),
            36,
        );

        const g = this.add.graphics();
        g.fillStyle(0xff0000, 1);
        g.fillRect(0, 24, 250, 12);
        g.fillStyle(0xffffff, 1);
        g.fillRect(0, 20, 250, 12);

        g.fillStyle(0x0000ff, 1);
        g.fillRect(1030, 24, 250, 12);
        g.fillStyle(0xffffff, 1);
        g.fillRect(1030, 20, 250, 12);
    }

    updateScore(scoreA: number, scoreB: number, team: 1 | 2) {
        const scoreText = team === 1 ? this.scoreAText : this.scoreBText;
        const scoreCount = team === 1 ? scoreA : scoreB;
        scoreText.setScale(1);
        this.remainingTimeInMinutesText.setTint(0x838383);
        this.remainingTimeInSecondsText.setTint(0x838383);

        this.tweens.add({
            targets: scoreText,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 300,
            ease: 'Quad.easeOut',
            yoyo: true,
            repeat: 1,
        });

        scoreText.setText(scoreCount.toString());
    }

    resetScore(scoreA: number, scoreB: number) {
        this.scoreAText.setScale(1).setPosition(480, 2);
        this.scoreBText.setScale(1).setPosition(765, 2);
        this.scoreAText.setText(scoreA.toString());
        this.scoreBText.setText(scoreB.toString());
        this.restartText?.destroy();
        this.gameoverText.destroy();
        this.goalReset();
    }

    goalReset() {
        this.remainingTimeInMinutesText.setTint(0xffffff);
        this.remainingTimeInSecondsText.setTint(0xffffff);
    }

    showGameOverScreen(
        scoreA: number,
        scoreB: number,
        isHost: boolean,
        callback: any,
    ) {
        this.scoreAText.setScale(2).setPosition(472, 2);
        this.scoreBText.setScale(2).setPosition(740, 2);
        this.remainingTimeInMinutesText.setTint(0x838383);
        this.remainingTimeInSecondsText.setTint(0x838383);

        let message = 'Draw';
        let offset = 88;
        let shadowColor = 0;
        if (scoreA > scoreB) {
            message = 'Team A wins';
            offset = 218;
            shadowColor = 0xff0000;
        }
        if (scoreA < scoreB) {
            message = 'Team B wins';
            offset = 218;
            shadowColor = 0x0000ff;
        }

        this.gameoverText = this.add
            .bitmapText(
                this.scale.width / 2 - offset,
                200,
                'pixelfont',
                message,
                56,
            )
            .setDropShadow(0, 4, shadowColor, 0.8);

        if (isHost) {
            this.restartText = this.add
                .bitmapText(
                    this.scale.width / 2 - 205,
                    360,
                    'pixelfont',
                    'Press R to restart',
                    32,
                )
                .setDropShadow(0, 4, 0, 0.8);
            this.tweens.add({
                targets: this.restartText,
                y: 340,
                duration: 800,
                ease: 'Quad.easeOut',
                yoyo: true,
                repeat: -1,
            });
            const keyR = this.input?.keyboard?.addKey('R');
            keyR?.on('up', callback);
        }
    }

    updateRemainingTime(timeout: number) {
        if (timeout > 0 && timeout < 6) {
            this.remainingTimeInSecondsText.setTint(0xff5656);
            const x0 = 662;
            this.tweens.add({
                targets: this.remainingTimeInSecondsText,
                x: { from: x0 - 4, to: x0 + 4 },
                duration: 100,
                ease: 'Quad.easeOut',
                yoyo: true,
                repeat: 10,
            });
        }
        this.remainingTimeInMinutesText.setText(this.getParsedTime(timeout));
        this.remainingTimeInSecondsText.setText(
            this.getParsedTime(timeout, false),
        );
    }

    private getParsedTime(timeout: number, inMinutes = true) {
        return inMinutes
            ? Math.floor(timeout / 60)
                  .toString()
                  .padStart(2, '0')
            : (timeout % 60).toString().padStart(2, '0');
    }
}
