import { PlayerBullet } from "./bullets.mjs";
import * as Global from "./global.mjs";

const BASE_MOVEMENT = 140;
const BASE_RUN = 252;
const BORDER_SIZE = 20;

let x, y;
let movingLeft, movingRight, movingUp, movingDown, isFiring;
let moveSpeed;
let lives, bombs, score, power;
let timeSinceLastBullet, fireCooldown;

function fireBullet() {
    // this is a test bullet that gets bigger
    const bullet = new PlayerBullet(x, y, 3, 0, -800, 0, 1000, (bullet) => {
        if (bullet.lifetime > 500 && bullet.size > 0.1) {
            bullet.size -= 0.1;
        }
        if (bullet.size <= 0.1) {
            bullet.size = 0;
        }
    });
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

    timeSinceLastBullet += ms;

    if (timeSinceLastBullet > fireCooldown && isFiring) {
        timeSinceLastBullet = 0;
        fireBullet();
    }

    power -= Math.sqrt(power) / 2000;
    if (power > 4.99) {
        power = 4.99;
    }
    else if (power < 0) {
        power = 0;
    }
}

function init() {
    // board size is 540x864
    x = Global.BOARD_WIDTH / 2;
    y = Global.BOARD_HEIGHT - 64;
    moveSpeed = BASE_MOVEMENT;

    lives = 3;
    bombs = 2;
    score = 0;
    power = 5;

    timeSinceLastBullet = 0;
    fireCooldown = 66;
}

export { x, y, lives, bombs, score, power, init, tick, keydown, keyup };