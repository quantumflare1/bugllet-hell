import * as Bullets from "./bullets.mjs";
import * as Global from "./global.mjs";

const BASE_MOVEMENT = 140;
const BASE_RUN = 252;
const BORDER_SIZE = 20;
const POWER_LOSS_FACTOR = 0.02;

let x, y, size;
let movingLeft, movingRight, movingUp, movingDown, isFiring;
let moveSpeed;
let lives, bombs, score, power;
let timeSinceLastBullet, fireCooldown;
let invTime, bombCooldown;

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
        case "X":
            case "x":
                if (bombs > 0 && bombCooldown < 0) {
                    Bullets.bullets.clear();
                    bombs--;
                    bombCooldown = 4000;
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
    power += damage / 140;
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

    if (bombCooldown > 1000) {
        Bullets.bullets.clear();
    }
    if (invTime <= 0)
    for (const i of Bullets.bullets) {
        const dist = Math.sqrt((i.x - x) ** 2 + (i.y - y) ** 2);
        if (dist < i.size + size) {
            lives--;
            power = power > 0.5 ? power - 0.5 : 0;
            if (bombs < 2) {
                bombs = 2;
            }
            invTime = 2000;
        }
    }
    invTime -= ms;
    bombCooldown -= ms;

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
            fireBullet(8, 60, -780, 16, -8);
            fireBullet(8, -60, -780, -16, -8);
            fireBullet(8, 0, -800, 10, -10);
            fireBullet(8, 0, -800, -10, -10);
            fireBullet(8, 0, -800, 0, -12);
            fireCooldown = 50;
        }
        else if (power > 2) {
            fireBullet(8, 40, -780, 12, -8);
            fireBullet(8, -40, -780, -12, -8);
            fireBullet(8, 0, -800, 5, -10);
            fireBullet(8, 0, -800, -5, -10);
            fireCooldown = 55;
        }
        else if (power > 1) {
            fireBullet(9, 10, -800, 2, -10);
            fireBullet(9, -10, -800, -2, -10);
            fireCooldown = 60;
        } else {
            fireBullet(10, 0, -800, 0, -10);
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

    timeSinceLastBullet = 0;
    fireCooldown = 66;

    invTime = 0;
    bombCooldown = 0;
}

export { x, y, size, lives, bombs, score, power, init, tick, keydown, keyup, powerUp };