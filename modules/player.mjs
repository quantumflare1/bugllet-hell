import * as Bullets from "./bullets.mjs";
import * as Global from "./global.mjs";
import * as Pickup from "./pickup.mjs";

const BASE_MOVEMENT = 140;
const BASE_RUN = 252;
const BORDER_SIZE = 20;
const WINGBEATS_PER_SECOND = 20;
const BLINKS_PER_SECOND = 15;
const GRAZE_RADIUS = 10;
const GRAZE_DECAY_RATE = 0.08;
const GRAZE_PER_BULLET = 0.02;
const BOMB_BLAST_SPEED = 1000;

let x, y, size;
let movingLeft, movingRight, movingUp, movingDown, isFiring;
let moveSpeed;
let lives, bombs, score, power;
let grazeMultiplier, timeSinceLastGraze;
let timeSinceLastBullet, fireCooldown;
let invTime, bombCooldown, bombRadius;
let wingTimer, wingState;
let blinkTimer, blinkState;

function fireBullet(size, velX, velY, offsetX, offsetY) {
    // this is a test bullet that gets smaller
    new Bullets.Bullet(x + offsetX, y + offsetY, size, velX, velY, 0, 2000, /*(bullet, ms) => {
        const GROW_DELAY = 300;
        const GROW_RATE = 8;
        if (bullet.lifetime > GROW_DELAY && bullet.size > ms / 1000 * GROW_RATE) {
            bullet.size += ms / 1000 * GROW_RATE;
        }
    },*/() => {}, true);
}

function keydown(e = new KeyboardEvent()) {
    //e.preventDefault()
    switch (e.key) {
        case "ArrowUp":
            movingUp = true;
            break;
        case "ArrowDown":
            movingDown = true;
            break;
        case "ArrowLeft":
            movingLeft = true;
            break;
        case "ArrowRight":
            movingRight = true;
            break;
        case "Shift":
            moveSpeed = BASE_RUN;
            break;
        case "X":
        case "x":
            bomb();
            break;
        case "Z":
        case "z":
            isFiring = true;
            break;
        case "\\":
            lives++;
            power++;
            break;
    }
}

function keyup(e = new KeyboardEvent()) {
    switch (e.key) {
        case "ArrowUp":
            movingUp = false;
            break;
        case "ArrowDown":
            movingDown = false;
            break;
        case "ArrowLeft":
            movingLeft = false;
            break;
        case "ArrowRight":
            movingRight = false;
            break;
        case "Shift":
            moveSpeed = BASE_MOVEMENT;
            break;
        case "Z":
        case "z":
            isFiring = false;
            break;
    }
}

function powerUp(pow) {
    power += pow;
    if (power > 4) {
        power = 4;
    }
    dispatchEvent(new Event("game_statupdate"));
}

function scoreUp(points) {
    score += points;
    dispatchEvent(new Event("game_statupdate"));
}

function bomb() {
    if (bombs > 0 && bombCooldown < 0) {
        bombs--;
        bombCooldown = 4000;
        dispatchEvent(new Event("game_statupdate"));
    }
}

function pickUpPower(e) {
    powerUp(e.detail);
}

function pickUpPoints(e) {
    scoreUp(e.detail);
}

function pickUpLife(e) {
    lives += e.detail;
}

function pickUpBomb(e) {
    bombs += e.detail;
}

