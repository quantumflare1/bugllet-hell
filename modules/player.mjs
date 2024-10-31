import * as Bullets from "./bullets.mjs";
import * as Global from "./global.mjs";
import * as Enemy from "./enemy.mjs";

const BASE_MOVEMENT = 400;
const BASE_FOCUS = 180;
const SHOOTING_MOVEMENT_PENALTY = 0.7;
const HORIZONTAL_BORDER = 40;
const VERTICAL_BORDER = 60;
const WINGBEATS_PER_SECOND = 20;
const BLINKS_PER_SECOND = 15;
const GRAZE_RADIUS = 10;
const GRAZE_PER_BULLET = 0.02;
const BOMB_BLAST_SPEED = 2000;
const BASE_LIVES = 6;
const BASE_BOMBS = 4;
const ANIM_FRAMES = 2;

let x, y, prevX, prevY, size;
let movingLeft, movingRight, movingUp, movingDown, isFiring;
let moveSpeed, focused;
let lives, bombs, score, power, prevPower;
let grazeMultiplier, prevGrazeMultiplier;
let timeSinceLastBullet, shotsSinceLastSub, fireCooldown;
let invTime, bombCooldown, bombRadius, bombBufferTime, prevBombs;
let animTimer, animFrame;
let blinkTimer, blinkState;

/**
 * @param {number} size 
 * @param {number} velX 
 * @param {number} velY 
 * @param {number} offsetX 
 * @param {number} offsetY 
 */
function fireBullet(size, velX, velY, offsetX, offsetY, type) {
    if (type === "normal")
        new Bullets.PlayerBullet(x + offsetX, y + offsetY, size, velX, velY, 2000, () => {}, () => {}, "player");
    if (type === "sub")
        new Bullets.PlayerBullet(x + offsetX, y + offsetY, size, velX, velY, 2000, (bullet, ms) => {
            if (bullet.target) {
                // get angle between current movement vector and relative enemy position, turn towards that direction
                // a bunch of expensive math incoming
                let moveAngle = Math.acos(bullet.velX / Math.sqrt(bullet.velX ** 2 + bullet.velY ** 2));
                if (bullet.velY < 0)
                    moveAngle *= -1;
                let enemyAngle = Math.acos((bullet.target.x - bullet.x) / Math.sqrt((bullet.target.x - bullet.x) ** 2 + (bullet.target.y - bullet.y) ** 2));
                if (bullet.target.y - bullet.y < 0)
                    enemyAngle *= -1;
                
                const angularDiff = moveAngle - enemyAngle;
                const angularDir = angularDiff < 0 ? -1 : 1;

                const angleChange = Math.min(bullet.maxHoming * ms / 1000, Math.abs(angularDiff));
                const newAngle = moveAngle - (angleChange * angularDir);
                const moveLength = Math.sqrt(bullet.velX ** 2 + bullet.velY ** 2);

                bullet.velX = moveLength * Math.cos(newAngle);
                bullet.velY = moveLength * Math.sin(newAngle);
            }
        }, (bullet) => {
            let shortestDist = Number.MAX_VALUE;
            let closestEnemy;
            for (const i of Enemy.enemies) {
                const enemyDist = Math.sqrt((bullet.x - i.x) ** 2 + (bullet.y - i.y) ** 2);
                if (enemyDist < shortestDist) {
                    shortestDist = enemyDist;
                    closestEnemy = i;
                }
            }

            bullet.target = closestEnemy;
            bullet.maxHoming = 3; // max radians turned per second
        }, "playerHoming");
}

/**
 * @param {KeyboardEvent} e
 */
function keydown(e) {
    //e.preventDefault()
    switch (e.key.toLowerCase()) {
        case "arrowup":
            movingUp = true;
            break;
        case "arrowdown":
            movingDown = true;
            break;
        case "arrowleft":
            movingLeft = true;
            break;
        case "arrowright":
            movingRight = true;
            break;
        case "shift":
            focused = true;
            setSpeed();
            break;
        case "x":
            if (!Global.paused && !Global.gameOver)
            bomb();
            break;
        case "z":
            isFiring = true;
            setSpeed();
            break;/*
        case "\\":
            lives++;
            power++;
            break;*/
    }
}

