import * as Player from "./player.mjs";
import * as Pattern from "./pattern.mjs";
import * as Bullets from "./bullets.mjs";
import * as Global from "./global.mjs";

const enemies = new Set();

class Enemy {
    constructor(x, y, size, score, hp, screenTime, patterns, script, waveId) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.score = score;
        this.velX = 0;
        this.velY = 0;
        this.hp = hp;
        this.screenTime = screenTime;
        this.patterns = patterns;
        this.script = script;
        this.lifetime = 0;
        this.shotCooldown = 0;
        this.moveCooldown = 0;
        this.despawnX = 0;
        this.despawnY = 0;
        this.despawning = false;
        this.phase = 0;
        this.waveId = waveId;

        enemies.add(this);
    }
    tick(ms) {
        this.invTime -= ms;
        this.lifetime += ms;
        this.shotCooldown -= ms;
        this.moveCooldown -= ms;

        this.x += this.velX * ms / 1000;
        this.y += this.velY * ms / 1000;

        this.script(this, ms);

        for (const i of Bullets.playerBullets) {
            const dist = Math.sqrt((i.x - this.x) ** 2 + (i.y - this.y) ** 2);
            if (dist < i.size + this.size) {
                const damage = Math.ceil(Math.log2(i.size));
                this.hp -= damage;
                Bullets.playerBullets.delete(i);

                if (this.hp <= 0) {
                    enemies.delete(this);
                }
                Player.powerUp(damage);
            }
        }
    }
}

function aimAtDespawnPoint(enemy) {
    if (enemy.despawnY - enemy.y < 0) {
        return -Math.acos((enemy.despawnX - enemy.x) / Math.sqrt((enemy.despawnX - enemy.x) ** 2 + (enemy.despawnY - enemy.y) ** 2));
    } else {
        return Math.acos((enemy.despawnX - enemy.x) / Math.sqrt((enemy.despawnX - enemy.x) ** 2 + (enemy.despawnY - enemy.y) ** 2));
    }
}

