import * as Enemy from "./enemy.mjs";
import * as Global from "./global.mjs";

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

const waves = [
    new Wave(500, ["drone", "drone", "drone"], [
        { x: 216, y: -10 },
        { x: 324, y: -10 },
        { x: 432, y: -10 }
    ]),
    new Wave(20000, ["drone", "aggroDrone", "drone"], [
        { x: 135, y: -10 },
        { x: 270, y: -10 },
        { x: 405, y: -10 }
    ]),
    new Wave(22000, ["drone", "bigDrone", "aggroDrone", "drone"], [
        { x: 50, y: -10 },
        { x: 270, y: -10 },
        { x: 360, y: -10 },
        { x: 440, y: -10 }
    ])
];
let nextWave, levelTime, waveTime, transitionTime;

function tick(ms) {
    levelTime += ms;
    waveTime += ms;

    if (nextWave < waves.length && (waveTime >= waves[nextWave].delay || (nextWave !== 0 && waves[nextWave-1].enemiesLeft === 0))) {
        transitionTime += ms;
        if (transitionTime > 1000) {
            nextWave++;
            waveTime = 0;
            waves[nextWave-1].generate(nextWave-1);
            transitionTime = 0;
        }
    }
    if (nextWave !== 0) {
        let curWaveEnemies = 0;
        for (const i of Enemy.enemies) {
            if (i.waveId === nextWave - 1) {
                curWaveEnemies++;
            }
        }
        waves[nextWave-1].enemiesLeft = curWaveEnemies;
    }
    if (nextWave >= waves.length && waves[nextWave-1].enemiesLeft === 0) {
        Global.setWinState(true);
    }
}

function init() {
    nextWave = 0;
    levelTime = 0;
    waveTime = 0;
    transitionTime = 0;
}

export { init, tick };