import * as Bullets from "./bullets.mjs";
import * as Global from "./global.mjs";

const BASE_MOVEMENT = 140;
const BASE_RUN = 252;
const BORDER_SIZE = 20;
const POWER_LOSS_FACTOR = 0.02;
const WINGBEATS_PER_SECOND = 20;
const BLINKS_PER_SECOND = 15;
const GRAZE_RADIUS = 10;
const GRAZE_DECAY_RATE = 0.08;
const GRAZE_PER_BULLET = 0.02;

let x, y, size;
let movingLeft, movingRight, movingUp, movingDown, isFiring;
let moveSpeed;
let lives, bombs, score, power;
let grazeMultiplier, timeSinceLastGraze;
let timeSinceLastBullet, fireCooldown;
let invTime, bombCooldown;
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
                if (bombs > 0 && bombCooldown < 0) {
                    Bullets.bullets.clear();
                    bombs--;
                    bombCooldown = 4000;
                    dispatchEvent(new Event("game_statupdate"));
                }

                break;
        case "Z":
        case "z":
            isFiring = true;
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

function powerUp(damage) {
    if (power < 3.99) {
        power += damage / 140;
    }
}

function scoreUp(points) {
    score += points;
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
    if (bombCooldown > 1000) {
        Bullets.bullets.clear();
    }
    if (invTime <= 0)
    for (const i of Bullets.bullets) {
        const dist = Math.sqrt((i.x - x) ** 2 + (i.y - y) ** 2);
        if (dist < i.size + size) {
            lives--;
            power = power > 0.5 ? power - 0.5 : 0;
            grazeMultiplier = 1;
            if (bombs < 2) {
                bombs = 2;
            }
            invTime = 2000;
            dispatchEvent(new Event("game_statupdate"));
            break;
        }
        if (dist < i.size + GRAZE_RADIUS) {
            grazeMultiplier += GRAZE_PER_BULLET;
            timeSinceLastGraze = 0;
        }
    }

    invTime -= ms;
    bombCooldown -= ms;
    wingTimer += ms;
    if (invTime > 0) blinkTimer += ms;

    // flip between up and down wing states
    if (wingTimer > 1000 / WINGBEATS_PER_SECOND) {
        wingTimer -= 1000 / WINGBEATS_PER_SECOND;
        wingState = wingState === 1 ? 0 : 1;
    }

    if (blinkTimer > 1000 / BLINKS_PER_SECOND) {
        blinkTimer -= 1000 / BLINKS_PER_SECOND;
        blinkState = blinkState === 1 ? 0 : 1;
    }
    if (invTime <= 0) {
        blinkState = 0;
    }

    power -= Math.sqrt(power) * ms / 1000 * POWER_LOSS_FACTOR;
    if (power > 3.99) {
        power = 3.99;
    }
    else if (power < 0) {
        power = 0;
    }

    timeSinceLastBullet += ms;
    if (timeSinceLastBullet > fireCooldown && isFiring && invTime <= 0) {
        if (power > 3) {
            fireBullet(6, 120, -1760, 10, 0);
            fireBullet(6, -120, -1760, -10, 0);
            fireBullet(6, 40, -1800, 6, -5);
            fireBullet(6, -40, -1800, -6, -5);
            fireBullet(6, 0, -1800, 0, -10);
            fireCooldown = 50;
        }
        else if (power > 2) {
            fireBullet(6, 80, -1560, 8, 0);
            fireBullet(6, -80, -1560, -8, 0);
            fireBullet(6, 10, -1600, 4, -6);
            fireBullet(6, -10, -1600, -4, -6);
            fireCooldown = 55;
        }
        else if (power > 1) {
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
    wingTimer = 0;
    wingState = 0;
    blinkTimer = 0;
    blinkState = 1;
}

export { x, y, size, lives, bombs, score, power, wingState, blinkState, init, tick, keydown, keyup, powerUp, scoreUp };