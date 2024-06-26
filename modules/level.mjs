import * as Enemy from "./enemy.mjs";

function randomEnemy(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

class Wave {
    constructor(delay, enemies, positions) {
        this.delay = delay;
        this.enemiesLeft = enemies.length;
        this.enemies = enemies;
        this.positions = positions;
    }
    generate(waveNum) {
        for (let i = 0; i < this.enemies.length; i++) {
            Enemy.makeEnemy(this.positions[i].x, this.positions[i].y, this.enemies[i], waveNum);
        }
    }
}

const level = {
    waves: [
        new Wave(500, ["drone", "drone", "drone", "drone"], [
            { x: 108, y: -10 },
            { x: 216, y: -10 },
            { x: 324, y: -10 },
            { x: 432, y: -10 }
        ]),
        new Wave(20000, ["drone", "drone", "aggroDrone", "drone", "drone"], [
            { x: 135, y: -10 },
            { x: -10, y: 120 },
            { x: 270, y: -10 },
            { x: 550, y: 120 },
            { x: 405, y: -10 }
        ]),
        new Wave(16000, ["drone", "drone", "aggroDrone", "bigDrone", "aggroDrone", "drone", "drone"], [
            { x: 50, y: -10 },
            { x: 100, y: -10 },
            { x: 180, y: -10 },
            { x: 270, y: -10 },
            { x: 360, y: -10 },
            { x: 440, y: -10 },
            { x: 490, y: -10 }
        ])
    ],
    nextWave: 0,
    levelTime: 0,
    waveTime: 0,
    transitionTime: 0,
    tick(ms) {
        this.levelTime += ms;
        this.waveTime += ms;

        if (this.nextWave < this.waves.length && (this.waveTime >= this.waves[this.nextWave].delay || (this.nextWave !== 0 && this.waves[this.nextWave-1].enemiesLeft === 0))) {
            this.transitionTime += ms;
            if (this.transitionTime > 1000) {
                this.nextWave++;
                this.waveTime = 0;
                this.waves[level.nextWave-1].generate(level.nextWave-1);
                this.transitionTime = 0;
            }
        }
        if (this.nextWave !== 0) {
            let curWaveEnemies = 0;
            for (const i of Enemy.enemies) {
                if (i.waveId === this.nextWave - 1) {
                    curWaveEnemies++;
                }
            }
            this.waves[this.nextWave-1].enemiesLeft = curWaveEnemies;
        }
    }
};

export { level };