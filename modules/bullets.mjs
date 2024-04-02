import * as Global from "./global.mjs";

class Bullet {
    constructor(x, y, size, velX, velY, rot, deathTime, script = () => {}) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.velX = velX;
        this.velY = velY;
        this.rot = rot;
        this.deathTime = deathTime;
        this.lifetime = 0;
        this.script = script;

        dispatchEvent(new CustomEvent("game_fire_bullet", {
            detail: this
        }));
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

        this.script(this);

        // kill bullets
        if (this.x - this.size > Global.BOARD_WIDTH || this.x + this.size < 0 ||
            this.y - this.size > Global.BOARD_HEIGHT || this.y + this.size < 0 ||
            this.size === 0 || this.lifetime > this.deathTime) {
            dispatchEvent(new CustomEvent("game_destroy_bullet", {
                detail: this
            }));
        }
    }
}

class PlayerBullet extends Bullet {
    constructor(x, y, size, velX, velY, rot, deathTime, script) {
        super(x, y, size, velX, velY, rot, deathTime, script);
        this.isFriendly = true;
    }
}

export { PlayerBullet };