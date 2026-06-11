import { GameObjects, Scene } from 'phaser';

export class HudScene extends Scene {
    scoreAText: GameObjects.BitmapText;
    scoreBText: GameObjects.BitmapText;
    remainingTimeInMinutesText: GameObjects.BitmapText;
    remainingTimeInSecondsText: GameObjects.BitmapText;

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

    updateScore(scoreA: number, scoreB: number) {
        this.scoreAText.setText(scoreA.toString());
        this.scoreBText.setText(scoreB.toString());
    }

    showGameOverScreen(
        scoreA: number,
        scoreB: number,
        isHost: boolean,
        callback: any,
    ) {
        const winner =
            scoreA > scoreB
                ? 'Team A wins'
                : scoreB > scoreA
                  ? 'Team B wins'
                  : 'Draw';
        this.add.bitmapText(
            this.scale.width / 2 - 180,
            200,
            'pixelfont',
            winner,
            48,
        );

        if (isHost) {
            this.add.bitmapText(
                this.scale.width / 2 - 180,
                260,
                'pixelfont',
                'Press R to restart',
                32,
            );
            const keyR = this.input?.keyboard?.addKey('R');
            keyR?.on('up', callback);
        }
    }

    updateRemainingTime(timeout: number) {
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
