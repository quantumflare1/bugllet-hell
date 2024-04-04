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
    Bullets.makeBullet("basic", enemy.x, enemy.y, angle);
}

function basicSpread(enemy) {
    const angle = aimAtPlayer(enemy.x, enemy.y);
    Bullets.makeBullet("basic", enemy.x, enemy.y, angle);
    Bullets.makeBullet("basic", enemy.x, enemy.y, angle + 0.2);
    Bullets.makeBullet("basic", enemy.x, enemy.y, angle - 0.2);

    setTimeout(() => {
        if (Enemy.enemies.has(enemy)) {
            Bullets.makeBullet("basic", enemy.x, enemy.y, angle + 0.1);
            Bullets.makeBullet("basic", enemy.x, enemy.y, angle - 0.1);
        }
    }, 250);
}

function basicTracker(enemy) {
    let bulletsShot = 0;
    const interval = setInterval(() => {
        bulletsShot++;

        Bullets.makeBullet("basic", enemy.x, enemy.y, aimAtPlayer(enemy.x, enemy.y));

        if (bulletsShot > 10) {
            clearInterval(interval);
        }
    }, 120);
}

function basicRadial(enemy) {
    const NUM_BULLETS = 32;
    for (let i = 0; i < NUM_BULLETS; i++) {
        Bullets.makeBullet("basic", enemy.x, enemy.y, (i * Math.PI * 2) / NUM_BULLETS);
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
        Bullets.makeBullet("massive", enemy.x, enemy.y, angle + deviation, randVel);
    }
    for (let i = 0; i < NUM_LARGE; i++) {
        const randVel = (Math.random() * 100) + Bullets.types.large.vel - 50;
        const deviation = (Math.random() * Math.PI / 6) - Math.PI / 12;
        Bullets.makeBullet("large", enemy.x, enemy.y, angle + deviation, randVel);
    }
    for (let i = 0; i < NUM_MEDIUM; i++) {
        const randVel = (Math.random() * 100) + Bullets.types.basic.vel - 50;
        const deviation = (Math.random() * Math.PI / 6) - Math.PI / 12;
        Bullets.makeBullet("basic", enemy.x, enemy.y, angle + deviation, randVel);
    }
}

function spiralDouble(enemy) {
    const angle = aimAtPlayer(enemy.x, enemy.y);
    Bullets.makeBullet("spiral", enemy.x, enemy.y, angle);

    setTimeout(() => {
        if (Enemy.enemies.has(enemy)) {
            const angle = aimAtPlayer(enemy.x, enemy.y);
            Bullets.makeBullet("spiral", enemy.x, enemy.y, angle);
        }
    }, 500);
}

export { singleAimedShot, basicSpread, basicTracker, basicRadial, erraticBurst, spiralDouble };