function tick(ms) {
    let moveX = 0;
    let moveY = 0;

    if (movingUp) {
        moveY -= moveSpeed;
    }
    if (movingDown) {
        moveY += moveSpeed;
    }
    if (movingLeft) {
        moveX -= moveSpeed;
    }
    if (movingRight) {
        moveX += moveSpeed;
    }

    x += moveX * ms / 1000;
    y += moveY * ms / 1000;

    if (y < BORDER_SIZE) {
        y = BORDER_SIZE;
    }
    else if (y > Global.BOARD_HEIGHT - BORDER_SIZE) {
        y = Global.BOARD_HEIGHT - BORDER_SIZE;
    }
    if (x < BORDER_SIZE) {
        x = BORDER_SIZE;
    }
    else if (x > Global.BOARD_WIDTH - BORDER_SIZE) {
        x = Global.BOARD_WIDTH - BORDER_SIZE;
    }

    timeSinceLastGraze += ms;
    if (timeSinceLastGraze > 1000) {
        grazeMultiplier -= GRAZE_DECAY_RATE * ms / 1000;
        if (grazeMultiplier < 1) {
            grazeMultiplier = 1;
        }
    }
    if (bombCooldown > 3500) {
        bombRadius += BOMB_BLAST_SPEED * ms / 1000;
        //Bullets.bullets.clear();
    } else {
        bombRadius = -10;
    }
    if (lives > 9) {
        bombs += lives - 9;
        lives = 9;
    }
    if (bombs > 9) {
        points += (bombs - 9) * 4000;
        bombs = 9;
    }
    if (invTime <= 0)
    for (const i of Bullets.bullets) {
        const dist = Math.sqrt((i.x - x) ** 2 + (i.y - y) ** 2);
        if (dist < i.size + size) {
            lives--;
            const oldPower = power;
            power = power > 0.2 ? power - 0.2 : 0;
            const powerDiff = oldPower - power;
            grazeMultiplier = 1;
            if (bombs < 2) {
                bombs = 2;
            }
            invTime = 2000;
            dispatchEvent(new Event("game_statupdate"));
            function pickupBehavior(ms) {
                if (this.lifetime > 200) {
                    this.velX = 0;
                    this.velY = 150;
                }
            }
            const pickupVelX = Math.random() > 0.5 ? Math.random() * 60 + 270 : Math.random() * 60 - 270;
            const pickupVelY = Math.random() > 0.5 ? Math.random() * 60 + 70 : Math.random() * 160 - 270;
            new Pickup.Pickup("power", x, y, 15, powerDiff - 0.05, pickupVelX, pickupVelY, pickupBehavior);
            break;
        }
        if (dist < i.size + GRAZE_RADIUS) {
            grazeMultiplier += GRAZE_PER_BULLET;
            timeSinceLastGraze = 0;
        }
        if (dist < i.size + bombRadius) {
            Bullets.bullets.delete(i);
        }
    }

    invTime -= ms;
    bombCooldown -= ms;
    wingTimer += ms;
    if (invTime > 0) blinkTimer += ms;

    // flip between up and down wing states
    if (wingTimer > 1000 / WINGBEATS_PER_SECOND) {
        wingTimer = 0;
        wingState = wingState === 1 ? 0 : 1;
    }

    if (blinkTimer > 1000 / BLINKS_PER_SECOND) {
        blinkTimer = 0;
        blinkState = blinkState === 1 ? 0 : 1;
    }
    if (invTime <= 0) {
        blinkState = 0;
    }

    //power -= Math.sqrt(power) * ms / 1000 * POWER_LOSS_FACTOR;

    timeSinceLastBullet += ms;
    if (timeSinceLastBullet > fireCooldown && isFiring && invTime <= 0) {
        if (power >= 4) {
            fireBullet(6, 180, -1920, 10, 0);
            fireBullet(6, -180, -1920, -10, 0);
            fireBullet(6, 100, -1960, 8, 0);
            fireBullet(6, -100, -1960, -8, 0);
            fireBullet(6, 20, -2000, 8, -5);
            fireBullet(6, -20, -2000, -8, -5);
            fireBullet(6, 0, -2000, 0, -10);
            fireCooldown = 45;
        }
        if (power >= 3) {
            fireBullet(6, 120, -1760, 10, 0);
            fireBullet(6, -120, -1760, -10, 0);
            fireBullet(6, 40, -1800, 6, -5);
            fireBullet(6, -40, -1800, -6, -5);
            fireBullet(6, 0, -1800, 0, -10);
            fireCooldown = 50;
        }
        else if (power >= 2) {
            fireBullet(6, 80, -1560, 8, 0);
            fireBullet(6, -80, -1560, -8, 0);
            fireBullet(6, 10, -1600, 4, -6);
            fireBullet(6, -10, -1600, -4, -6);
            fireCooldown = 55;
        }
        else if (power >= 1) {
            fireBullet(6, 20, -1400, 2, -8);
            fireBullet(6, -20, -1400, -2, -8);
            fireCooldown = 60;
        } else {
            fireBullet(6, 0, -1200, 0, -8);
            fireCooldown = 66;
        }
        timeSinceLastBullet = 0;
    }
}

function init() {
    // board size is 540x864
    x = Global.BOARD_WIDTH / 2;
    y = Global.BOARD_HEIGHT - 64;
    size = 5;
    moveSpeed = BASE_MOVEMENT;

    lives = 3;
    bombs = 2;
    score = 0;
    power = 0;

    grazeMultiplier = 1;
    timeSinceLastGraze = 0;

    timeSinceLastBullet = 0;
    fireCooldown = 66;

    invTime = 0;
    bombCooldown = 0;
    bombRadius = 0;
    wingTimer = 0;
    wingState = 0;
    blinkTimer = 0;
    blinkState = 1;

    addEventListener("game_pickuppower", pickUpPower);
    addEventListener("game_pickuppoint", pickUpPoints);
    addEventListener("game_pickuplife", pickUpLife);
    addEventListener("game_pickupbomb", pickUpBomb);
}

export { x, y, size, lives, bombs, score, power, wingState, blinkState, bombRadius, init, tick, keydown, keyup, powerUp, scoreUp };