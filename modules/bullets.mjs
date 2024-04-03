import * as Global from "./global.mjs";

class Bullet {
    constructor(x, y, size, velX, velY, rot, expireTime, script = () => {}, friendly = false) {
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
        this.isFriendly = friendly;
        this.script = script;

        if (this.isFriendly) {
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
        if (this.x - this.size > Global.BOARD_WIDTH || this.x + this.size < 0 ||
            this.y - this.size > Global.BOARD_HEIGHT || this.y + this.size < 0 ||
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
        vel: 500,
        rot: 0,
        expireTime: 2000,
        script: () => {}
    },
    spiral: {
        size: 8,
        vel: 100,
        rot: 15,
        expireTime: 3000,
        script: (bullet, ms) => {
            const SPEED_MULTIPLIER = 4;
            bullet.x += bullet.baseVelX * ms / 1000 * SPEED_MULTIPLIER;
            bullet.y += bullet.baseVelY * ms / 1000 * SPEED_MULTIPLIER;
        }
    }
}

function makeBullet(type, x, y, dir) {
    const velX = types[type].vel * Math.cos(dir);
    const velY = types[type].vel * Math.sin(dir);
    new Bullet(x, y, types[type].size, velX, velY, types[type].rot, types[type].expireTime, types[type].script);
}

export { types, bullets, playerBullets, Bullet, makeBullet };