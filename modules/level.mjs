import * as Enemy from "./enemy.mjs";
import * as Global from "./global.mjs";
import level from "./level.json" with { type: "json" };

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
     * @param {number} id 
     * @param {number} time 
     * @param {string[]} enemies 
     * @param {object[]} positions 
     * @param {number} dependent
     * @param {boolean} boss 
     */
    constructor(id, time, enemies, positions, dependent, boss = false) {
        this.id = id;
        this.timeLimit = time;
        this.enemiesLeft = enemies.length;
        this.enemyList = enemies;
        this.aliveEnemies = new Set();
        this.positions = positions;
        this.dependent = dependent;
        this.boss = boss;
        this.finished = false;
        this.active = false;
        this.lifetime = 0;
    }
    /**
     * @param {number} waveNum 
     */
    generate(waveNum) {
        for (let i = 0; i < this.enemyList.length; i++) {
            this.aliveEnemies.add(Enemy.makeEnemy(
                this.positions[i].x * Global.BOARD_WIDTH / 2 + Global.BOARD_WIDTH / 2,
                this.positions[i].y * Global.BOARD_HEIGHT / 2 + Global.BOARD_HEIGHT / 2,
                this.enemyList[i], waveNum)
            );
        }

        activeWaves.add(this);
    }
}

let name;
const waves = [];
const areas = [];
let activeArea = 0;
const activeWaves = new Set();
let startWave, levelTime, waveTime, gameRunning = true;
let transitioning, transitionTime;
const nextWaves = [];

/**
 * @param {number} ms 
 */
function tick(ms) {
    levelTime += ms;
    waveTime += ms;

    /*
    iterate through every wave
    check each wave's "finished" status
    if a wave has finished, send in any waves that depend on that wave
    change wave delay to wave length
    wave length determines despawn time for enemies plus when it finishes
    */
    for (const w of activeWaves) {
        w.lifetime += ms;

        // note to self: maybe optimize this later
        w.enemiesLeft = 0;
        for (const e of w.aliveEnemies)
            if (Enemy.enemies.has(e))
                w.enemiesLeft++;

        if (w.lifetime > w.timeLimit || w.enemiesLeft === 0)
            w.finished = true;

        if (w.finished) {
            for (const d of w.dependent) {
                if (!activeWaves.has(waves[d])) {
                    if (w.enemiesLeft === 0) {
                        transitioning = true;
                        nextWaves.push(d);
                        console.log(transitioning)
                    } else {
                        waves[d].generate();
                    }

                    for (const i of Enemy.enemies)
                        if (i.waveId === w.id) i.despawning = true;
                }
            }
            activeWaves.delete(w);
        }
    }

    if (transitioning) {
        transitionTime += ms;
        for (const i of nextWaves) {
            if (transitionTime > 1000 && !activeWaves.has(waves[i])) {
                waves[i].generate();
                transitioning = false;
                transitionTime = 0;
            }
        }
    }

    /*
    if (startWave < waves.length && (waveTime >= waves[startWave].timeLimit || (startWave !== 0 && waves[startWave-1].enemiesLeft === 0))) {
        transitionTime += ms;
        if (transitionTime > 1000) {
            startWave++;
            waveTime = 0;

            if (waves[startWave-1].boss) 
                for (const i of Enemy.enemies)
                    i.lifetime = i.screenTime; // immediately force all enemies to despawn

            waves[startWave-1].generate(startWave-1);
            transitionTime = 0;
        }
    }*/
    if (startWave !== 0) {
        let curWaveEnemies = 0;
        for (const i of Enemy.enemies)
            if (i.waveId === startWave - 1)
                curWaveEnemies++;
        
        waves[startWave-1].enemiesLeft = curWaveEnemies;
    }
    if (startWave >= waves.length && waves[startWave-1].enemiesLeft === 0 && gameRunning) {
        setTimeout(Global.setGameState, 2000, Global.game.WON);
        gameRunning = false;
    }
}

function init() {
    startWave = Global.START_WAVE;
    levelTime = 0;
    waveTime = 0;
    transitionTime = 0;
    transitioning = false;
    name = level.name;

    for (let i = 0; i < level.waves.length; i++) {
        let positions = [];
        for (const j of level.waves[i].positions) {
            let x = j.x === "rand" ? randomPosition() : j.x;
            let y = j.y === "rand" ? randomPosition() : j.y;

            positions.push({ x, y });
        }

        waves[i] = new Wave(i, level.waves[i].delay, level.waves[i].enemies, positions, level.waves[i].dependent, level.waves[i].boss);
    }
    for (let i = 0; i < level.areas.length; i++)
        areas[i] = level.areas[i];
    
    setTimeout(() => { waves[0].generate(); }, level.initialDelay);
}

export { name, activeArea, areas, init, tick };