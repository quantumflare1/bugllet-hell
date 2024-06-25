import * as Player from "./player.mjs";

const pickups = new Set();

class Pickup {
    constructor(type, x, y) {
        this.type = type;
        this.size = 10;
        this.x = x;
        this.y = y;

        pickups.add(this);
    }
    tick(ms) {
        this.y -= 80 * ms / 1000;
        
        const dist = Math.sqrt((this.x - Player.x) ** 2 + (this.y - Player.y) ** 2);
        if (dist < this.size + Player.size) {
            dispatchEvent(new Event(`game_pickup${this.type}`));
            pickups.delete(this);
        }
    }
}

export { pickups, Pickup };