/**
 * @param {KeyboardEvent} e
 */
function keyup(e) {
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
            focused = false;
            setSpeed();
            break;
        case "Z":
        case "z":
            isFiring = false;
            setSpeed();
            break;
    }
}

function setSpeed() {
    moveSpeed = (focused? BASE_FOCUS : BASE_MOVEMENT) * (isFiring? SHOOTING_MOVEMENT_PENALTY : 1);
}

/**
 * @param {number} pow 
 */
function powerUp(pow) {
    power += pow;
    if (power > 4) power = 4;
    dispatchEvent(new Event("game_statupdate"));
}

/**
 * @param {number} points
 */
function scoreUp(points) {
    score += points;
    dispatchEvent(new Event("game_statupdate"));
}

function bomb() {
    if (prevBombs > 0 && bombCooldown < 0 && bombBufferTime > 0) {
        bombs = prevBombs - 1;
        power = prevPower;
        grazeMultiplier = prevGrazeMultiplier;
        lives++;
        invTime = 0;

        bombCooldown = 4000;
        dispatchEvent(new Event("game_statupdate"));
    }
    if (bombs > 0 && bombCooldown < 0) {
        bombs--;
        bombCooldown = 4000;
        dispatchEvent(new Event("game_statupdate"));
    }
}

/**
 * @param {object} e
 * @param {number} e.detail
 */
function pickUpPower(e) {
    powerUp(e.detail);
}

/**
 * @param {object} e
 * @param {number} e.detail
 */
function pickUpPoints(e) {
    scoreUp(e.detail);
}

/**
 * @param {object} e
 * @param {number} e.detail
 */
function pickUpLife(e) {
    lives += e.detail;
}

/**
 * @param {object} e
 * @param {number} e.detail
 */
function pickUpBomb(e) {
    bombs += e.detail;
}

