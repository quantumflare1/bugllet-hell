import * as Bullets from "./bullets.mjs";
import * as Enemy from "./enemy.mjs";
import * as Player from "./player.mjs";

function aimAtPlayer(x, y) {
    if (Player.y - y < 0) {
        return -Math.acos((Player.x - x) / Math.sqrt((Player.x - x) ** 2 + (Player.y - y) ** 2));
    } else {
        return Math.acos((Player.x - x) / Math.sqrt((Player.x - x) ** 2 + (Player.y - y) ** 2));
    }
}

function singleAimedShot(enemy) {
    const angle = aimAtPlayer(enemy.x, enemy.y);
    Bullets.makeBullet("basic", enemy.x, enemy.y, angle, 8);
}

function basicSpread(enemy) {
    const angle = aimAtPlayer(enemy.x, enemy.y);
    Bullets.makeBullet("basic", enemy.x, enemy.y, angle, 2);
    Bullets.makeBullet("basic", enemy.x, enemy.y, angle + 0.2, 2);
    Bullets.makeBullet("basic", enemy.x, enemy.y, angle - 0.2, 2);

    setTimeout(() => {
        if (Enemy.enemies.has(enemy)) {
            Bullets.makeBullet("basic", enemy.x, enemy.y, angle + 0.1, 2);
            Bullets.makeBullet("basic", enemy.x, enemy.y, angle - 0.1, 2);
        }
    }, 250);
}

function basicTracker(enemy) {
    let bulletsShot = 0;
    const interval = setInterval(() => {
        bulletsShot++;

        Bullets.makeBullet("basic", enemy.x, enemy.y, aimAtPlayer(enemy.x, enemy.y), 7);

        if (bulletsShot > 10 || !Enemy.enemies.has(enemy)) {
            clearInterval(interval);
        }
    }, 120);
}

function basicRadial(enemy) {
    const NUM_BULLETS = 32;
    for (let i = 0; i < NUM_BULLETS; i++) {
        Bullets.makeBullet("basic", enemy.x, enemy.y, (i * Math.PI * 2) / NUM_BULLETS, 2);
    }
}

function erraticBurst(enemy) {
    const NUM_MASSIVE = 2;
    const NUM_LARGE = 4;
    const NUM_MEDIUM = 4;

    const angle = aimAtPlayer(enemy.x, enemy.y);

    for (let i = 0; i < NUM_MASSIVE; i++) {
        const randVel = (Math.random() * 100) + Bullets.types.massive.vel - 50;
        const deviation = (Math.random() * Math.PI / 6) - Math.PI / 12;
        Bullets.makeBullet("massive", enemy.x, enemy.y, angle + deviation, randVel, 4);
    }
    for (let i = 0; i < NUM_LARGE; i++) {
        const randVel = (Math.random() * 100) + Bullets.types.large.vel - 50;
        const deviation = (Math.random() * Math.PI / 6) - Math.PI / 12;
        Bullets.makeBullet("large", enemy.x, enemy.y, angle + deviation, randVel, 3);
    }
    for (let i = 0; i < NUM_MEDIUM; i++) {
        const randVel = (Math.random() * 100) + Bullets.types.basic.vel - 50;
        const deviation = (Math.random() * Math.PI / 6) - Math.PI / 12;
        Bullets.makeBullet("basic", enemy.x, enemy.y, angle + deviation, randVel, 5);
    }
}

function spiralDouble(enemy) {
    const angle = aimAtPlayer(enemy.x, enemy.y);
    Bullets.makeBullet("spiral", enemy.x, enemy.y, angle, 6);

    setTimeout(() => {
        if (Enemy.enemies.has(enemy)) {
            const angle = aimAtPlayer(enemy.x, enemy.y);
            Bullets.makeBullet("spiral", enemy.x, enemy.y, angle, 6);
        }
    }, 500);
}

export { singleAimedShot, basicSpread, basicTracker, basicRadial, erraticBurst, spiralDouble };