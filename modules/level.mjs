import * as Enemy from "./enemy.mjs";
import * as Global from "./global.mjs";
import level from "./level.json" with { type: "json" };

const name = "Instigation";

/**
 * @param {any[]} arr 
 * @returns any
 */
function randomEnemy(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomPosition() {
    return Math.random() * 2 - 1;
}

class Wave {
    /**
     * @param {number} delay 
     * @param {string[]} enemies 
     * @param {object[]} positions 
     * @param {number} dependent
     * @param {boolean} boss 
     */
    constructor(delay, enemies, positions, dependent, boss = false) {
        this.delay = delay;
        this.enemiesLeft = enemies.length;
        this.enemies = enemies;
        this.positions = positions;
        this.dependent = dependent;
        this.boss = boss;
    }
    /**
     * @param {number} waveNum 
     */
    generate(waveNum) {
        for (let i = 0; i < this.enemies.length; i++) {
            Enemy.makeEnemy(this.positions[i].x * Global.BOARD_WIDTH / 2 + Global.BOARD_WIDTH / 2, this.positions[i].y * Global.BOARD_HEIGHT / 2 + Global.BOARD_HEIGHT / 2, this.enemies[i], waveNum);
        }
    }
}

const waves = [];
let nextWave, levelTime, waveTime, transitionTime, gameRunning = true;

/**
 * @param {number} ms 
 */
function tick(ms) {
    levelTime += ms;
    waveTime += ms;

    if (nextWave < waves.length && (waveTime >= waves[nextWave].delay || (nextWave !== 0 && waves[nextWave-1].enemiesLeft === 0))) {
        transitionTime += ms;
        if (transitionTime > 1000) {
            nextWave++;
            waveTime = 0;

            if (waves[nextWave-1].boss) 
                for (const i of Enemy.enemies)
                    i.lifetime = i.screenTime; // immediately force all enemies to despawn

            waves[nextWave-1].generate(nextWave-1);
            transitionTime = 0;
        }
    }
    if (nextWave !== 0) {
        let curWaveEnemies = 0;
        for (const i of Enemy.enemies) {
            if (i.waveId === nextWave - 1)
                curWaveEnemies++;
        }
        waves[nextWave-1].enemiesLeft = curWaveEnemies;
    }
    if (nextWave >= waves.length && waves[nextWave-1].enemiesLeft === 0 && gameRunning) {
        setTimeout(Global.setGameState, 2000, Global.game.WON);
        gameRunning = false;
    }
}

function init() {
    nextWave = Global.START_WAVE;
    levelTime = 0;
    waveTime = 0;
    transitionTime = 0;

    for (let i = 0; i < level.length; i++) {
        let positions = [];
        for (const j of level[i].positions) {
            let x = j.x;
            let y = j.y;
            if (j.x === "rand")
                x = randomPosition();
            if (j.y === "rand")
                y = randomPosition();

            positions.push({ x, y });
        }

        waves[i] = new Wave(level[i].delay, level[i].enemies, positions, level[i].dependent, level[i].boss);
    }
}

export { name, init, tick };