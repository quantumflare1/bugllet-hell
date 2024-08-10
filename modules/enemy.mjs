import * as Player from "./player.mjs";
import * as Pattern from "./pattern.mjs";
import * as Bullets from "./bullets.mjs";
import * as Global from "./global.mjs";
import * as Pickup from "./pickup.mjs";

const enemies = new Set();

// rewrite enemy ai
class Enemy {
    constructor(x, y, size, score, hp, screenTime, patterns, script, waveId, type, shotRate, moveRate, wingRate, useRotation) {
        this.x = x;
        this.y = y;
        this.spawnX = x;
        this.spawnY = y;
        this.size = size;
        this.score = score;
        this.velX = 0;
        this.velY = 0;
        this.hp = hp;
        this.screenTime = screenTime;
        this.patterns = patterns;
        this.script = script;
        this.lifetime = 0;
        this.shotCooldown = 200;
        this.shotRate = shotRate;
        this.moveCooldown = 0;
        this.moveRate = moveRate;
        this.despawnX = 0;
        this.despawnY = 0;
        this.despawning = false;
        this.phase = 0;
        this.bombImmunity = 0;
        this.waveId = waveId;
        this.type = type;
        this.wingRate = wingRate;
        this.wingState = 0;
        this.wingTimer = 0;
        this.variance = 50;
        this.extraAttribute = 0;
        this.rotation = 0;
        this.useRotation = useRotation;

        enemies.add(this);
    }
    tick(ms) {
        this.invTime -= ms;
        this.lifetime += ms;
        this.shotCooldown -= ms;
        this.moveCooldown -= ms;
        this.bombImmunity -= ms;
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
                //Player.powerUp(damage / 1000);
                Player.scoreUp(damage);
                break;
            }
        }
        const dist = Math.sqrt((Player.x - this.x) ** 2 + (Player.y - this.y) ** 2);
        if (dist < this.size + Player.bombRadius && this.bombImmunity < 0) {
            this.hp -= 60;
            this.bombImmunity = 1000;
            // todo: make enemies bombable more than once
        }
        if (this.wingTimer > 1000 / this.wingRate) {
            this.wingTimer = 0;
            this.wingState = this.wingState === 1 ? 0 : 1;
        }
        if (this.hp <= 0) {
            Player.scoreUp(this.score);
            this.generatePickup();

            enemies.delete(this);
        }
        if ((this.x + this.size < -10 || this.x - this.size > Global.BOARD_WIDTH + 10 ||
            this.y + this.size < -10 || this.y - this.size > Global.BOARD_HEIGHT + 10) && this.despawning)
            enemies.delete(this);
    }
    generatePickup() {
        function pickupFall(ms) {
            if (this.lifetime < 600)
                this.velY += (-this.baseVelY + 150) * ms / 600;
        }
        if (Player.power < 4 && Math.random() < 1 - (Player.power / 5)) {
            const rand = Math.random();
            if (rand < 0.2)
                new Pickup.Pickup("point", this.x, this.y, 15, 2000, 0, -230 + Math.random() * 60, pickupFall);
            else
                new Pickup.Pickup("power", this.x, this.y, 15, 0.12, 0, -230 + Math.random() * 60, pickupFall);
        }
        else if (Math.random() < 0.5) {
            if (Player.power < 4 && Math.random() < 0.75)
                new Pickup.Pickup("power", this.x, this.y, 15, 0.12, 0, -230 + Math.random() * 60, pickupFall);
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
    pickRandomDespawnPoint(rand = Math.random()) {
        let despawnX = 0;
        let despawnY = 0;

        if (rand < 0.25 && this.x > 0) {
            despawnX = -25;
            despawnY = Math.random() * Global.BOARD_HEIGHT;
        } else if (rand < 0.5 && this.x < Global.BOARD_WIDTH) {
            despawnX = Global.BOARD_WIDTH + 25;
            despawnY = Math.random() * Global.BOARD_HEIGHT;
        } else if (rand < 0.75 && this.y > 0) {
            despawnY = -25;
            despawnX = Math.random() * Global.BOARD_WIDTH;
        } else if (this.y < Global.BOARD_HEIGHT) {
            despawnY = Global.BOARD_HEIGHT + 25;
            despawnX = Math.random() * Global.BOARD_WIDTH;
        } else {
            // make sure that the side isn't the same as the one it comes from
            this.pickRandomDespawnPoint((rand + 0.25) % 1);
            return;
        }

        this.despawnX = despawnX;
        this.despawnY = despawnY;
    }
    pickFighterDespawnPoint() {
        let despawnX = this.x;
        let despawnY = this.y;

        if (this.x < 0) despawnX = Global.BOARD_WIDTH + 25;
        else if (this.x > Global.BOARD_WIDTH) despawnX = -25;
        if (this.y < 0) despawnY = Global.BOARD_HEIGHT + 25;
        else if (this.y > Global.BOARD_HEIGHT) despawnY = -25;

        this.despawnX = despawnX;
        this.despawnY = despawnY;
    }
    basicFire() {
        this.shotCooldown = this.shotRate + (Math.random() * 2 - 1) * this.variance;
        Pattern.patterns[randomPattern(this.patterns)](this);
    }
    fireSpecificNoCooldown(pattern) {
        Pattern.patterns[pattern](this);
    }
    fireSpecific(pattern) {
        this.shotCooldown = this.shotRate + (Math.random() * 2 - 1) * this.variance;
        Pattern.patterns[pattern](this);
    }
    basicDash(direction, vel) {
        const vec = getVel(vel, direction);
        this.velX = vec.velX;
        this.velY = vec.velY;
    }
    downDash(vel = 350) {
        this.basicDash(Math.PI / 2, vel);
    }
    upDash(vel = 350) {
        this.basicDash(-Math.PI / 2, vel);
    }
    leftDash(vel = 350) {
        this.basicDash(Math.PI, vel);
    }
    rightDash(vel = 350) {
        this.basicDash(0, vel);
    }
    despawnDash(vel = 250) {
        this.basicDash(aimAtDespawnPoint(this), vel);
    }
    randomDash() {
        let moveDirection = Math.random() * 2 * Math.PI;
        // tries to stay onscreen
        if (this.lifetime < this.screenTime) {
            if (this.x < 80) {
                moveDirection = Math.random() * Math.PI - (Math.PI / 2);
    
                if (this.y < 80)
                    moveDirection = Math.random() * (Math.PI / 2);
                else if (this.y > Global.BOARD_HEIGHT - 80)
                    moveDirection = Math.random() * (Math.PI / 2) - (Math.PI / 2);
            }
            else if (this.x > Global.BOARD_WIDTH - 80) {
                moveDirection = Math.random() * Math.PI + (Math.PI / 2);
    
                if (this.y < 80)
                    moveDirection = Math.random() * (Math.PI / 2) + (Math.PI / 2);
                else if (this.y > Global.BOARD_HEIGHT - 80)
                    moveDirection = Math.random() * (Math.PI / 2) + Math.PI;
            }
            else if (this.y < 80)
                moveDirection = Math.random() * Math.PI;
            else if (this.y > Global.BOARD_HEIGHT - 80)
                moveDirection = Math.random() * Math.PI + Math.PI;
        }
    
        this.basicDash(moveDirection, 250);
    }
}

function aimAtPoint(enemy, x, y) {
    if (y - enemy.y < 0)
        return -Math.acos((x - enemy.x) / Math.sqrt((x - enemy.x) ** 2 + (y - enemy.y) ** 2));
    else
        return Math.acos((x - enemy.x) / Math.sqrt((x - enemy.x) ** 2 + (y - enemy.y) ** 2));
}

function aimAtDespawnPoint(enemy) {
    return aimAtPoint(enemy, enemy.despawnX, enemy.despawnY);
}

function randomPattern(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getVel(vel, dir) {
    const vx = vel * Math.cos(dir);
    const vy = vel * Math.sin(dir);
    return { velX: vx, velY: vy };
}

// todo: there are loads of reused/copied lines of code here that i would like to clean up
// similar: the sprite index json
const types = {
    basicDrone1: {
        size: 12,
        score: 200,
        hp: 60,
        screenTime: 18000,
        shotRate: 2200,
        moveRate: 18000,
        wingRate: 30,
        useRotation: false,
        patterns: ["singleAimedVariantShot"],
        script: (enemy, ms) => {
            const DECELERATION = 0.9;
            const DASH_VEL = 500;
            if (enemy.moveCooldown <= 0) {
                if (enemy.lifetime > enemy.screenTime && enemy.lifetime > 500) {
                    if (!enemy.despawning) {
                        enemy.pickDespawnPoint();
                        enemy.despawning = true;
                    }
                    enemy.despawnDash(DASH_VEL);
                }
                else if (enemy.y < 20) enemy.downDash(DASH_VEL);
                else if (enemy.y > Global.BOARD_HEIGHT - 20) enemy.upDash(DASH_VEL);
                else if (enemy.x < 20) enemy.leftDash(DASH_VEL);
                else if (enemy.x > Global.BOARD_WIDTH - 20) enemy.rightDash(DASH_VEL);
                else enemy.randomDash(DASH_VEL);
                
                enemy.moveCooldown = enemy.moveRate + (Math.random() * 2 - 1) * enemy.variance;
            } else if (enemy.velX > 1 || enemy.velY > 1 || enemy.velX < -1 || enemy.velY < -1) {
                enemy.velX *= (DECELERATION * ms / 1000) / (ms / 1000);
                enemy.velY *= (DECELERATION * ms / 1000) / (ms / 1000);
            } else {
                enemy.velX = 0;
                enemy.velY = 0;
            }
            if (enemy.shotCooldown <= 0) 
                enemy.basicFire();
        }
    },
    basicDrone2: {
        size: 12,
        score: 400,
        hp: 45,
        screenTime: 1500,
        shotRate: 800,
        moveRate: 1500,
        wingRate: 30,
        useRotation: false,
        patterns: ["basicSpread", "shortVeryVariantTracker"],
        script: (enemy, ms) => {
            const DECELERATION = 0.9; // maybe these can be moved out as an object property
            const DASH_VEL = 500; // investigate later
            if (enemy.moveCooldown <= 0) {
                if (enemy.lifetime > enemy.screenTime && enemy.lifetime > 500) {
                    if (!enemy.despawning) {
                        enemy.pickDespawnPoint();
                        enemy.despawning = true;
                    }
                    enemy.despawnDash(DASH_VEL);
                }
                else if (enemy.y < 20) enemy.downDash(DASH_VEL);
                else if (enemy.y > Global.BOARD_HEIGHT - 20) enemy.upDash(DASH_VEL);
                else if (enemy.x < 20) enemy.leftDash(DASH_VEL);
                else if (enemy.x > Global.BOARD_WIDTH - 20) enemy.rightDash(DASH_VEL);
                else enemy.randomDash(DASH_VEL);
                
                enemy.moveCooldown = enemy.moveRate + (Math.random() * 2 - 1) * enemy.variance;
            } else if (enemy.velX > 1 || enemy.velY > 1 || enemy.velX < -1 || enemy.velY < -1) {
                enemy.velX *= (DECELERATION * ms / 1000) / (ms / 1000);
                enemy.velY *= (DECELERATION * ms / 1000) / (ms / 1000);
            } else {
                enemy.velX = 0;
                enemy.velY = 0;
            }
            if (enemy.shotCooldown <= 0) 
                enemy.basicFire();
        }
    },
    basicDrone3: {
        size: 12,
        score: 1000,
        hp: 350,
        screenTime: 12000,
        shotRate: 900,
        moveRate: 99999,
        wingRate: 30,
        useRotation: false,
        patterns: ["sparseDoubleRadial", "dartTriangle"],
        script: (enemy, ms) => {
            if (enemy.moveCooldown <= 0) {
                if (enemy.despawnX === 0 && enemy.despawnY === 0)
                    enemy.pickRandomDespawnPoint();

                const dist = Math.sqrt((enemy.x - enemy.despawnX) ** 2 + (enemy.y - enemy.despawnY) ** 2);
                const vec = getVel(dist / enemy.screenTime * 1000, aimAtDespawnPoint(enemy));
                enemy.velX = vec.velX;
                enemy.velY = vec.velY;
                
                if (enemy.lifetime > 500 && !enemy.despawning)
                    enemy.despawning = true;

                enemy.moveCooldown = Number.MAX_VALUE;
            }
            if (enemy.shotCooldown <= 0) 
                enemy.basicFire();
        }
    },
    fighterDrone1: {
        size: 14,
        score: 500,
        hp: 120,
        screenTime: 11000,
        shotRate: 900,
        moveRate: 400,
        wingRate: 10,
        useRotation: true,
        patterns: ["basicRay"],
        script: (enemy, ms) => {
            if (enemy.moveCooldown <= 0) {
                if (enemy.despawnX === 0 && enemy.despawnY === 0){
                    enemy.pickFighterDespawnPoint();

                    const vec = getVel(enemy.moveRate, aimAtDespawnPoint(enemy));
                    enemy.velX = vec.velX;
                    enemy.velY = vec.velY;
                }
                
                if (enemy.lifetime > enemy.screenTime)
                    enemies.delete(enemy);
                
                enemy.moveCooldown = Number.MAX_VALUE;
            }
            if (enemy.shotCooldown <= 0)
                enemy.basicFire();
            if (enemy.lifetime / 200 >= enemy.extraAttribute) {
                enemy.fireSpecificNoCooldown("basicTrail");
                enemy.extraAttribute++;
            }
            if (enemy.x + enemy.size < -10 || enemy.x - enemy.size > Global.BOARD_WIDTH + 10 ||
                enemy.y + enemy.size < -10 || enemy.y - enemy.size > Global.BOARD_HEIGHT + 10) {
                let newX = enemy.spawnX;
                let newY = enemy.spawnY;
                if (Math.floor(enemy.velX) === 0) { // math.floor is to catch rounding errors (floating point is wacky like that)
                    if (Player.x < enemy.x - 20) newX = enemy.spawnX - 60;
                    if (Player.x > enemy.x + 20) newX = enemy.spawnX + 60;
                }
                if (Math.floor(enemy.velY) === 0) {
                    if (Player.y < enemy.y - 20) newY = enemy.spawnY - 60;
                    if (Player.y > enemy.y + 20) newY = enemy.spawnY + 60;
                }
                new Enemy(newX, newY, enemy.size, enemy.score, enemy.hp, enemy.screenTime - enemy.lifetime,
                    enemy.patterns, enemy.script, enemy.waveId, enemy.type, enemy.shotRate, enemy.moveRate, enemy.wingRate);
                enemies.delete(enemy);
            }
        }
    },
    fighterDrone2: {
        size: 14,
        score: 800,
        hp: 80,
        screenTime: 10000,
        shotRate: 200,
        moveRate: 440,
        wingRate: 10,
        useRotation: true,
        patterns: ["basicForward"],
        script: (enemy, ms) => {
            if (enemy.moveCooldown <= 0) {
                if (enemy.despawnX === 0 && enemy.despawnY === 0){
                    enemy.pickFighterDespawnPoint();
                    
                    const vec = getVel(enemy.moveRate, aimAtDespawnPoint(enemy));
                    enemy.velX = vec.velX;
                    enemy.velY = vec.velY;
                }
                
                if (enemy.lifetime > enemy.screenTime)
                    enemies.delete(enemy);
                
                enemy.moveCooldown = Number.MAX_VALUE;
            }
            if (enemy.shotCooldown <= 0)
                enemy.basicFire();
            if (enemy.lifetime / 180 >= enemy.extraAttribute) {
                enemy.fireSpecificNoCooldown("basicTrail");
                enemy.extraAttribute++;
            }
            if (enemy.x + enemy.size < -10 || enemy.x - enemy.size > Global.BOARD_WIDTH + 10 ||
                enemy.y + enemy.size < -10 || enemy.y - enemy.size > Global.BOARD_HEIGHT + 10) {
                let newX = enemy.spawnX;
                let newY = enemy.spawnY;
                if (Math.floor(enemy.velX) === 0) { // math.floor is to catch rounding errors (floating point is wacky like that)
                    if (Player.x < enemy.x - 20) newX = enemy.spawnX - 60;
                    if (Player.x > enemy.x + 20) newX = enemy.spawnX + 60;
                }
                if (Math.floor(enemy.velY) === 0) {
                    if (Player.y < enemy.y - 20) newY = enemy.spawnY - 60;
                    if (Player.y > enemy.y + 20) newY = enemy.spawnY + 60;
                }
                new Enemy(newX, newY, enemy.size, enemy.score, enemy.hp, enemy.screenTime - enemy.lifetime,
                    enemy.patterns, enemy.script, enemy.waveId, enemy.type, enemy.shotRate, enemy.moveRate, enemy.wingRate);
                enemies.delete(enemy);
            }
        }
    },
    tankDrone1: {
        size: 20,
        score: 1500,
        hp: 1200,
        screenTime: 40000,
        shotRate: 4000,
        moveRate: 3000,
        wingRate: 10,
        useRotation: true,
        patterns: ["machineGunFire", "singleAimedBigShot"],
        script: (enemy, ms) => {
            const DECELERATION = 0.9;
            const DASH_VEL = 400;
            const THRESHOLD = 60;
            if (enemy.moveCooldown <= 0) {
                if (enemy.lifetime > enemy.screenTime && enemy.lifetime > 500) {
                    if (!enemy.despawning) {
                        enemy.pickDespawnPoint();
                        enemy.despawning = true;
                    }
                    enemy.despawnDash(DASH_VEL);
                }
                else if (enemy.y < THRESHOLD) enemy.downDash(DASH_VEL);
                else if (enemy.y > Global.BOARD_HEIGHT - THRESHOLD) enemy.upDash(DASH_VEL);
                else if (enemy.x < THRESHOLD) enemy.leftDash(DASH_VEL);
                else if (enemy.x > Global.BOARD_WIDTH - THRESHOLD) enemy.rightDash(DASH_VEL);
                
                enemy.moveCooldown = enemy.moveRate + (Math.random() * 2 - 1) * enemy.variance;
            } else if (enemy.velX > 1 || enemy.velY > 1 || enemy.velX < -1 || enemy.velY < -1) {
                enemy.velX *= (DECELERATION * ms / 1000) / (ms / 1000);
                enemy.velY *= (DECELERATION * ms / 1000) / (ms / 1000);
            } else {
                enemy.velX = 0;
                enemy.velY = 0;
            }
            if (enemy.shotCooldown <= 0)
                enemy.basicFire();
        }
    },
    tankDrone2: {
        size: 20,
        score: 2200,
        hp: 2100,
        screenTime: 80000,
        shotRate: 4500,
        moveRate: 2000,
        wingRate: 10,
        useRotation: true,
        patterns: ["expandingMachineGunFire", "basicRadial", "doubleSmallDartRay"],
        script: (enemy, ms) => {
            const DECELERATION = 0.94;
            const DASH_VEL = 600;
            const THRESHOLD = 70;
            if (enemy.moveCooldown <= 0) {
                if (enemy.lifetime > enemy.screenTime && enemy.lifetime > 500) {
                    if (!enemy.despawning) {
                        enemy.pickDespawnPoint();
                        enemy.despawning = true;
                    }
                    enemy.despawnDash(DASH_VEL);
                }
                else if (enemy.y < THRESHOLD) enemy.downDash(DASH_VEL);
                else if (enemy.y > Global.BOARD_HEIGHT - THRESHOLD) enemy.upDash(DASH_VEL);
                else if (enemy.x < THRESHOLD) enemy.leftDash(DASH_VEL);
                else if (enemy.x > Global.BOARD_WIDTH - THRESHOLD) enemy.rightDash(DASH_VEL);
                
                enemy.moveCooldown = enemy.moveRate + (Math.random() * 2 - 1) * enemy.variance;
            } else if (enemy.velX > 1 || enemy.velY > 1 || enemy.velX < -1 || enemy.velY < -1) {
                enemy.velX *= (DECELERATION * ms / 1000) / (ms / 1000);
                enemy.velY *= (DECELERATION * ms / 1000) / (ms / 1000);
            } else {
                enemy.velX = 0;
                enemy.velY = 0;
            }
            if (enemy.shotCooldown <= 0)
                enemy.basicFire();
        }
    },
    princessBee: {
        size: 28,
        score: 20000,
        hp: 10000,
        screenTime: 9999999, // go on. dodge for 3 hours
        shotRate: 2800,
        moveRate: 5000,
        wingRate: 10,
        useRotation: true,
        patterns: ["clusterRadial", "longRadialWave", "basicHomingShot", "slowSpiralRadialWave", "bigSmallRadial", "recursiveClusterRadial", "variantRadialWave", "bigSmallRadialWave"],
        script: (enemy, ms) => {
            const INITIAL_DECEL = 0.95;
            const ENRAGED_DECEL = 0.9;
            const INITIAL_DASH_VEL = 800;
            const DASH_VEL = 600;
            const THRESHOLD = 70;
            const phase = enemy.hp > 2000 ? 1 : 2;
            const phasePatterns = [
                [0, 1, 3, 4],
                [5, 6, 7]
            ];

            if (enemy.moveCooldown <= 0) {
                if (enemy.lifetime > enemy.screenTime && enemy.lifetime > 500) {
                    if (!enemy.despawning) {
                        enemy.pickDespawnPoint();
                        enemy.despawning = true;
                    }
                    enemy.despawnDash(phase === 2 ? DASH_VEL / 2 : DASH_VEL);
                }
                else if (enemy.y < THRESHOLD) enemy.downDash(INITIAL_DASH_VEL);
                else if (enemy.y > Global.BOARD_HEIGHT - THRESHOLD) enemy.upDash(INITIAL_DASH_VEL);
                else if (enemy.x < THRESHOLD) enemy.leftDash(INITIAL_DASH_VEL);
                else if (enemy.x > Global.BOARD_WIDTH - THRESHOLD) enemy.rightDash(INITIAL_DASH_VEL);
                else enemy.randomDash(phase === 2 ? DASH_VEL / 2 : DASH_VEL);
                
                enemy.moveCooldown = enemy.moveRate + (Math.random() * 2 - 1) * enemy.variance;
            } else if (enemy.velX > 1 || enemy.velY > 1 || enemy.velX < -1 || enemy.velY < -1) {
                enemy.velX *= ((phase === 2 ? ENRAGED_DECEL : INITIAL_DECEL) * ms / 1000) / (ms / 1000);
                enemy.velY *= ((phase === 2 ? ENRAGED_DECEL : INITIAL_DECEL) * ms / 1000) / (ms / 1000);
            } else {
                enemy.velX = 0;
                enemy.velY = 0;
            }
            if (enemy.shotCooldown <= 0)
                enemy.fireSpecific(enemy.patterns[randomPattern(phasePatterns[phase-1])]);
        }
    }
};
// note to self:
/*
make like multiple variants of each enemy to add variety without needing more spritework
(harder attacks, faster, whatever)
*/

function makeEnemy(x, y, type, waveId) {
    new Enemy(x, y,
        types[type].size, types[type].score, types[type].hp, types[type].screenTime, types[type].patterns, types[type].script,
        waveId, type, types[type].shotRate, types[type].moveRate, types[type].wingRate, types[type].useRotation);
    //pickDespawnPoint(x, y); why is this here???
}

export { enemies, types, makeEnemy };