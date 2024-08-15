import * as Bullets from "./bullets.mjs";
import * as Enemy from "./enemy.mjs";
import * as Player from "./player.mjs";

const patterns = new Set();
const TAU = Math.PI * 2;

class Pattern {
    constructor(parent, script, lastWave) {
        this.parent = parent;
        this.script = script;
        this.lifetime = 0;
        this.lastWave = lastWave;
        this.wave = 0;
        this.persistent = [];

        patterns.add(this);
    }
    tick(ms) {
        this.lifetime += ms;
        if (this.lastWave === 0 || this.wave > this.lastWave || !Enemy.enemies.has(this.parent)) patterns.delete(this);
        
        this.script(this);
    }
}

const types = {
    singleAimedShot: {
        lastWave: 0,
        script: (pat) => {
            const angle = aimAtPlayer(pat.parent.x, pat.parent.y);
            Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, angle, 8);
            pat.wave++;
        }
    },
    singleAimedBigShot: {
        lastWave: 0,
        script: (pat) => {
            const angle = aimAtPlayer(pat.parent.x, pat.parent.y);
            Bullets.makeBullet("massive", pat.parent.x, pat.parent.y, angle, 5);
            pat.wave++;
        }
    },
    singleAimedInaccurateShot: {
        lastWave: 0,
        script: (pat) => {
            const angle = aimAtPlayer(pat.parent.x, pat.parent.y);
            Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, angle, 2);
            pat.wave++;
        }
    },
    basicSpread: {
        lastWave: 1,
        script: (pat) => {
            switch (pat.wave) {
                case 0:
                    const angle = aimAtPlayer(pat.parent.x, pat.parent.y);
                    Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, angle, 2);
                    Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, angle + 0.2, 2);
                    Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, angle - 0.2, 2);
                    pat.wave++;
                    break;
                case 1:
                    if (pat.lifetime >= 250) {
                        const angle = aimAtPlayer(pat.parent.x, pat.parent.y);
                        Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, angle + 0.1, 2);
                        Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, angle - 0.1, 2);
                        pat.wave++;
                    }
                    break;
            }
        }
    },
    machineGunFire: {
        lastWave: 14,
        script: (pat) => {
            if (pat.lifetime > pat.wave * 70) {
                pat.wave++;
                Bullets.makeBullet("small", pat.parent.x, pat.parent.y, aimAtPlayer(pat.parent.x, pat.parent.y) + Math.random() * 0.4 - 0.2, randBulletStyle(5, 4));
            }
        }
    },
    expandingMachineGunFire: {
        lastWave: 9,
        script: (pat) => {
            if (pat.lifetime > pat.wave * 70) {
                pat.wave++;
                Bullets.makeBullet("grow1", pat.parent.x, pat.parent.y, aimAtPlayer(pat.parent.x, pat.parent.y) + Math.random() * 0.44 - 0.22, randBulletStyle(7, 3));
            }
        }
    },
    dartTriangle: {
        lastWave: 3,
        script: (pat) => {
            const spread = 12;
            switch (pat.wave) {
                case 0:
                    pat.persistent[0] = pat.parent.x; // initial firing location
                    pat.persistent[1] = pat.parent.y;
                    pat.persistent[2] = aimAtPlayer(pat.parent.x, pat.parent.y); // angle
                    pat.persistent[3] = Math.sin(pat.persistent[2]); // offsets
                    pat.persistent[4] = Math.cos(pat.persistent[2]);
                    Bullets.makeBullet("dart", pat.persistent[0], pat.persistent[1], pat.persistent[2], 2);
                    pat.wave++;
                    break;
                case 1:
                    if (pat.lifetime >= 80) {
                        Bullets.makeBullet("dart", pat.persistent[0] + pat.persistent[3] * spread, pat.persistent[1] - pat.persistent[4] * spread, pat.persistent[2], 3);
                        Bullets.makeBullet("dart", pat.persistent[0] - pat.persistent[3] * spread, pat.persistent[1] + pat.persistent[4] * spread, pat.persistent[2], 3);
                        pat.wave++;
                    }
                    break;
                case 2:
                    if (pat.lifetime >= 160) {
                        Bullets.makeBullet("dart", pat.persistent[0] + pat.persistent[3] * spread * 2, pat.persistent[1] - pat.persistent[4] * spread * 2, pat.persistent[2], 4);
                        Bullets.makeBullet("dart", pat.persistent[0], pat.persistent[1], pat.persistent[2], 4);
                        Bullets.makeBullet("dart", pat.persistent[0] - pat.persistent[3] * spread * 2, pat.persistent[1] + pat.persistent[4] * spread * 2, pat.persistent[2], 4);
                        pat.wave++;
                    }
                    break;
                case 3:
                    if (pat.lifetime >= 240) {
                        Bullets.makeBullet("dart", pat.persistent[0] + pat.persistent[3] * spread * 3, pat.persistent[1] - pat.persistent[4] * spread * 3, pat.persistent[2], 5);
                        Bullets.makeBullet("dart", pat.persistent[0] + pat.persistent[3] * spread, pat.persistent[1] - pat.persistent[4] * spread, pat.persistent[2], 5);
                        Bullets.makeBullet("dart", pat.persistent[0] - pat.persistent[3] * spread, pat.persistent[1] + pat.persistent[4] * spread, pat.persistent[2], 5);
                        Bullets.makeBullet("dart", pat.persistent[0] - pat.persistent[3] * spread * 3, pat.persistent[1] + pat.persistent[4] * spread * 3, pat.persistent[2], 5);
                        pat.wave++;
                    }
                    break;
            }
        }
    },
    basicTracker: {
        lastWave: 9,
        script: (pat) => {
            if (pat.lifetime > pat.wave * 120) {
                pat.wave++;
                Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, aimAtPlayer(pat.parent.x, pat.parent.y), randBulletStyle(7, 2));
            }
        }
    },
    shortVInaccurateTracker: {
        lastWave: 4,
        script: (pat) => {
            if (pat.lifetime > pat.wave * 100) {
                pat.wave++;
                Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, aimAtPlayer(pat.parent.x, pat.parent.y) + Math.random() * 0.3 - 0.15, randBulletStyle(5, 5));
            }
        }
    },
    basicRadial: {
        lastWave: 0,
        script: (pat) => {
            const NUM_BULLETS = 20;
            const style = randBulletStyle(2, 8);
            for (let i = 0; i < NUM_BULLETS; i++)
                Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, (i * TAU) / NUM_BULLETS, style);
            pat.wave++;
        }
    },
    sparseDoubleRadial: {
        lastWave: 1,
        script: (pat) => {
            const NUM_BULLETS = 12;
            switch (pat.wave) {
                case 0:
                    pat.persistent[0] = randBulletStyle(0, 4);
                    for (let i = 0; i < NUM_BULLETS; i++)
                        Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, (i * TAU) / NUM_BULLETS, pat.persistent[0]);
                    pat.wave++;
                    break;
                case 1:
                    if (pat.lifetime > 300) {
                        for (let i = 0; i < NUM_BULLETS; i++)
                            Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, (i * TAU) / NUM_BULLETS - Math.PI / NUM_BULLETS, pat.persistent[0]);
                        pat.wave++;
                    }
                    break;
            }
        }
    },
    basicTrail: {
        lastWave: 0,
        script: (pat) => {
            const vel = Math.sqrt(pat.parent.velX ** 2 + pat.parent.velY ** 2);
            Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, aimWithEnemy(pat.parent.velX, pat.parent.velY), 3, vel * 0.3);
            pat.wave++;
        }
    },
    basicForward: {
        lastWave: 0,
        script: (pat) => {
            const vel = Math.sqrt(pat.parent.velX ** 2 + pat.parent.velY ** 2);
            Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, aimWithEnemy(pat.parent.velX, pat.parent.velY), randBulletStyle(5, 3), vel + Bullets.types.basic.vel * 0.8);
            pat.wave++;
        }
    },
    basicRay: {
        lastWave: 0,
        script: (pat) => {
            const style = randBulletStyle(1, 4);
            for (let i = 0; i < 4; i++)
                Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, aimAtPlayer(pat.parent.x, pat.parent.y), style, 350 - 70 * i);
            pat.wave++;
        }
    },
    smallDartRay: {
        lastWave: 0,
        script: (pat) => {
            const style = randBulletStyle(1, 4);
            for (let i = 0; i < 3; i++)
                Bullets.makeBullet("dart", pat.parent.x, pat.parent.y, aimAtPlayer(pat.parent.x, pat.parent.y), style, 320 - 100 * i);
            pat.wave++;
        }
    },
    doubleSmallDartRay: {
        lastWave: 1,
        script: (pat) => {
            switch (pat.wave) {
                case 0:
                    pat.persistent[0] = randBulletStyle(1, 4); // style
                    for (let i = 0; i < 3; i++)
                        Bullets.makeBullet("dart", pat.parent.x, pat.parent.y, aimAtPlayer(pat.parent.x, pat.parent.y), pat.persistent[0], 360 - 100 * i);
                    pat.wave++;
                    break;
                case 1:
                    if (pat.lifetime > 800) {
                        for (let i = 0; i < 3; i++)
                            Bullets.makeBullet("dart", pat.parent.x, pat.parent.y, aimAtPlayer(pat.parent.x, pat.parent.y), pat.persistent[0], 360 - 100 * i);
                        pat.wave++;
                    }
                    break;
            }
        }
    },
    erraticBurst: {
        lastWave: 0,
        script: (pat) => {
            const angle = aimAtPlayer(pat.parent.x, pat.parent.y);

            for (let i = 0; i < 2; i++) {
                const deviation = (Math.random() * Math.PI / 6) - Math.PI / 12;
                Bullets.makeBullet("massive", pat.parent.x, pat.parent.y, angle + deviation, randBulletStyle(0, 10));
            }
            for (let i = 0; i < 4; i++) {
                const deviation = (Math.random() * Math.PI / 6) - Math.PI / 12;
                Bullets.makeBullet("large", pat.parent.x, pat.parent.y, angle + deviation, randBulletStyle(0, 10));
            }
            for (let i = 0; i < 4; i++) {
                const deviation = (Math.random() * Math.PI / 6) - Math.PI / 12;
                Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, angle + deviation, randBulletStyle(0, 10));
            }
            pat.wave++;
        }
    },
    clusterRadial: {
        lastWave: 0,
        script: (pat) => {
            const NUM_BULLETS = 14;
            const offset = Math.random() * TAU;
            for (let i = 0; i < NUM_BULLETS; i++)
                Bullets.makeBullet("burst", pat.parent.x, pat.parent.y, (i * TAU) / NUM_BULLETS + offset, randBulletStyle(0, 10));
            pat.wave++;
        }
    },
    recursiveClusterRadial: {
        lastWave: 3,
        script: (pat) => {
            if (pat.lifetime > pat.wave * 100) {
                pat.wave++;
                const NUM_BULLETS = 5;
                const offset = Math.random() * TAU;

                for (let i = 0; i < NUM_BULLETS; i++)
                    Bullets.makeBullet("burst1", pat.parent.x, pat.parent.y, (i * TAU) / NUM_BULLETS + offset + pat.wave, randBulletStyle(0, 10));
            }
        }
    },
    bigSmallRadial: {
        lastWave: 1,
        script: (pat) => {
            const NUM_BULLETS = 25;
            switch (pat.wave) {
                case 0:
                    for (let i = 0; i < NUM_BULLETS; i++)
                        Bullets.makeBullet("massive", pat.parent.x, pat.parent.y, (i * TAU) / NUM_BULLETS, 8);
                    pat.wave++;
                    break;
                case 1:
                    if (pat.lifetime > 300) {
                        for (let i = 0; i < NUM_BULLETS; i++)
                            Bullets.makeBullet("large", pat.parent.x, pat.parent.y, (i * TAU) / NUM_BULLETS - Math.PI / NUM_BULLETS, 7, 230);
                        pat.wave++;
                    }
                    break;
            }
        }
    },
    bigSmallRadialWave: {
        lastWave: 3,
        script: (pat) => {
            const NUM_BULLETS = 20;
            if (pat.lifetime > pat.wave * 400) {
                pat.wave++;
                for (let i = 0; i < NUM_BULLETS; i++) {
                    Bullets.makeBullet("massive", pat.parent.x, pat.parent.y, (i * TAU) / NUM_BULLETS + (pat.wave / 12) * TAU, 1);
                    Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, (i * TAU) / NUM_BULLETS - Math.PI / NUM_BULLETS + (pat.wave / 12) * TAU, 0, 230);
                }
            }
        }
    },
    longRadialWave: {
        lastWave: 26,
        script: (pat) => {
            const NUM_BULLETS = 12;
            if (pat.wave === 0) {
                pat.persistent[0] = Math.random() > 0.5 ? 1 : -1; // spin direction
                pat.persistent[1] = randBulletStyle(5, 3); // style
            }
            if (pat.lifetime > pat.wave * 90) {
                pat.wave++;
                for (let i = 0; i < NUM_BULLETS; i++)
                    Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, ((i * TAU) / NUM_BULLETS + (pat.wave / 27) * TAU) * pat.persistent[0], pat.persistent[1]);
            }
        }
    },
    slowSpiralRadialWave: {
        lastWave: 20,
        script: (pat) => {
            const NUM_BULLETS = 12;
            if (pat.wave === 0) pat.persistent[0] = randBulletStyle(2, 3); // style
            if (pat.lifetime > pat.wave * 100) {
                pat.wave++;
                for (let i = 0; i < NUM_BULLETS; i++)
                    Bullets.makeBullet("slowSpiral", pat.parent.x, pat.parent.y, (i * TAU) / NUM_BULLETS + pat.parent.rotation + pat.wave, pat.persistent[0]);
            }
        }
    },
    variantRadialWave: {
        lastWave: 20,
        script: (pat) => {
            const NUM_BULLETS = 18;
            if (pat.lifetime > pat.wave * 50 && pat.wave < 20) {
                pat.wave++;
                pat.parent.rotation += Math.random() * 0.2 + 0.6;
                for (let i = 0; i < NUM_BULLETS; i++)
                    Bullets.makeBullet("basic", pat.parent.x, pat.parent.y, (i * TAU) / NUM_BULLETS + pat.parent.rotation, 5);
            } else if (pat.wave === 20) {
                pat.wave++;
                pat.parent.rotation = 0;
            }
        }
    },
    spiralDouble: {
        lastWave: 1,
        script: (pat) => {
            switch (pat.wave) {
                case 0:
                    const angle = aimAtPlayer(pat.parent.x, pat.parent.y); // angle
                    Bullets.makeBullet("spiral", pat.parent.x, pat.parent.y, angle, 6);
                    pat.wave++;
                    break;
                case 1:
                    if (pat.lifetime > 500) {
                        const angle = aimAtPlayer(pat.parent.x, pat.parent.y);
                        Bullets.makeBullet("spiral", pat.parent.x, pat.parent.y, angle, 6);
                        pat.wave++;
                    }
                    break;
                }
        }
    }
};
// note to self for later: also rewrite menu system

function randBulletStyle(lower, range) {
    return (Math.floor(Math.random() * range) + lower) % 10;
}

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

function makePattern(parent, type) {
    new Pattern(parent, types[type].script, types[type].lastWave);
}

// recall: patterns is the set of patterns, types is the object of pattern data (old patterns)
export { patterns, makePattern };