/**
 * @param {number} ms 
 */
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

    prevX = x;
    prevY = y;
    x += moveX * ms / 1000;
    y += moveY * ms / 1000;
    bombBufferTime -= ms;

    if (y < VERTICAL_BORDER) {
        y = VERTICAL_BORDER;
    }
    else if (y > Global.BOARD_HEIGHT - VERTICAL_BORDER) {
        y = Global.BOARD_HEIGHT - VERTICAL_BORDER;
    }
    if (x < HORIZONTAL_BORDER) {
        x = HORIZONTAL_BORDER;
    }
    else if (x > Global.BOARD_WIDTH - HORIZONTAL_BORDER) {
        x = Global.BOARD_WIDTH - HORIZONTAL_BORDER;
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

    for (const i of Bullets.bullets) {
        const dist = Math.sqrt((i.x - x) ** 2 + (i.y - y) ** 2);
        if (invTime <= 0) {
            if (dist < i.size + size) {
                prevPower = power;
                prevGrazeMultiplier = grazeMultiplier;
                prevBombs = bombs;

                lives--;
                power = power > 0.1 ? power - 0.1 : 0;
                grazeMultiplier = 1;
                if (bombs < 3) bombs = 3;
                invTime = 2000;
                dispatchEvent(new Event("game_statupdate"));
                bombBufferTime = 150;

                break;
            }
            if (dist < i.size + GRAZE_RADIUS) 
                grazeMultiplier += GRAZE_PER_BULLET;
        }
        if (dist < i.size + bombRadius)
            Bullets.bullets.delete(i);
    }

    invTime -= ms;
    bombCooldown -= ms;
    animTimer += ms;
    if (invTime > 0) blinkTimer += ms;

    // flip between up and down wing states
    if (animTimer > 1000 / WINGBEATS_PER_SECOND) {
        animTimer = 0;
        animFrame = animFrame < ANIM_FRAMES - 1 ? animFrame + 1 : 0;
    }

    if (blinkTimer > 1000 / BLINKS_PER_SECOND) {
        blinkTimer = 0;
        blinkState = blinkState === 1 ? 0 : 1;
    }
    if (invTime <= 0) blinkState = 0;

    //power -= Math.sqrt(power) * ms / 1000 * POWER_LOSS_FACTOR;

    timeSinceLastBullet += ms;
    if (timeSinceLastBullet > fireCooldown && isFiring && invTime <= 0) {
        if (focused) {
            if (power >= 4) {
                fireBullet(5, 20, -2096, 10, 0, "normal");
                fireBullet(5, -20, -2096, -10, 0, "normal");
                fireBullet(6, 14, -2098, 9, 0, "normal");
                fireBullet(6, -14, -2098, -9, 0, "normal");
                fireBullet(7, 5, -2100, 8, 0, "normal");
                fireBullet(7, -5, -2100, -8, 0, "normal");
                fireBullet(7, 0, -2100, 5, -5, "normal");
                fireBullet(7, -0, -2100, -5, -5, "normal");
                fireBullet(8, 0, -2100, 0, -10, "normal");

                if (shotsSinceLastSub === 6) {
                    fireBullet(25, 600, -800, 16, 0, "sub");
                    fireBullet(25, -600, -800, -16, 0, "sub");
                    fireBullet(25, 0, -1000, 0, -20, "sub");
                    shotsSinceLastSub = 0;
                }
                fireCooldown = 75;
            }
            else if (power >= 3) {
                fireBullet(4, 16, -1885, 10, 0, "normal");
                fireBullet(4, -16, -1885, -10, 0, "normal");
                fireBullet(5, 6, -1888, 8, 0, "normal");
                fireBullet(5, -6, -1888, -8, 0, "normal");
                fireBullet(6, 0, -1890, 6, -5, "normal");
                fireBullet(6, -0, -1890, -6, -5, "normal");
                fireBullet(6, 0, -1890, 0, -10, "normal");

                if (shotsSinceLastSub === 7) {
                    fireBullet(24, 570, -760, 16, 0, "sub");
                    fireBullet(24, -570, -760, -16, 0, "sub");
                    fireBullet(24, 0, -950, 0, -20, "sub");
                    shotsSinceLastSub = 0;
                }
                fireCooldown = 80;
            }
            else if (power >= 2) {
                fireBullet(4, 8, -1679, 8, 0, "normal");
                fireBullet(4, -8, -1679, -8, 0, "normal");
                fireBullet(5, 0, -1680, 4, -6, "normal");
                fireBullet(5, 0, -1680, -4, -6, "normal");
                fireBullet(5, 0, -1680, 0, -10, "normal");

                if (shotsSinceLastSub === 7) {
                    fireBullet(22, 540, -720, 16, 0, "sub");
                    fireBullet(22, -540, -720, -16, 0, "sub");
                    shotsSinceLastSub = 0;
                }
                fireCooldown = 85;
            }
            else if (power >= 1) {
                fireBullet(3, 4, -1470, 5, -6, "normal");
                fireBullet(3, 4, -1470, -5, -6, "normal");
                fireBullet(4, 0, -1470, 0, -10, "normal");

                if (shotsSinceLastSub === 8) {
                    fireBullet(20, 0, -800, 0, -20, "sub");
                    shotsSinceLastSub = 0;
                }
                fireCooldown = 90;
            } else {
                fireBullet(3, 0, -1260, 0, -8, "normal");
                fireCooldown = 95;
            }
        } else {
            if (power >= 4) {
                fireBullet(6, 400, -1700, 10, 0, "normal");
                fireBullet(6, -400, -1700, -10, 0, "normal");
                fireBullet(7, 270, -1850, 8, 0, "normal");
                fireBullet(7, -270, -1850, -8, 0, "normal");
                fireBullet(7, 160, -1930, 6, 0, "normal");
                fireBullet(7, -160, -1930, -6, 0, "normal");
                fireBullet(8, 60, -1980, 4, -5, "normal");
                fireBullet(8, -60, -1980, -4, -5, "normal");
                fireBullet(8, 0, -2000, 0, -10, "normal");

                if (shotsSinceLastSub === 6) {
                    fireBullet(25, 600, -800, 16, 0, "sub");
                    fireBullet(25, -600, -800, -16, 0, "sub");
                    fireBullet(25, 0, -1000, 0, -20, "sub");
                    shotsSinceLastSub = 0;
                }
                fireCooldown = 75;
            }
            else if (power >= 3) {
                fireBullet(5, 320, -1560, 10, 0, "normal");
                fireBullet(5, -320, -1560, -10, 0, "normal");
                fireBullet(6, 180, -1720, 10, 0, "normal");
                fireBullet(6, -180, -1720, -10, 0, "normal");
                fireBullet(6, 60, -1800, 6, -5, "normal");
                fireBullet(6, -60, -1800, -6, -5, "normal");
                fireBullet(7, 0, -1800, 0, -10, "normal");

                if (shotsSinceLastSub === 7) {
                    fireBullet(24, 570, -760, 16, 0, "sub");
                    fireBullet(24, -570, -760, -16, 0, "sub");
                    fireBullet(24, 0, -950, 0, -20, "sub");
                    shotsSinceLastSub = 0;
                }
                fireCooldown = 80;
            }
            else if (power >= 2) {
                fireBullet(4, 200, -1500, 8, 0, "normal");
                fireBullet(4, -200, -1500, -8, 0, "normal");
                fireBullet(5, 80, -1570, 4, -6, "normal");
                fireBullet(5, -80, -1570, -4, -6, "normal");
                fireBullet(6, 0, -1600, 0, -10, "normal");

                if (shotsSinceLastSub === 7) {
                    fireBullet(22, 540, -720, 16, 0, "sub");
                    fireBullet(22, -540, -720, -16, 0, "sub");
                    shotsSinceLastSub = 0;
                }
                fireCooldown = 85;
            }
            else if (power >= 1) {
                fireBullet(3, 70, -1380, 2, -6, "normal");
                fireBullet(3, -70, -1380, -2, -6, "normal");
                fireBullet(4, 0, -1400, 0, -10, "normal");

                if (shotsSinceLastSub === 8) {
                    fireBullet(20, 0, -800, 0, -20, "sub");
                    shotsSinceLastSub = 0;
                }
                fireCooldown = 90;
            } else {
                fireBullet(3, 0, -1200, 0, -8, "normal");
                fireCooldown = 95;
            }
        }
        timeSinceLastBullet = 0;
        shotsSinceLastSub++;
    }
}

