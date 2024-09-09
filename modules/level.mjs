import * as Enemy from "./enemy.mjs";
import * as Global from "./global.mjs";

const name = "Instigation";

function randomEnemy(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomPosition() {
    return Math.random() * 2 - 1;
}

class Wave {
    constructor(delay, enemies, positions, boss = false) {
        this.delay = delay;
        this.enemiesLeft = enemies.length;
        this.enemies = enemies;
        this.positions = positions;
        this.boss = boss;
    }
    generate(waveNum) {
        for (let i = 0; i < this.enemies.length; i++) {
            Enemy.makeEnemy(this.positions[i].x * Global.BOARD_WIDTH / 2 + Global.BOARD_WIDTH / 2, this.positions[i].y * Global.BOARD_HEIGHT / 2 + Global.BOARD_HEIGHT / 2, this.enemies[i], waveNum);
        }
    }
}
/* debug waves
[
    new Wave(500, ["basicDrone1"], [
        { x: 440, y: -10 }
    ]),
    new Wave(20000, ["basicDrone2"], [
        { x: 440, y: -10 }
    ]),
    new Wave(22000, ["basicDrone3"], [
        { x: 440, y: -10 }
    ]),
    new Wave(22000, ["fighterDrone1"], [
        { x: 440, y: -10 }
    ]),
    new Wave(22000, ["fighterDrone2"], [
        { x: 440, y: -10 }
    ]),
    new Wave(22000, ["tankDrone1"], [
        { x: 440, y: -20 }
    ]),
    new Wave(22000, ["tankDrone2"], [
        { x: 440, y: -10 }
    ]),
    new Wave(22000, ["princessBee"], [
        { x: 440, y: -10 }
    ], true)
];
*/
const waves = [
    new Wave(2000, ["basicDrone1"], [
        { x: 0, y: -1.02 }
    ]),
    new Wave(10000, ["basicDrone1"], [
        { x: -0.6, y: -1.02 }
    ]),
    new Wave(5000, ["basicDrone1", "basicDrone1"], [
        { x: -0.2, y: -1.02 },
        { x: 0.2, y: -1.02 }
    ]),
    new Wave(12000, ["basicDrone1", "basicDrone1"], [
        { x: -1.02, y: -0.5 },
        { x: 1.02, y: -0.5 }
    ]),
    new Wave(15000, ["basicDrone1", "basicDrone1", "basicDrone1"], [
        { x: -1.02, y: -0.6 },
        { x: 0, y: -1.02 },
        { x: 1.02, y: -0.6 }
    ]),
    new Wave(20000, ["basicDrone1", "basicDrone1", "basicDrone1", "basicDrone1"], [
        { x: -1.02, y: -0.7 },
        { x: -0.2, y: -1.02 },
        { x: 0.2, y: -1.02 },
        { x: 1.02, y: -0.7 }
    ]),
    new Wave(20000, ["fighterDrone1"], [
        { x: 0.6, y: -1.02 }
    ]),
    new Wave(10000, ["fighterDrone1"], [
        { x: -0.6, y: -1.02 }
    ]),
    new Wave(8000, ["basicDrone1", "basicDrone1"], [
        { x: -0.4, y: -1.02 },
        { x: 0.4, y: -1.02 }
    ]),
    new Wave(10000, ["fighterDrone1", "fighterDrone1"], [
        { x: -0.7, y: -1.02 },
        { x: 0.7, y: -1.02 }
    ]),
    new Wave(18000, ["basicDrone1", "basicDrone1", "basicDrone1", "basicDrone1"], [ // 10
        { x: -1.02, y: -0.7 },
        { x: -1.02, y: -0.5 },
        { x: 1.02, y: -0.7 },
        { x: 1.02, y: -0.5 }
    ]),
    new Wave(12000, ["fighterDrone1"], [
        { x: -0.4, y: -1.02 }
    ]),
    new Wave(8000, ["fighterDrone1"], [
        { x: 0.4, y: -1.02 }
    ]),
    new Wave(6000, ["fighterDrone1"], [
        { x: -0.6, y: -1.02 }
    ]),
    new Wave(6000, ["fighterDrone1"], [
        { x: 0.6, y: -1.02 }
    ]),
    new Wave(15000, ["basicDrone1", "basicDrone1", "fighterDrone1", "basicDrone1", "basicDrone1"], [
        { x: -0.3, y: -1.02 },
        { x: -0.1, y: -1.02 },
        { x: 0, y: -1.02 },
        { x: 0.1, y: -1.02 },
        { x: 0.3, y: -1.02 }
    ]),
    new Wave(9000, ["basicDrone2", "basicDrone2"], [
        { x: -0.2, y: -1.02 },
        { x: 0.2, y: -1.02 }
    ]),
    new Wave(3000, ["basicDrone2"], [
        { x: -0.9, y: -1.02 }
    ]),
    new Wave(1000, ["basicDrone2"], [
        { x: -0.7, y: -1.02 }
    ]),
    new Wave(1000, ["basicDrone2"], [
        { x: -0.5, y: -1.02 }
    ]),
    new Wave(1000, ["basicDrone2"], [ // 20
        { x: -0.3, y: -1.02 }
    ]),
    new Wave(1000, ["basicDrone2"], [
        { x: -0.1, y: -1.02 }
    ]),
    new Wave(1000, ["basicDrone2"], [
        { x: 0.1, y: -1.02 }
    ]),
    new Wave(1000, ["basicDrone2"], [
        { x: 0.3, y: -1.02 }
    ]),
    new Wave(1000, ["basicDrone2"], [
        { x: 0.5, y: -1.02 }
    ]),
    new Wave(1000, ["basicDrone2"], [
        { x: 0.7, y: -1.02 }
    ]),
    new Wave(1000, ["basicDrone2"], [
        { x: 0.9, y: -1.02 }
    ]),
    new Wave(5000, ["fighterDrone1"], [
        { x: -1.02, y: -0.6 }
    ]),
    new Wave(8000, ["basicDrone1", "basicDrone1", "basicDrone1", "basicDrone1"], [
        { x: -0.5, y: -1.02 },
        { x: -0.2, y: -1.02 },
        { x: 0.2, y: -1.02 },
        { x: 0.5, y: -1.02 }
    ]),
    new Wave(1000, ["basicDrone2", "basicDrone2", "basicDrone2"], [
        { x: -0.4, y: -1.02 },
        { x: 0, y: -1.02 },
        { x: 0.4, y: -1.02 }
    ]),
    new Wave(9000, ["basicDrone1", "basicDrone1"], [ // 30
        { x: -1.02, y: -0.9 },
        { x: -1.02, y: -0.8 }
    ]),
    new Wave(4000, ["basicDrone1", "basicDrone1"], [
        { x: 1.02, y: -0.85 },
        { x: 1.02, y: -0.75 }
    ]),
    new Wave(4000, ["basicDrone1", "basicDrone1"], [
        { x: -1.02, y: -0.8 },
        { x: -1.02, y: -0.7 }
    ]),
    new Wave(4000, ["basicDrone1", "basicDrone1"], [
        { x: 1.02, y: -0.75 },
        { x: 1.02, y: -0.65 }
    ]),
    new Wave(4000, ["basicDrone1", "basicDrone1"], [
        { x: -1.02, y: -0.7 },
        { x: -1.02, y: -0.6 }
    ]),
    new Wave(6000, ["tankDrone1"], [
        { x: 0, y: -1.02 }
    ]),
    new Wave(2000, ["basicDrone2", "basicDrone2"], [
        { x: -0.7, y: -1.02 },
        { x: -0.8, y: -1.02 }
    ]),
    new Wave(3000, ["basicDrone2", "basicDrone2"], [
        { x: 0.7, y: -1.02 },
        { x: 0.8, y: -1.02 }
    ]),
    new Wave(3000, ["basicDrone2", "basicDrone2"], [
        { x: -0.7, y: -1.02 },
        { x: -0.8, y: -1.02 }
    ]),
    new Wave(8000, ["tankDrone1", "fighterDrone1"], [ // 40
        { x: -1.02, y: -0.7 },
        { x: 0.8, y: -1.02 }
    ]),
    new Wave(20000, ["basicDrone3", "tankDrone1", "tankDrone1"], [
        { x: -1.02, y: -0.7 },
        { x: -0.3, y: -1.02 },
        { x: 0.3, y: -1.02 }
    ]),
    new Wave(20000, ["basicDrone3"], [
        { x: 0, y: -1.02 }
    ]),
    new Wave(3000, ["basicDrone3"], [
        { x: 0, y: -1.02 }
    ]),
    new Wave(3000, ["basicDrone3"], [
        { x: 0, y: -1.02 }
    ]),
    new Wave(12000, ["basicDrone2", "basicDrone2"], [
        { x: 0.5, y: -1.02 },
        { x: -0.5, y: -1.02 }
    ]),
    new Wave(1000, ["basicDrone2", "basicDrone2"], [
        { x: 0.6, y: -1.02 },
        { x: -0.6, y: -1.02 }
    ]),
    new Wave(2000, ["fighterDrone1"], [
        { x: 0.8, y: -1.02 }
    ]),
    new Wave(0, ["basicDrone3", "basicDrone3"], [
        { x: -0.2, y: -1.02 },
        { x: 0.2, y: -1.02 }
    ]),
    new Wave(18000, ["basicDrone1", "basicDrone1", "basicDrone1", "fighterDrone2", "fighterDrone2"], [
        { x: -0.2, y: -1.02 },
        { x: 0, y: -1.02 },
        { x: 0.2, y: -1.02 },
        { x: 0.1, y: -1.02 },
        { x: -0.1, y: -1.02 }
    ]),
    new Wave(10000, ["basicDrone2"], [ // 50
        { x: randomPosition(), y: -1.02 }
    ]),
    new Wave(1500, ["fighterDrone2"], [
        { x: randomPosition(), y: -1.02 }
    ]),
    new Wave(2500, ["basicDrone2"], [
        { x: randomPosition(), y: -1.02 }
    ]),
    new Wave(1500, ["fighterDrone2"], [
        { x: randomPosition(), y: -1.02 }
    ]),
    new Wave(2500, ["basicDrone2"], [
        { x: randomPosition(), y: -1.02 }
    ]),
    new Wave(1500, ["fighterDrone2"], [
        { x: randomPosition(), y: -1.02 }
    ]),
    new Wave(2500, ["basicDrone2"], [
        { x: randomPosition(), y: -1.02 }
    ]),
    new Wave(2500, ["fighterDrone2"], [
        { x: randomPosition(), y: -1.02 }
    ]),
    new Wave(1500, ["basicDrone2"], [
        { x: randomPosition(), y: -1.02 }
    ]),
    new Wave(2500, ["fighterDrone2"], [
        { x: randomPosition(), y: -1.02 }
    ]),
    new Wave(1500, ["basicDrone2"], [ // 60
        { x: randomPosition(), y: -1.02 }
    ]),
    new Wave(2500, ["fighterDrone2"], [
        { x: randomPosition(), y: -1.02 }
    ]),
    new Wave(6000, ["basicDrone3", "fighterDrone2", "fighterDrone2"], [
        { x: -0.8, y: -1.02 },
        { x: -0.3, y: -1.02 },
        { x: 0.3, y: -1.02 }
    ]),
    new Wave(15000, ["tankDrone1", "fighterDrone2", "fighterDrone2"], [
        { x: -0.4, y: -1.02 },
        { x: -1.02, y: -0.9 },
        { x: 1.02, y: -0.8 }
    ]),
    new Wave(15000, ["basicDrone2", "basicDrone2", "basicDrone2", "basicDrone2", "basicDrone2"], [
        { x: -0.5, y: -1.02 },
        { x: -0.3, y: -1.02 },
        { x: 0, y: -1.02 },
        { x: 0.3, y: -1.02 },
        { x: 0.5, y: -1.02 }
    ]),
    new Wave(15000, ["tankDrone1"], [
        { x: 0.4, y: -1.02 },
    ]),
    new Wave(12000, ["tankDrone2", "fighterDrone1", "fighterDrone1", "fighterDrone1"], [
        { x: 0, y: -1.02 },
        { x: -0.8, y: -1.02 },
        { x: 0, y: -1.02 },
        { x: 0.8, y: -1.02 }
    ]),
    new Wave(8000, ["basicDrone2", "basicDrone2", "basicDrone2"], [
        { x: -0.4, y: -1.02 },
        { x: 0, y: -1.02 },
        { x: 0.4, y: -1.02 }
    ]),
    new Wave(7000, ["fighterDrone2", "fighterDrone2"], [
        { x: -1.02, y: -0.7 },
        { x: 1.02, y: -0.7 }
    ]),
    new Wave(12000, ["basicDrone2", "basicDrone2", "basicDrone2", "basicDrone2"], [
        { x: -0.75, y: -1.02 },
        { x: -0.25, y: -1.02 },
        { x: 0.25, y: -1.02 },
        { x: 0.75, y: -1.02 }
    ]),
    new Wave(7000, ["fighterDrone1", "fighterDrone1"], [
        { x: -0.9, y: -1.02 },
        { x: -0.7, y: -1.02 }
    ]),
    new Wave(13000, ["princessBee"], [
        { x: 0, y: -1.02 }
    ], true)
];
let nextWave, levelTime, waveTime, transitionTime, gameRunning = true;

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
}

export { name, init, tick };