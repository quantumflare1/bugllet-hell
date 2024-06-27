import * as Player from "./player.mjs";
import * as Global from "./global.mjs";

const pickups = new Set();

class Pickup {
    constructor(type, x, y, size, value, velX, velY, script) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.velX = velX;
        this.velY = velY;
        this.baseVelX = velX;
        this.baseVelY = velY;
        this.size = size;
        this.value = value;
        this.script = script;
        this.lifetime = 0;

        pickups.add(this);
    }
    tick(ms) {
        this.lifetime += ms;
        this.script(ms);

        this.x += this.velX * ms / 1000;
        this.y += this.velY * ms / 1000;

        const dist = Math.sqrt((this.x - Player.x) ** 2 + (this.y - Player.y) ** 2);
        if (dist < this.size + Player.size && this.lifetime > 200) {
            dispatchEvent(new CustomEvent(`game_pickup${this.type}`, { detail: this.value }));
            pickups.delete(this);
        }
        if (this.x - this.size >= Global.BOARD_WIDTH || this.x + this.size <= 0 ||
            this.y - this.size >= Global.BOARD_HEIGHT) {
                pickups.delete(this);
        }
    }
}

export { pickups, Pickup };