function reset() {
    moveSpeed = BASE_MOVEMENT;

    lives = BASE_LIVES;
    bombs = BASE_BOMBS;
    score = 0;
    power = 0;

    grazeMultiplier = 1;

    timeSinceLastBullet = 0;
    shotsSinceLastSub = 0;
    fireCooldown = 66;

    invTime = 0;
    bombCooldown = 0;
    bombRadius = 0;

    animTimer = 0;
    animFrame = 0;
    blinkTimer = 0;
    blinkState = 1;

    prevBombs = bombs;
    prevGrazeMultiplier = grazeMultiplier;
    prevPower = power;
}

function init() {
    // board size is 540x864
    x = Global.BOARD_WIDTH / 2;
    y = Global.BOARD_HEIGHT - 96;
    prevX = x;
    prevY = y;
    size = 5;
    moveSpeed = BASE_MOVEMENT;

    lives = BASE_LIVES;
    bombs = BASE_BOMBS;
    score = 0;
    power = Global.START_POWER;

    grazeMultiplier = 1;

    timeSinceLastBullet = 0;
    shotsSinceLastSub = 0;
    fireCooldown = 66;

    invTime = 0;
    bombCooldown = 0;
    bombRadius = 0;
    animTimer = 0;
    animFrame = 0;
    blinkTimer = 0;
    blinkState = 1;

    addEventListener("keydown", keydown);
    addEventListener("keyup", keyup);

    addEventListener("game_pickuppower", pickUpPower);
    addEventListener("game_pickuppoint", pickUpPoints);
    addEventListener("game_pickuplife", pickUpLife);
    addEventListener("game_pickupbomb", pickUpBomb);
}

export { x, y, prevX, prevY, movingLeft, movingRight, size, focused, lives, bombs, score, power, animFrame, blinkState, bombRadius, reset, init, tick, keydown, keyup, powerUp, scoreUp };