import * as Player from "./player.mjs";
import * as Pattern from "./pattern.mjs";
import * as Bullets from "./bullets.mjs";
import * as Global from "./global.mjs";

const enemies = new Set();

class Enemy {
    constructor(x, y, size, score, hp, patterns, script) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.score = score;
        this.velX = 0;
        this.velY = 0;
        this.hp = hp;
        this.patterns = patterns;
        this.script = script;
        this.lifetime = 0;
        this.shotCooldown = 0;
        this.moveCooldown = 0;

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

function randomPattern(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getVel(vel, dir) {
    const vx = vel * Math.cos(dir);
    const vy = vel * Math.sin(dir);
    return { velX: vx, velY: vy };
}

function basicFire(enemy) {
    if (enemy.shotCooldown <= 0) {
        enemy.shotCooldown = 1500;
        Pattern[randomPattern(enemy.patterns)](enemy);
    }
}

function basicMove(enemy, ms) {
    const DECELERATION = 0.9;
    const DASH_VELOCITY = 200;

    if (enemy.moveCooldown <= 0) {
        enemy.moveCooldown = 3000;

        let randDirection = Math.random() * 2 * Math.PI;
        // tries to stay onscreen
        if (enemy.x < 80) {
            randDirection = Math.random() * Math.PI - (Math.PI / 2);

            if (enemy.y < 80) {
                randDirection = Math.random() * (Math.PI / 2);
            }
            else if (enemy.y > Global.BOARD_HEIGHT - 80) {
                randDirection = Math.random() * (Math.PI / 2) - (Math.PI / 2);
            }
        }
        else if (enemy.x > Global.BOARD_WIDTH - 80) {
            randDirection = Math.random() * Math.PI + (Math.PI / 2);

            if (enemy.y < 80) {
                randDirection = Math.random() * (Math.PI / 2) + (Math.PI / 2);
            }
            else if (enemy.y > Global.BOARD_HEIGHT - 80) {
                randDirection = Math.random() * (Math.PI / 2) + Math.PI;
            }
        }
        else if (enemy.y < 80) {
            randDirection = Math.random() * Math.PI;
        }
        else if (enemy.y > Global.BOARD_HEIGHT - 80) {
            randDirection = Math.random() * Math.PI + Math.PI;
        }

        const vec = getVel(DASH_VELOCITY, randDirection);
        enemy.velX = vec.velX;
        enemy.velY = vec.velY;
    } else if (enemy.velX > 1 || enemy.velX < -1) {
        enemy.velX *= (DECELERATION * ms / 1000) / (ms / 1000);
        enemy.velY *= (DECELERATION * ms / 1000) / (ms / 1000);
    } else {
        enemy.velX = 0;
        enemy.velY = 0;
    }
}

const types = {
    drone: {
        size: 12,
        score: 1,
        hp: 75,
        patterns: ["basicSpread", "basicTracker"],
        script: (enemy, ms) => {
            basicFire(enemy);
            basicMove(enemy, ms);
        }
    }
};

function makeEnemy(x, y, type) {
    new Enemy(x, y, types[type].size, types[type].score, types[type].hp, types[type].patterns, types[type].script);
}

export { enemies, makeEnemy };