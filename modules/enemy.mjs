import * as Player from "./player.mjs";
import * as Pattern from "./pattern.mjs";
import * as Bullets from "./bullets.mjs";
import * as Global from "./global.mjs";
import * as Pickup from "./pickup.mjs";

const enemies = new Set();

// rewrite enemy ai
class Enemy {
    constructor(x, y, size, score, hp, screenTime, patterns, script, waveId, type, shotRate, moveRate, wingRate, useRotation, rotation = 0) {
        this.x = x;
        this.y = y;
        this.spawnX = x;
        this.spawnY = y;
        this.size = size;
        this.score = score;
        this.velX = 0;
        this.velY = 0;
        this.hp = hp;
        this.maxHp = hp;
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
        this.rotation = rotation;
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
                const damage = 3;
                this.hp -= damage;
                Bullets.playerBullets.delete(i);
                //Player.powerUp(damage / 1000);
                Player.scoreUp(1);
            }
        }
        const dist = Math.sqrt((Player.x - this.x) ** 2 + (Player.y - this.y) ** 2);
        if (dist < this.size + Player.bombRadius && this.bombImmunity < 0) {
            this.hp -= 60;
            this.bombImmunity = 1000;
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
            new Pickup.Pickup("power", this.x, this.y, 15, 0.12, 0, -230 + Math.random() * 60, pickupFall);
        }
        else if (Math.random() < 0.7) {
            if (Player.power < 4 && Math.random() < 0.6)
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
    basicFire() {
        this.shotCooldown = this.shotRate + (Math.random() * 2 - 1) * this.variance;
        Pattern.makePattern(this, randomPattern(this.patterns));
    }
    fireSpecificNoCooldown(pattern) {
        Pattern.makePattern(this, pattern);
    }
    fireSpecific(pattern) {
        this.shotCooldown = this.shotRate + (Math.random() * 2 - 1) * this.variance;
        Pattern.makePattern(this, pattern);
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
    pickDashNormal(vel) {
        if (this.lifetime > this.screenTime && this.lifetime > 500) {
            if (!this.despawning) {
                this.pickDespawnPoint();
                this.despawning = true;
            }
            this.despawnDash(vel);
        }
        else if (this.y < 20) this.downDash(vel);
        else if (this.y > Global.BOARD_HEIGHT - 20) this.upDash(vel);
        else if (this.x < 20) this.rightDash(vel);
        else if (this.x > Global.BOARD_WIDTH - 20) this.leftDash(vel);
        else this.randomDash(vel);
    }
}

function pickFighterDespawnPoint(e) {
    let despawnX = e.x;
    let despawnY = e.y;

    if (e.x < 0) despawnX = Global.BOARD_WIDTH + 25;
    else if (e.x > Global.BOARD_WIDTH) despawnX = -25;
    if (e.y < 0) despawnY = Global.BOARD_HEIGHT + 25;
    else if (e.y > Global.BOARD_HEIGHT) despawnY = -25;

    e.despawnX = despawnX;
    e.despawnY = despawnY;
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
        score: 250,
        hp: 60,
        screenTime: 18000,
        shotRate: 2200,
        moveRate: 18000,
        wingRate: 30,
        useRotation: false,
        patterns: ["tripleAimedInaccurateShot"],
        script: (enemy, ms) => {
            const DECELERATION = 0.87;
            const DASH_VEL = 600;
            if (enemy.moveCooldown <= 0) {
                enemy.pickDashNormal(DASH_VEL);
                
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
        score: 500,
        hp: 50,
        screenTime: 1500,
        shotRate: 1400,
        moveRate: 1600,
        wingRate: 30,
        useRotation: false,
        patterns: ["basicSpread", "shortVInaccurateTracker"],
        script: (enemy, ms) => {
            const DECELERATION = 0.85; // maybe these can be moved out as an object property
            const DASH_VEL = 500; // investigate later
            if (enemy.moveCooldown <= 0) {
                enemy.pickDashNormal(DASH_VEL);
                
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
        score: 2000,
        hp: 360,
        screenTime: 16000,
        shotRate: 1300,
        moveRate: 99999,
        wingRate: 30,
        useRotation: true,
        patterns: ["sparseDoubleRadial", "dartTriangle"],
        script: (enemy, ms) => {
            if (enemy.moveCooldown <= 0) {
                if (enemy.despawnX === 0 && enemy.despawnY === 0)
                    enemy.pickRandomDespawnPoint();

                const dist = Math.sqrt((enemy.x - enemy.despawnX) ** 2 + (enemy.y - enemy.despawnY) ** 2);
                const rotation = aimAtDespawnPoint(enemy);
                const vec = getVel(dist / enemy.screenTime * 1000, rotation);
                enemy.velX = vec.velX;
                enemy.velY = vec.velY;
                enemy.rotation = rotation - Math.PI / 2;
                
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
        score: 800,
        hp: 100,
        screenTime: 15000,
        shotRate: 1600,
        moveRate: 330,
        wingRate: 10,
        useRotation: true,
        patterns: ["basicRay"],
        script: (enemy, ms) => {
            if (enemy.moveCooldown <= 0) {
                if (enemy.despawnX === 0 && enemy.despawnY === 0){
                    pickFighterDespawnPoint(enemy);

                    const vec = getVel(enemy.moveRate, aimAtDespawnPoint(enemy));
                    enemy.velX = vec.velX;
                    enemy.velY = vec.velY;

                    if (Math.floor(enemy.velY) === 0) {
                        if (enemy.velX > 0) enemy.rotation = -Math.PI / 2;
                        if (enemy.velX < 0) enemy.rotation = Math.PI / 2;
                    }
                }
                
                if (enemy.lifetime > enemy.screenTime)
                    enemies.delete(enemy);
                
                enemy.moveCooldown = Number.MAX_VALUE;
            }
            if (enemy.shotCooldown <= 0)
                enemy.basicFire();
            if (enemy.lifetime / 400 >= enemy.extraAttribute) {
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
                    if (Player.y < enemy.y - 20) newY = enemy.spawnY - 40;
                    if (Player.y > enemy.y + 20) newY = enemy.spawnY + 40;
                }
                new Enemy(newX, newY, enemy.size, enemy.score, enemy.hp, enemy.screenTime - enemy.lifetime,
                    enemy.patterns, enemy.script, enemy.waveId, enemy.type, enemy.shotRate, enemy.moveRate, enemy.wingRate, enemy.useRotation, enemy.rotation);
                enemies.delete(enemy);
            }
        }
    },
    fighterDrone2: {
        size: 14,
        score: 2100,
        hp: 140,
        screenTime: 13000,
        shotRate: 240,
        moveRate: 440,
        wingRate: 10,
        useRotation: true,
        patterns: ["spreadForward", "basicForward"],
        script: (enemy, ms) => {
            if (enemy.moveCooldown <= 0) {
                if (enemy.despawnX === 0 && enemy.despawnY === 0){
                    pickFighterDespawnPoint(enemy);
                    
                    const vec = getVel(enemy.moveRate, aimAtDespawnPoint(enemy));
                    enemy.velX = vec.velX;
                    enemy.velY = vec.velY;

                    if (Math.floor(enemy.velY) === 0) {
                        if (enemy.velX > 0) enemy.rotation = -Math.PI / 2;
                        if (enemy.velX < 0) enemy.rotation = Math.PI / 2;
                    }
                }
                
                if (enemy.lifetime > enemy.screenTime)
                    enemies.delete(enemy);
                
                enemy.moveCooldown = Number.MAX_VALUE;
            }
            if (enemy.shotCooldown <= 0) {
                if (Math.floor(enemy.velY) === 0) enemy.fireSpecific("spreadForward");
                if (Math.floor(enemy.velX) === 0) enemy.fireSpecific("basicForward");
            }
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
                    if (Player.y < enemy.y - 20) newY = enemy.spawnY - 80;
                    if (Player.y > enemy.y + 20) newY = enemy.spawnY + 80;
                }
                new Enemy(newX, newY, enemy.size, enemy.score, enemy.hp, enemy.screenTime - enemy.lifetime,
                    enemy.patterns, enemy.script, enemy.waveId, enemy.type, enemy.shotRate, enemy.moveRate, enemy.wingRate, enemy.useRotation, enemy.rotation);
                enemies.delete(enemy);
            }
        }
    },
    tankDrone1: {
        size: 20,
        score: 3500,
        hp: 2700,
        screenTime: 35000,
        shotRate: 4000,
        moveRate: 3000,
        wingRate: 10,
        useRotation: false,
        patterns: ["machineGunFire", "singleAimedBigShot"],
        script: (enemy, ms) => {
            const DECELERATION = 0.9;
            const DASH_VEL = 400;
            const THRESHOLD = 100;
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
                else if (enemy.x < THRESHOLD) enemy.rightDash(DASH_VEL);
                else if (enemy.x > Global.BOARD_WIDTH - THRESHOLD) enemy.leftDash(DASH_VEL);
                
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
        score: 4200,
        hp: 4000,
        screenTime: 70000,
        shotRate: 4500,
        moveRate: 2000,
        wingRate: 10,
        useRotation: false,
        patterns: ["expandingMachineGunFire", "basicRadial", "doubleSmallDartRay"],
        script: (enemy, ms) => {
            const DECELERATION = 0.94;
            const DASH_VEL = 400;
            const THRESHOLD = 120;
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
        score: 25000,
        hp: 20000,
        screenTime: 9999999, // go on. dodge for 3 hours
        shotRate: 2800,
        moveRate: 5000,
        wingRate: 10,
        useRotation: true,
        patterns: ["clusterRadial", "longRadialWave", "basicHomingShot", "slowSpiralRadialWave", "bigSmallRadial", "recursiveClusterRadial", "variantRadialWave", "bigSmallRadialWave"],
        script: (enemy, ms) => {
            const INITIAL_DECEL = 0.93;
            const ENRAGED_DECEL = 0.9;
            const INITIAL_DASH_VEL = 600;
            const DASH_VEL = 400;
            const THRESHOLD_TOP = 70;
            const THRESHOLD_BOTTOM = 450;
            const THRESHOLD_SIDE = 150;
            const phase = enemy.hp > enemy.maxHp/2 ? 1 : 2;
            const phasePatterns = [
                [0, 1, 3, 4],
                [5, 6, 7]
            ];
            if (enemy.extraAttribute === 0) enemy.extraAttribute = 1;

            if (enemy.moveCooldown <= 0) {
                if (enemy.lifetime > enemy.screenTime && enemy.lifetime > 500) {
                    if (!enemy.despawning) {
                        enemy.pickDespawnPoint();
                        enemy.despawning = true;
                    }
                    enemy.despawnDash(phase === 2 ? DASH_VEL / 2 : DASH_VEL);
                }
                else if (enemy.y < 0) enemy.downDash(INITIAL_DASH_VEL);
                else if (enemy.y < THRESHOLD_TOP) enemy.downDash(DASH_VEL);
                else if (enemy.y > Global.BOARD_HEIGHT - THRESHOLD_BOTTOM) enemy.upDash(DASH_VEL);
                else if (enemy.x < THRESHOLD_SIDE) enemy.rightDash(DASH_VEL);
                else if (enemy.x > Global.BOARD_WIDTH - THRESHOLD_SIDE) enemy.leftDash(DASH_VEL);
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
            if (enemy.extraAttribute !== phase) {
                enemy.extraAttribute = phase;

                // copy/pasted from player.mjs
                function pickupBehavior(ms) {
                    if (this.lifetime > 400) {
                        this.velX = 0;
                        this.velY = 120;
                    } else {
                        this.velX -= 300 * ms / 1000;
                        this.velY += 300 * ms / 1000;
                    }
                }
                for (let i = 0; i < 5; i++) {
                    const pickupVelX = Math.random() > 0.5 ? Math.random() * 60 + 270 : Math.random() * 60 - 270;
                    const pickupVelY = Math.random() * 160 - 270;
                    new Pickup.Pickup((Player.power === 4) ? "point" : "power", enemy.x, enemy.y, 15, 0.08, pickupVelX, pickupVelY, pickupBehavior);
                }
            }
        }
    }
};

function makeEnemy(x, y, type, waveId) {
    new Enemy(x, y,
        types[type].size, types[type].score, types[type].hp, types[type].screenTime, types[type].patterns, types[type].script,
        waveId, type, types[type].shotRate, types[type].moveRate, types[type].wingRate, types[type].useRotation);
}

export { enemies, types, makeEnemy };