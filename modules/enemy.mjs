import * as Player from "./player.mjs";
import * as Pattern from "./pattern.mjs";
import * as Bullets from "./bullets.mjs";
import * as Global from "./global.mjs";
import * as Pickup from "./pickup.mjs";

const enemies = new Set();
const WINGBEATS_PER_SECOND = 30;

class Enemy {
    constructor(x, y, size, score, hp, screenTime, patterns, script, waveId, type, shotRate, moveRate) {
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
        this.shotCooldown = 500;
        this.shotRate = shotRate;
        this.moveCooldown = 0;
        this.moveRate = moveRate;
        this.despawnX = 0;
        this.despawnY = 0;
        this.despawning = false;
        this.phase = 0;
        this.bombed = false;
        this.waveId = waveId;
        this.type = type;
        this.wingState = 0;
        this.wingTimer = 0;

        enemies.add(this);
    }
    tick(ms) {
        this.invTime -= ms;
        this.lifetime += ms;
        this.shotCooldown -= ms;
        this.moveCooldown -= ms;
        this.wingTimer += ms;

        this.x += this.velX * ms / 1000;
        this.y += this.velY * ms / 1000;

        this.script(this, ms);

        for (const i of Bullets.playerBullets) {
            const dist = Math.sqrt((i.x - this.x) ** 2 + (i.y - this.y) ** 2);
            if (dist < i.size + this.size) {
                const damage = Math.ceil(Math.log2(i.size));
                this.hp -= damage;
                Bullets.playerBullets.delete(i);
                Player.powerUp(damage / 1000);
                Player.scoreUp(damage);
                break;
            }
        }
        const dist = Math.sqrt((Player.x - this.x) ** 2 + (Player.y - this.y) ** 2);
        if (dist < this.size + Player.bombRadius && !this.bombed) {
            this.hp -= 60;
            this.bombed = true;
            // todo: make enemies bombable more than once
        }
        if (this.wingTimer > 1000 / WINGBEATS_PER_SECOND) {
            this.wingTimer = 0;
            this.wingState = this.wingState === 1 ? 0 : 1;
        }
        if (this.hp <= 0) {
            Player.scoreUp(this.score);
            this.generatePickup();

            enemies.delete(this);
        }
        if (this.x + this.size < -10 || this.x - this.size > Global.BOARD_WIDTH + 10 ||
            this.y + this.size < -10 || this.y - this.size > Global.BOARD_HEIGHT + 10) {
            enemies.delete(this);
        }
    }
    generatePickup() {
        function pickupFall(ms) {
            if (this.lifetime < 600) {
                this.velY += (-this.baseVelY + 120) * ms / 600;
            }
        }
        if (Player.power < 4 && Math.random() < 1 - (Player.power / 5)) {
            const rand = Math.random();
            if (rand < 0.2)
                new Pickup.Pickup("point", this.x, this.y, 15, 2000, 0, -230 + Math.random() * 60, pickupFall);
            else
                new Pickup.Pickup("power", this.x, this.y, 15, 0.09, 0, -230 + Math.random() * 60, pickupFall);
        }
        else if (Math.random() < 0.5) {
            if (Player.power < 4 && Math.random() < 0.75) {
                new Pickup.Pickup("power", this.x, this.y, 15, 0.09, 0, -230 + Math.random() * 60, pickupFall);
            }
            else
                new Pickup.Pickup("point", this.x, this.y, 15, 2000, 0, -230 + Math.random() * 60, pickupFall);
        }
    }
    pickDespawnPoint() {
        let despawnX = -25;
        let despawnY = -25;
    
        const dists = [this.x, Global.BOARD_WIDTH - this.x, this.y, Global.BOARD_HEIGHT - this.y];
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
            despawnY = (Math.random() * 10) + this.y - 5;
        }
        if (order[0] === 1) { // right
            despawnX = Global.BOARD_WIDTH + 25;
            despawnY = (Math.random() * 10) + this.y - 5;
        }
        if (order[0] === 2) { // top
            despawnY = -25;
            despawnX = (Math.random() * 10) + this.x - 5;
        }
        if (order[0] === 3) { // bottom
            despawnY = Global.BOARD_HEIGHT + 25;
            despawnX = (Math.random() * 10) + this.x - 5;
        }
    