function randomPattern(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getVel(vel, dir) {
    const vx = vel * Math.cos(dir);
    const vy = vel * Math.sin(dir);
    return { velX: vx, velY: vy };
}

function pickDespawnPoint(x, y) {
    let despawnX = -25;
    let despawnY = -25;

    const dists = [x, Global.BOARD_WIDTH - x, y, Global.BOARD_HEIGHT - y];
    const order = [0, 1, 2, 3];

    // sorting network GO
    if (dists[order[0]] > dists[order[2]]) {
        const temp = order[2];
        order[2] = order[0];
        order[0] = temp;
    }
    if (dists[order[1]] > dists[order[3]]) {
        const temp = order[3];
        order[3] = order[1];
        order[1] = temp;
    }
    if (dists[order[0]] > dists[order[1]]) {
        const temp = order[1];
        order[1] = order[0];
        order[0] = temp;
    }
    if (dists[order[2]] > dists[order[3]]) {
        const temp = order[3];
        order[3] = order[2];
        order[2] = temp;
    }
    if (dists[order[1]] > dists[order[2]]) {
        const temp = order[2];
        order[2] = order[1];
        order[1] = temp;
    }

    if (order[0] === 0) { // left
        despawnX = -25;
        despawnY = (Math.random() * 10) + y - 5;
    }
    if (order[0] === 1) { // right
        despawnX = Global.BOARD_WIDTH + 25;
        despawnY = (Math.random() * 10) + y - 5;
    }
    if (order[0] === 2) { // top
        despawnY = -25;
        despawnX = (Math.random() * 10) + x - 5;
    }
    if (order[0] === 3) { // bottom
        despawnY = Global.BOARD_HEIGHT + 25;
        despawnX = (Math.random() * 10) + x - 5;
    }

    return { x: despawnX, y: despawnY };
}

function basicFire(enemy, shotRate) {
    if (enemy.shotCooldown <= 0) {
        enemy.shotCooldown = shotRate;
        Pattern[randomPattern(enemy.patterns)](enemy);
    }
}

function basicDash(enemy, ms, dashRate, direction) {
    const DECELERATION = 0.9;
    const DASH_VELOCITY = 200;

    if (enemy.moveCooldown <= 0) {
        enemy.moveCooldown = dashRate;

        const vec = getVel(DASH_VELOCITY, direction);
        enemy.velX = vec.velX;
        enemy.velY = vec.velY;
    } else if (enemy.velX > 1 || enemy.velY > 1 || enemy.velX < -1 || enemy.velY < -1) {
        enemy.velX *= (DECELERATION * ms / 1000) / (ms / 1000);
        enemy.velY *= (DECELERATION * ms / 1000) / (ms / 1000);
    } else {
        enemy.velX = 0;
        enemy.velY = 0;
    }
}

function downDash(enemy, ms, dashRate) {
    basicDash(enemy, ms, dashRate, Math.PI / 2);
}

function upDash(enemy, ms, dashRate) {
    basicDash(enemy, ms, dashRate, -Math.PI / 2);
}

function leftDash(enemy, ms, dashRate) {
    basicDash(enemy, ms, dashRate, Math.PI);
}

function rightDash(enemy, ms, dashRate) {
    basicDash(enemy, ms, dashRate, 0);
}

function randomDash(enemy, ms, dashRate) {
    let moveDirection = Math.random() * 2 * Math.PI;
    // tries to stay onscreen
    if (enemy.lifetime < enemy.screenTime) {
        if (enemy.x < 80) {
            moveDirection = Math.random() * Math.PI - (Math.PI / 2);

            if (enemy.y < 80) {
                moveDirection = Math.random() * (Math.PI / 2);
            }
            else if (enemy.y > Global.BOARD_HEIGHT - 80) {
                moveDirection = Math.random() * (Math.PI / 2) - (Math.PI / 2);
            }
        }
        else if (enemy.x > Global.BOARD_WIDTH - 80) {
            moveDirection = Math.random() * Math.PI + (Math.PI / 2);

            if (enemy.y < 80) {
                moveDirection = Math.random() * (Math.PI / 2) + (Math.PI / 2);
            }
            else if (enemy.y > Global.BOARD_HEIGHT - 80) {
                moveDirection = Math.random() * (Math.PI / 2) + Math.PI;
            }
        }
        else if (enemy.y < 80) {
            moveDirection = Math.random() * Math.PI;
        }
        else if (enemy.y > Global.BOARD_HEIGHT - 80) {
            moveDirection = Math.random() * Math.PI + Math.PI;
        }
    }
    else {
        // pick a point off screen then go to it; despawn self also
        if (!enemy.despawning) {
            const despawnPoint = pickDespawnPoint(enemy.x, enemy.y);
            enemy.despawnX = despawnPoint.x;
            enemy.despawnY = despawnPoint.y;

            enemy.despawning = true;
        }
        moveDirection = aimAtDespawnPoint(enemy);

        if (enemy.x + enemy.size <= 0 || enemy.x - enemy.size >= Global.BOARD_WIDTH ||
            enemy.y + enemy.size <= 0 || enemy.y - enemy.size >= Global.BOARD_HEIGHT) {
            enemies.delete(enemy);
        }
    }

    basicDash(enemy, ms, dashRate, moveDirection);
}

const types = {
    drone: {
        size: 12,
        score: 1,
        hp: 60,
        screenTime: 20000,
        patterns: ["basicSpread", "spiralDouble"],
        script: (enemy, ms) => {
            const DASH_RATE = 3000;
            // if offscreen/almost offscreen, go onscreen
            if (enemy.y < 20) {
                downDash(enemy, ms, DASH_RATE);
            }
            else if (enemy.y > Global.BOARD_HEIGHT - 20) {
                upDash(enemy, ms, DASH_RATE);
            }
            else if (enemy.x < 20) {
                rightDash(enemy, ms, DASH_RATE);
            }
            else if (enemy.x > Global.BOARD_WIDTH - 20) {
                leftDash(enemy, ms, DASH_RATE);
            }
            else {
                basicFire(enemy, 1500);
                randomDash(enemy, ms, DASH_RATE);
            }
        }
    },
    aggroDrone: {
        size: 14,
        score: 2,
        hp: 80,
        screenTime: 18000,
        patterns: ["singleAimedShot"],
        script: (enemy, ms) => {
            const DASH_RATE = 1000;
            // if offscreen/almost offscreen, go onscreen
            if (enemy.y < 20) {
                downDash(enemy, ms, DASH_RATE);
            }
            else if (enemy.y > Global.BOARD_HEIGHT - 20) {
                upDash(enemy, ms, DASH_RATE);
            }
            else if (enemy.x < 20) {
                leftDash(enemy, ms, DASH_RATE);
            }
            else if (enemy.x > Global.BOARD_WIDTH - 20) {
                rightDash(enemy, ms, DASH_RATE);
            }
            else {
                basicFire(enemy, 330);
                randomDash(enemy, ms, DASH_RATE);
            }
        }
    },
    bigDrone: {
        size: 20,
        score: 4,
        hp: 250,
        screenTime: 25000,
        patterns: ["basicTracker", "basicRadial"],
        script: (enemy, ms) => {
            const DASH_RATE = 2500;
            // if offscreen/almost offscreen, go onscreen
            if (enemy.y < 20) {
                downDash(enemy, ms, DASH_RATE);
            }
            else if (enemy.y > Global.BOARD_HEIGHT - 20) {
                upDash(enemy, ms, DASH_RATE);
            }
            else if (enemy.x < 20) {
                leftDash(enemy, ms, DASH_RATE);
            }
            else if (enemy.x > Global.BOARD_WIDTH - 20) {
                rightDash(enemy, ms, DASH_RATE);
            }
            else {
                basicFire(enemy, 2000);
                randomDash(enemy, ms, DASH_RATE);
            }
        }
    }
};

function makeEnemy(x, y, type, waveId) {
    new Enemy(x, y, types[type].size, types[type].score, types[type].hp, types[type].screenTime, types[type].patterns, types[type].script, waveId);
    pickDespawnPoint(x, y);
}

export { enemies, types, makeEnemy };