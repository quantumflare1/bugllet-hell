import * as Global from "./global.mjs";

// todo: add bullet spread (inaccuracy)
// also todo: maybe tick bullets twice per frame? (more accurate collision)
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

const types = {
    basic: {
        size: 6,
        vel: 300,
        rot: 0,
        expireTime: 3000,
        script: () => {}
    },
    small: {
        size: 3,
        vel: 360,
        rot: 0,
        expireTime: 2500,
        script: () => {}
    },
    large: {
        size: 10,
        vel: 250,
        rot: 0,
        expireTime: 4000,
        script: () => {}
    },
    massive: {
        size: 24,
        vel: 170,
        rot: 0,
        expireTime: 5000,
        script: () => {}
    },
    spiral: {
        size: 8,
        vel: 90,
        rot: 15,
        expireTime: 3500,
        script: (bullet, ms) => {
            const SPEED_MULTIPLIER = 3;
            bullet.x += bullet.baseVelX * ms / 1000 * SPEED_MULTIPLIER;
            bullet.y += bullet.baseVelY * ms / 1000 * SPEED_MULTIPLIER;
        }
    }
}

function makeBullet(type, x, y, dir, variety) {
    const velX = types[type].vel * Math.cos(dir);
    const velY = types[type].vel * Math.sin(dir);
    new Bullet(x, y, types[type].size, velX, velY, types[type].rot, types[type].expireTime, types[type].script, type, variety);
}

export { types, bullets, playerBullets, Bullet, makeBullet };