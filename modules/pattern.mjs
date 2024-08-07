import * as Bullets from "./bullets.mjs";
import * as Enemy from "./enemy.mjs";
import * as Player from "./player.mjs";

// todo: pausing currently fucks up all patterns that rely on a delay
const patterns = {
    singleAimedShot(enemy) {
        const angle = aimAtPlayer(enemy.x, enemy.y);
        Bullets.makeBullet("basic", enemy.x, enemy.y, angle, 8);
    },
    singleAimedBigShot(enemy) {
        const angle = aimAtPlayer(enemy.x, enemy.y);
        Bullets.makeBullet("massive", enemy.x, enemy.y, angle, 1);
    },
    singleAimedVariantShot(enemy) {
        const angle = aimAtPlayer(enemy.x, enemy.y) + Math.random() * 0.1 - 0.05;
        Bullets.makeBullet("basic", enemy.x, enemy.y, angle, 8);
    },
    basicSpread(enemy) {
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
    },
    machineGunFire(enemy) {
        let bulletsShot = 0;
        const interval = setInterval(() => {
            bulletsShot++;
    
            Bullets.makeBullet("small", enemy.x, enemy.y, aimAtPlayer(enemy.x, enemy.y) + Math.random() * 0.4 - 0.2, 0);
    
            if (bulletsShot >= 16 || !Enemy.enemies.has(enemy)) {
                clearInterval(interval);
            }
        }, 70);
    },
    expandingMachineGunFire(enemy) {
        let bulletsShot = 0;
        const interval = setInterval(() => {
            bulletsShot++;
    
            Bullets.makeBullet("grow1", enemy.x, enemy.y, aimAtPlayer(enemy.x, enemy.y) + Math.random() * 0.3 - 0.15, 0);
    
            if (bulletsShot >= 10 || !Enemy.enemies.has(enemy)) {
                clearInterval(interval);
            }
        }, 70);
    },
    dartTriangle(enemy) {
        const angle = aimAtPlayer(enemy.x, enemy.y);
        Bullets.makeBullet("dart", enemy.x, enemy.y, angle, 2);
        const instantX = enemy.x;
        const instantY = enemy.y;
    
        const spreadFactor = 12;
        setTimeout(() => {
            if (Enemy.enemies.has(enemy)) {
                Bullets.makeBullet("dart", instantX + Math.sin(angle) * spreadFactor, instantY - Math.cos(angle) * spreadFactor, angle, 4);
                Bullets.makeBullet("dart", instantX - Math.sin(angle) * spreadFactor, instantY + Math.cos(angle) * spreadFactor, angle, 4);
            }
        }, 80);
    
        setTimeout(() => {
            if (Enemy.enemies.has(enemy)) {
                Bullets.makeBullet("dart", instantX + Math.sin(angle) * spreadFactor * 2, instantY - Math.cos(angle) * spreadFactor * 2, angle, 5);
                Bullets.makeBullet("dart", instantX, instantY, angle, 5);
                Bullets.makeBullet("dart", instantX - Math.sin(angle) * spreadFactor * 2, instantY + Math.cos(angle) * spreadFactor * 2, angle, 5);
            }
        }, 160);
    
        setTimeout(() => {
            if (Enemy.enemies.has(enemy)) {
                Bullets.makeBullet("dart", instantX + Math.sin(angle) * spreadFactor * 3, instantY - Math.cos(angle) * spreadFactor * 3, angle, 8);
                Bullets.makeBullet("dart", instantX + Math.sin(angle) * spreadFactor, instantY - Math.cos(angle) * spreadFactor, angle, 8);
                Bullets.makeBullet("dart", instantX - Math.sin(angle) * spreadFactor, instantY + Math.cos(angle) * spreadFactor, angle, 8);
                Bullets.makeBullet("dart", instantX - Math.sin(angle) * spreadFactor * 3, instantY + Math.cos(angle) * spreadFactor * 3, angle, 8);
            }
        }, 240);
    },
    basicTracker(enemy) {
        let bulletsShot = 0;
        const interval = setInterval(() => {
            bulletsShot++;
    
            Bullets.makeBullet("basic", enemy.x, enemy.y, aimAtPlayer(enemy.x, enemy.y), 7);
    
            if (bulletsShot >= 10 || !Enemy.enemies.has(enemy)) {
                clearInterval(interval);
            }
        }, 120);
    },
    shortVeryVariantTracker(enemy) {
        let bulletsShot = 0;
        const interval = setInterval(() => {
            bulletsShot++;
    
            Bullets.makeBullet("basic", enemy.x, enemy.y, aimAtPlayer(enemy.x, enemy.y) + Math.random() * 0.3 - 0.15, 7);
    
            if (bulletsShot >= 4 || !Enemy.enemies.has(enemy)) {
                clearInterval(interval);
            }
        }, 100);
    },
    basicRadial(enemy) {
        const NUM_BULLETS = 20;
        for (let i = 0; i < NUM_BULLETS; i++) {
            Bullets.makeBullet("basic", enemy.x, enemy.y, (i * Math.PI * 2) / NUM_BULLETS, 2);
        }
    },
    sparseDoubleRadial(enemy) {
        const NUM_BULLETS = 12;
        for (let i = 0; i < NUM_BULLETS; i++) {
            Bullets.makeBullet("basic", enemy.x, enemy.y, (i * Math.PI * 2) / NUM_BULLETS, 2);
        }
        setTimeout(() => {
            if (Enemy.enemies.has(enemy)) {
                for (let i = 0; i < NUM_BULLETS; i++) {
                    Bullets.makeBullet("basic", enemy.x, enemy.y, (i * Math.PI * 2) / NUM_BULLETS - Math.PI * 2 / (NUM_BULLETS * 2), 2);
                }
            }
        }, 300);
    },
    basicTrail(enemy) {
        const vel = Math.sqrt(enemy.velX ** 2 + enemy.velY ** 2);
        Bullets.makeBullet("basic", enemy.x, enemy.y, aimWithEnemy(enemy.velX, enemy.velY), 3, vel * 0.3);
    },
    basicForward(enemy) {
        const vel = Math.sqrt(enemy.velX ** 2 + enemy.velY ** 2);
        Bullets.makeBullet("basic", enemy.x, enemy.y, aimWithEnemy(enemy.velX, enemy.velY), 6, vel + Bullets.types.basic.vel);
    },
    basicRay(enemy) {
        Bullets.makeBullet("basic", enemy.x, enemy.y, aimAtPlayer(enemy.x, enemy.y), 1, 450);
        Bullets.makeBullet("basic", enemy.x, enemy.y, aimAtPlayer(enemy.x, enemy.y), 1, 360);
        Bullets.makeBullet("basic", enemy.x, enemy.y, aimAtPlayer(enemy.x, enemy.y), 1, 270);
        Bullets.makeBullet("basic", enemy.x, enemy.y, aimAtPlayer(enemy.x, enemy.y), 1, 180);
        Bullets.makeBullet("basic", enemy.x, enemy.y, aimAtPlayer(enemy.x, enemy.y), 1, 90);
    },
    smallDartRay(enemy) {
        Bullets.makeBullet("dart", enemy.x, enemy.y, aimAtPlayer(enemy.x, enemy.y), 1, 330);
        Bullets.makeBullet("dart", enemy.x, enemy.y, aimAtPlayer(enemy.x, enemy.y), 1, 220);
        Bullets.makeBullet("dart", enemy.x, enemy.y, aimAtPlayer(enemy.x, enemy.y), 1, 110);
    },
    doubleSmallDartRay(enemy) {
        this.smallDartRay(enemy);
        setTimeout(() => {
            if (Enemy.enemies.has(enemy))
                this.smallDartRay(enemy);
        }, 800);
    },
    erraticBurst(enemy) {
        const NUM_MASSIVE = 2;
        const NUM_LARGE = 4;
        const NUM_MEDIUM = 4;
    
        const angle = aimAtPlayer(enemy.x, enemy.y);
    
        for (let i = 0; i < NUM_MASSIVE; i++) {
            //const randVel = (Math.random() * 100) + Bullets.types.massive.vel - 50;
            const deviation = (Math.random() * Math.PI / 6) - Math.PI / 12;
            Bullets.makeBullet("massive", enemy.x, enemy.y, angle + deviation, 1);
        }
        for (let i = 0; i < NUM_LARGE; i++) {
            //const randVel = (Math.random() * 100) + Bullets.types.large.vel - 50;
            const deviation = (Math.random() * Math.PI / 6) - Math.PI / 12;
            Bullets.makeBullet("large", enemy.x, enemy.y, angle + deviation, 1);
        }
        for (let i = 0; i < NUM_MEDIUM; i++) {
            //const randVel = (Math.random() * 100) + Bullets.types.basic.vel - 50;
            const deviation = (Math.random() * Math.PI / 6) - Math.PI / 12;
            Bullets.makeBullet("basic", enemy.x, enemy.y, angle + deviation, 1);
        }
    },
    clusterRadial(enemy) {
        const NUM_BULLETS = 16;
        for (let i = 0; i < NUM_BULLETS; i++) {
            Bullets.makeBullet("burst", enemy.x, enemy.y, (i * Math.PI * 2) / NUM_BULLETS, 1);
        }
    },
    recursiveClusterRadial(enemy) {
        const NUM_BULLETS = 6;
        let wavesShot = 0;

        const interval = setInterval(() => {
            wavesShot++;
    
            for (let i = 0; i < NUM_BULLETS; i++) {
                Bullets.makeBullet("burst1", enemy.x, enemy.y, (i * Math.PI * 2) / NUM_BULLETS + (wavesShot / 8) * 2 * Math.PI, 1);
            }
            if (wavesShot >= 4 || !Enemy.enemies.has(enemy)) {
                clearInterval(interval);
            }
        }, 100);
    },
    bigSmallRadial(enemy) {
        const NUM_BULLETS = 18;
        for (let i = 0; i < NUM_BULLETS; i++) {
            Bullets.makeBullet("massive", enemy.x, enemy.y, (i * Math.PI * 2) / NUM_BULLETS, 1);
        }

        setTimeout(() => {
            if (Enemy.enemies.has(enemy)) {
                for (let i = 0; i < NUM_BULLETS; i++) {
                    Bullets.makeBullet("basic", enemy.x, enemy.y, (i * Math.PI * 2) / NUM_BULLETS - Math.PI * 2 / (NUM_BULLETS * 2), 0, 230);
                }
            }
        }, 300);
    },
    bigSmallRadialWave(enemy) {
        const NUM_BULLETS = 20;
        let wavesShot = 0;

        const interval = setInterval(() => {
            wavesShot++;
            if (Enemy.enemies.has(enemy)) {
                for (let i = 0; i < NUM_BULLETS; i++) {
                    Bullets.makeBullet("massive", enemy.x, enemy.y, (i * Math.PI * 2) / NUM_BULLETS + (wavesShot / 12) * 2 * Math.PI, 1);
                }
                for (let i = 0; i < NUM_BULLETS; i++) {
                    Bullets.makeBullet("basic", enemy.x, enemy.y, (i * Math.PI * 2) / NUM_BULLETS - Math.PI * 2 / (NUM_BULLETS * 2) + (wavesShot / 12) * 2 * Math.PI, 0, 230);
                }
            }
            if (wavesShot >= 4 || !Enemy.enemies.has(enemy)) {
                clearInterval(interval);
            }
        }, 400);
    },
    longRadialWave(enemy) {
        let wavesShot = 0;
        const NUM_BULLETS = 6;
        const interval = setInterval(() => {
            wavesShot++;
    
            for (let i = 0; i < NUM_BULLETS; i++) {
                Bullets.makeBullet("basic", enemy.x, enemy.y, (i * Math.PI * 2) / NUM_BULLETS + (wavesShot / 17) * 2 * Math.PI, 5);
            }
            if (wavesShot >= 30 || !Enemy.enemies.has(enemy)) {
                clearInterval(interval);
            }
        }, 40);
    },
    slowSpiralRadialWave(enemy) {
        let wavesShot = 0;
        const NUM_BULLETS = 16;
        const interval = setInterval(() => {
            wavesShot++;

            for (let i = 0; i < NUM_BULLETS; i++) {
                Bullets.makeBullet("slowSpiral", enemy.x, enemy.y, (i * Math.PI * 2) / NUM_BULLETS + enemy.rotation, 4);
            }
            if (wavesShot >= 20 || !Enemy.enemies.has(enemy)) {
                clearInterval(interval);
            }
        }, 100);
    },
    // broken
    reverseRadialWave(enemy) {
        let wavesShot = 0;
        const NUM_BULLETS = 16;
        const interval = setInterval(() => {
            wavesShot++;

            const angle = (i * Math.PI * 2) / NUM_BULLETS;
            for (let i = 0; i < NUM_BULLETS; i++) {
                Bullets.makeBullet("basic", enemy.x * Math.cos(angle) * -500 /* placeholder number */, enemy.y * Math.sin(angle) * -500, (i * Math.PI * 2) / NUM_BULLETS, 5);
            }
            if (wavesShot >= 20 || !Enemy.enemies.has(enemy)) {
                clearInterval(interval);
            }
        }, 100);
    },
    variantRadialWave(enemy) {
        let wavesShot = 0;
        const NUM_BULLETS = 15;
        const interval = setInterval(() => {
            wavesShot++;

            enemy.rotation += Math.random() * 0.2 + 0.6;
            for (let i = 0; i < NUM_BULLETS; i++) {
                Bullets.makeBullet("basic", enemy.x, enemy.y, (i * Math.PI * 2) / NUM_BULLETS + enemy.rotation, 5);
            }
            if (wavesShot >= 20 || !Enemy.enemies.has(enemy)) {
                clearInterval(interval);
            }
        }, 50);
    },
    // broken
    basicHomingShot(enemy) {
        const spreadFactor = 14;
        const angle = aimAtPlayer(enemy.x, enemy.y);
        Bullets.makeBullet("homing", enemy.x + Math.sin(angle) * spreadFactor * 2, enemy.y - Math.cos(angle) * spreadFactor, angle, 9);
        Bullets.makeBullet("homing", enemy.x + Math.sin(angle) * spreadFactor, enemy.y - Math.cos(angle) * spreadFactor * 2, angle, 9);
        Bullets.makeBullet("homing", enemy.x, enemy.y, angle, 5);
        Bullets.makeBullet("homing", enemy.x - Math.sin(angle) * spreadFactor, enemy.y + Math.cos(angle) * spreadFactor, angle, 9);
        Bullets.makeBullet("homing", enemy.x - Math.sin(angle) * spreadFactor * 2, enemy.y - Math.cos(angle) * spreadFactor * 2, angle, 9);
    },
    spiralDouble(enemy) {
        const angle = aimAtPlayer(enemy.x, enemy.y);
        Bullets.makeBullet("spiral", enemy.x, enemy.y, angle, 6);
    
        setTimeout(() => {
            if (Enemy.enemies.has(enemy)) {
                const angle = aimAtPlayer(enemy.x, enemy.y);
                Bullets.makeBullet("spiral", enemy.x, enemy.y, angle, 6);
            }
        }, 500);
    }
};

function aimAtPlayer(x, y) {
    if (Player.y - y < 0) {
        return -Math.acos((Player.x - x) / Math.sqrt((Player.x - x) ** 2 + (Player.y - y) ** 2));
    } else {
        return Math.acos((Player.x - x) / Math.sqrt((Player.x - x) ** 2 + (Player.y - y) ** 2));
    }
}

function aimWithEnemy(velX, velY) {
    if (velY < 0) {
        return -Math.acos(velX / Math.sqrt(velX ** 2 + velY ** 2));
    } else {
        return Math.acos(velX / Math.sqrt(velX ** 2 + velY ** 2));
    }
}

export { patterns };