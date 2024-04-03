import * as Bullets from "./bullets.mjs";
import * as Global from "./global.mjs";

const BASE_MOVEMENT = 140;
const BASE_RUN = 252;
const BORDER_SIZE = 20;
const POWER_LOSS_FACTOR = 0.1;

let x, y, size;
let movingLeft, movingRight, movingUp, movingDown, isFiring;
let moveSpeed;
let lives, bombs, score, power;
let timeSinceLastBullet, fireCooldown;
let invTime;

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

    if (invTime <= 0)
    for (const i of Bullets.bullets) {
        const dist = Math.sqrt((i.x - x) ** 2 + (i.y - y) ** 2);
        if (dist < i.size + size) {
            lives--;
            invTime = 2000;
        }
    }
    invTime -= ms;

    power -= Math.sqrt(power) * ms / 1000 * POWER_LOSS_FACTOR;
    if (power > 4.99) {
        power = 4.99;
    }
    else if (power < 0) {
        power = 0;
    }

    timeSinceLastBullet += ms;
    if (timeSinceLastBullet > fireCooldown && isFiring) {
        if (power > 4) {
            fireBullet(6, 60, -780, 20, 0);
            fireBullet(6, -60, -780, -20, 0);
            fireBullet(6, 0, -800, 14, 0);
            fireBullet(6, 0, -800, -14, 0);
            fireBullet(6, 0, -800, 0, 0);
        }
        else if (power > 3) {
            fireBullet(6, 60, -780, 12, 0);
            fireBullet(6, -60, -780, -12, 0);
            fireBullet(6, 0, -800, 10, 0);
            fireBullet(6, 0, -800, -10, 0);
        }
        else if (power > 2) {
            fireBullet(6, 40, -780, 12, 0);
            fireBullet(6, -40, -780, -12, 0);
            fireBullet(6, 0, -800, 0, 0);
        }
        else if (power > 1) {
            fireBullet(6, 10, -800, 6, 0);
            fireBullet(6, -10, -800, -6, 0);
        } else {
            fireBullet(6, 0, -800, 0, 0);
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
    power = 5;

    timeSinceLastBullet = 0;
    fireCooldown = 66;

    invTime = 0;
}

export { x, y, size, lives, bombs, score, power, init, tick, keydown, keyup };