        this.despawnX = despawnX;
        this.despawnY = despawnY;
    }
    basicFire() {
        this.shotCooldown = this.shotRate;
        Pattern[randomPattern(this.patterns)](this);
    }
    basicDash(direction) {
        const DASH_VELOCITY = 250;
    
        const vec = getVel(DASH_VELOCITY, direction);
        this.velX = vec.velX;
        this.velY = vec.velY;
        
    }
    downDash() {
        this.basicDash(Math.PI / 2);
    }
    upDash() {
        this.basicDash(-Math.PI / 2);
    }
    leftDash() {
        this.basicDash(Math.PI);
    }
    rightDash() {
        this.basicDash(0);
    }
    despawnDash() {
        this.basicDash(aimAtDespawnPoint(this));
    }
    randomDash() {
        let moveDirection = Math.random() * 2 * Math.PI;
        // tries to stay onscreen
        if (this.lifetime < this.screenTime) {
            if (this.x < 80) {
                moveDirection = Math.random() * Math.PI - (Math.PI / 2);
    
                if (this.y < 80) {
                    moveDirection = Math.random() * (Math.PI / 2);
                }
                else if (this.y > Global.BOARD_HEIGHT - 80) {
                    moveDirection = Math.random() * (Math.PI / 2) - (Math.PI / 2);
                }
            }
            else if (this.x > Global.BOARD_WIDTH - 80) {
                moveDirection = Math.random() * Math.PI + (Math.PI / 2);
    
                if (this.y < 80) {
                    moveDirection = Math.random() * (Math.PI / 2) + (Math.PI / 2);
                }
                else if (this.y > Global.BOARD_HEIGHT - 80) {
                    moveDirection = Math.random() * (Math.PI / 2) + Math.PI;
                }
            }
            else if (this.y < 80) {
                moveDirection = Math.random() * Math.PI;
            }
            else if (this.y > Global.BOARD_HEIGHT - 80) {
                moveDirection = Math.random() * Math.PI + Math.PI;
            }
        }
    
        this.basicDash(moveDirection);
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

const types = {
    drone: {
        size: 12,
        score: 200,
        hp: 55,
        screenTime: 15000,
        shotRate: 1500,
        dashRate: 3000,
        patterns: ["basicSpread", "spiralDouble"],
        script: (enemy, ms) => {
            const DECELERATION = 0.9;
            if (enemy.moveCooldown <= 0) {
                if (enemy.lifetime > enemy.screenTime && enemy.lifetime > 500) {
                    if (!enemy.despawning) {
                        enemy.pickDespawnPoint();
                        enemy.despawning = true;
                    }
                    enemy.despawnDash();
                }
                else if (enemy.y < 20) enemy.downDash();
                else if (enemy.y > Global.BOARD_HEIGHT - 20) enemy.upDash();
                else if (enemy.x < 20) enemy.leftDash();
                else if (enemy.x > Global.BOARD_WIDTH - 20) enemy.rightDash();
                else enemy.randomDash();
                
                enemy.moveCooldown = enemy.moveRate;
            } else if (enemy.velX > 1 || enemy.velY > 1 || enemy.velX < -1 || enemy.velY < -1) {
                enemy.velX *= (DECELERATION * ms / 1000) / (ms / 1000);
                enemy.velY *= (DECELERATION * ms / 1000) / (ms / 1000);
            } else {
                enemy.velX = 0;
                enemy.velY = 0;
            }
            if (enemy.shotCooldown <= 0) {
                enemy.basicFire();
                enemy.shotCooldown = enemy.shotRate;
            }   
        }
    },
    aggroDrone: {
        size: 14,
        score: 500,
        hp: 70,
        screenTime: 14000,
        shotRate: 400,
        dashRate: 1000,
        patterns: ["singleAimedShot"],
        script: (enemy, ms) => {
            const DECELERATION = 0.9;
            if (enemy.moveCooldown <= 0) {
                if (enemy.lifetime < enemy.screenTime) {
                    if (!enemy.despawning) {
                        enemy.pickDespawnPoint();
                        enemy.despawning = true;
                    }
                    enemy.despawnDash();
                }
                else if (enemy.y < 20) enemy.downDash();
                else if (enemy.y > Global.BOARD_HEIGHT - 20) enemy.upDash();
                else if (enemy.x < 20) enemy.leftDash();
                else if (enemy.x > Global.BOARD_WIDTH - 20) enemy.rightDash();
                else enemy.randomDash();

                enemy.moveCooldown = enemy.moveRate;
            } else if (enemy.velX > 1 || enemy.velY > 1 || enemy.velX < -1 || enemy.velY < -1) {
                enemy.velX *= (DECELERATION * ms / 1000) / (ms / 1000);
                enemy.velY *= (DECELERATION * ms / 1000) / (ms / 1000);
            } else {
                enemy.velX = 0;
                enemy.velY = 0;
            }
            if (enemy.shotCooldown <= 0) {
                enemy.basicFire();
                enemy.shotCooldown = enemy.shotRate;
            }
        }
    },
    bigDrone: {
        size: 20,
        score: 1000,
        hp: 230,
        screenTime: 20000,
        shotRate: 2500,
        dashRate: 2500,
        patterns: ["basicTracker", "basicRadial"],
        script: (enemy, ms) => {
            const DECELERATION = 0.9;
            if (enemy.moveCooldown <= 0) {
                if (enemy.lifetime < enemy.screenTime) {
                    if (!enemy.despawning) {
                        enemy.pickDespawnPoint();
                        enemy.despawning = true;
                    }
                    enemy.despawnDash();
                }
                else if (enemy.y < 20) enemy.downDash();
                else if (enemy.y > Global.BOARD_HEIGHT - 20) enemy.upDash();
                else if (enemy.x < 20) enemy.leftDash();
                else if (enemy.x > Global.BOARD_WIDTH - 20) enemy.rightDash();
                else enemy.randomDash();

                enemy.moveCooldown = enemy.moveRate;
            } else if (enemy.velX > 1 || enemy.velY > 1 || enemy.velX < -1 || enemy.velY < -1) {
                enemy.velX *= (DECELERATION * ms / 1000) / (ms / 1000);
                enemy.velY *= (DECELERATION * ms / 1000) / (ms / 1000);
            } else {
                enemy.velX = 0;
                enemy.velY = 0;
            }
            if (enemy.shotCooldown <= 0) {
                enemy.basicFire();
                enemy.shotCooldown = enemy.shotRate;
            }
        }
    }
};

function makeEnemy(x, y, type, waveId) {
    new Enemy(x, y, types[type].size, types[type].score, types[type].hp, types[type].screenTime, types[type].patterns, types[type].script, waveId, type, types[type].shotRate, types[type].dashRate);
    //pickDespawnPoint(x, y); why is this here???
}

export { enemies, types, makeEnemy };