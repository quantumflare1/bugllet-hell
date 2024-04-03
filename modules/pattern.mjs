import * as Bullets from "./bullets.mjs";
import * as Player from "./player.mjs";

function aimAtPlayer(x, y) {
    if (Player.y - y < 0) {
        return -Math.acos((Player.x - x) / Math.sqrt((Player.x - x) ** 2 + (Player.y - y) ** 2));
    } else {
        return Math.acos((Player.x - x) / Math.sqrt((Player.x - x) ** 2 + (Player.y - y) ** 2));
    }
}

function basicSpread(enemy) {
    const angle = aimAtPlayer(enemy.x, enemy.y);
    Bullets.makeBullet("basic", enemy.x, enemy.y, angle);
    Bullets.makeBullet("basic", enemy.x, enemy.y, angle + 0.2);
    Bullets.makeBullet("basic", enemy.x, enemy.y, angle - 0.2);

    setTimeout(() => {
        Bullets.makeBullet("basic", enemy.x, enemy.y, angle + 0.1);
        Bullets.makeBullet("basic", enemy.x, enemy.y, angle - 0.1);
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

export { basicSpread, basicTracker };