import * as Global from "./global.mjs";
import * as Player from "./player.mjs";

// todo: maybe tick bullets twice per frame? (more accurate collision)
class Bullet {
    constructor(x, y, size, velX, velY, rot, expireTime, script = () => {}, type, variety) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.velX = velX;
        this.velY = velY;
        this.baseVelX = velX;
        this.baseVelY = velY;
        this.rot = rot;
        this.expireTime = expireTime;
        this.lifetime = 0;
        this.grazed = false;
        this.script = script;
        this.type = type;
        this.variety = variety;

        if (this.type === "player") {
            playerBullets.add(this);
        } else {
            bullets.add(this);
        }
    }
    tick(ms) {
        this.lifetime += ms;
        this.x += this.velX * ms / 1000;
        this.y += this.velY * ms / 1000;

        const prevVecLength = Math.sqrt(this.velX ** 2 + this.velY ** 2);
        const rotX = -this.velY * this.rot * ms / 1000;
        const rotY = this.velX * this.rot * ms / 1000;
        this.velX += rotX;
        this.velY += rotY;
        const newVecLength = Math.sqrt(this.velX ** 2 + this.velY ** 2);
        this.velX *= prevVecLength / newVecLength;
        this.velY *= prevVecLength / newVecLength;

        this.script(this, ms);

        // kill bullets
        if (this.x - this.size > Global.BOARD_WIDTH + 10 || this.x + this.size < -10 ||
            this.y - this.size > Global.BOARD_HEIGHT + 10 || this.y + this.size < -10 ||
            this.size === 0 || this.lifetime > this.expireTime) {
            if (this.isFriendly) {
                playerBullets.delete(this);
            } else {
                bullets.delete(this);
            }
        }
    }
}

const bullets = new Set();
const playerBullets = new Set();

function aimAtPoint(x, y) {
    if (y < 0)
        return -Math.acos(x / Math.sqrt(x ** 2 + y ** 2));
    else
        return Math.acos(x / Math.sqrt(x ** 2 + y ** 2));
}

const types = {
    basic: {
        size: 6,
        vel: 300,
        rot: 0,
        expireTime: 10000,
        script: () => {}
    },
    small: {
        size: 3,
        vel: 360,
        rot: 0,
        expireTime: 9000,
        script: () => {}
    },
    large: {
        size: 10,
        vel: 260,
        rot: 0,
        expireTime: 12000,
        script: () => {}
    },
    massive: {
        size: 24,
        vel: 210,
        rot: 0,
        expireTime: 15000,
        script: () => {}
    },
    spiral: {
        size: 8,
        vel: 90,
        rot: 15,
        expireTime: 13000,
        script: (bullet, ms) => {
            const SPEED_MULTIPLIER = 3;
            bullet.x += bullet.baseVelX * ms / 1000 * SPEED_MULTIPLIER;
            bullet.y += bullet.baseVelY * ms / 1000 * SPEED_MULTIPLIER;
        }
    },
    dart: {
        size: 6,
        vel: 400,
        rot: 0,
        expireTime: 10000,
        script: () => {}
    },
    grow1: {
        size: 3,
        vel: 360,
        rot: 0,
        expireTime: 9000,
        script: (bullet, ms) => {
            if (bullet.lifetime > 700) {
                bullets.delete(bullet);
                makeBullet("grow2", bullet.x, bullet.y, aimAtPoint(bullet.velX, bullet.velY), bullet.variety, Math.sqrt(bullet.velX ** 2 + bullet.velY ** 2));
            }
        }
    },
    grow2: {
        size: 6,
        vel: 300,
        rot: 0,
        expireTime: 10000,
        script: (bullet, ms) => {
            if (bullet.lifetime > 700) {
                bullets.delete(bullet);
                makeBullet("large", bullet.x, bullet.y, aimAtPoint(bullet.velX, bullet.velY), bullet.variety, Math.sqrt(bullet.velX ** 2 + bullet.velY ** 2));
            }
        }
    },
    burst: {
        size: 10,
        vel: 220,
        rot: 0,
        expireTime: 10000,
        script: (bullet, ms) => {
            if (bullet.lifetime > 700) {
                const angle = Math.random() * 2 * Math.PI;
                const variety = Math.floor(Math.random() * 10);
                bullets.delete(bullet);
                for (let i = 0; i < 8; i++) {
                    makeBullet("basic", bullet.x, bullet.y, angle + (i / 8) * 2 * Math.PI, variety, Math.sqrt(bullet.velX ** 2 + bullet.velY ** 2));
                }
            }
        }
    },
    burst1: {
        size: 10,
        vel: 220,
        rot: 0,
        expireTime: 10000,
        script: (bullet, ms) => {
            if (bullet.lifetime > 700) {
                const angle = Math.random() * 2 * Math.PI;
                const variety = Math.floor(Math.random() * 10);
                bullets.delete(bullet);
                for (let i = 0; i < 4; i++) {
                    makeBullet("burst2", bullet.x, bullet.y, angle + (i / 8) * 2 * Math.PI, variety, Math.sqrt(bullet.velX ** 2 + bullet.velY ** 2));
                }
            }
        }
    },
    burst2: {
        size: 6,
        vel: 260,
        rot: 0,
        expireTime: 10000,
        script: (bullet, ms) => {
            if (bullet.lifetime > 700) {
                const angle = Math.random() * 2 * Math.PI;
                const variety = Math.floor(Math.random() * 10);
                bullets.delete(bullet);
                for (let i = 0; i < 3; i++) {
                    makeBullet("small", bullet.x, bullet.y, angle + (i / 8) * 2 * Math.PI, variety, Math.sqrt(bullet.velX ** 2 + bullet.velY ** 2));
                }
            }
        }
    },
    homing: {
        size: 6,
        vel: 300,
        rot: 0,
        expireTime: 10000,
        script: (bullet, ms) => {
            if (bullet.lifetime < 4000) {
                const angleToPlayer = aimAtPoint(Player.x, Player.y);
                const netVel = Math.sqrt(bullet.velX ** 2 + bullet.velY ** 2); // lot of unnecessary expensive math going on, maybe optimize that out
                bullet.velX = netVel * Math.cos(angleToPlayer);
                bullet.velY = netVel * Math.sin(angleToPlayer);
            }
        }
    },
    slowSpiral: {
        size: 8,
        vel: 270,
        rot: 0.7,
        expireTime: 5000,
        script: () => {}
    }
}

function makeBullet(type, x, y, dir, variety, vel = types[type].vel) {
    const velX = vel * Math.cos(dir);
    const velY = vel * Math.sin(dir);
    new Bullet(x, y, types[type].size, velX, velY, types[type].rot, types[type].expireTime, types[type].script, type, variety);
}

export { types, bullets, playerBullets, Bullet, makeBullet };