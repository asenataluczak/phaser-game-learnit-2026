import { GameObjects, Scene } from 'phaser';

export class HudScene extends Scene {
    scoreText: GameObjects.BitmapText;
    remainingTimeText: GameObjects.BitmapText;

    constructor() {
        super('HudScene');
    }

    create({ scoreA, scoreB, gameTimeout }: any) {
        this.add
            .bitmapText(290, 16, 'pixelfont', 'Team A', 32)
            .setDropShadow(0, 4, 0xff0000, 0.8);
        this.add
            .bitmapText(830, 16, 'pixelfont', 'Team B', 32)
            .setDropShadow(0, 4, 0x0000ff, 0.8);
        this.scoreText = this.add.bitmapText(
            580,
            12,
            'pixelfont',
            `${scoreA}:${scoreB}`,
            46,
        );
        this.remainingTimeText = this.add
            .bitmapText(
                this.scale.width - 10,
                10,
                'pixelfont',
                this.getParsedTime(gameTimeout),
                24,
            )
            .setOrigin(1, 0);
    }

    updateScore(scoreA: number, scoreB: number) {
        this.scoreText.setText(`${scoreA.toString()}:${scoreB.toString()}`);
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
        this.remainingTimeText.setText(this.getParsedTime(timeout));
    }

    private getParsedTime(timeout: number) {
        return `${Math.floor(timeout / 60)
            .toString()
            .padStart(2, '0')}:${(timeout % 60).toString().padStart(2, '0')}`;
    }
}
