import * as Player from "./modules/player.mjs";
import * as Global from "./modules/global.mjs";
import * as Bullets from "./modules/bullets.mjs";
import * as Pattern from "./modules/pattern.mjs";
import * as Enemy from "./modules/enemy.mjs";
import * as Level from "./modules/level.mjs";
import * as Pickup from "./modules/pickup.mjs";
import sprites from "./sprites.json" assert { type: "json" }
import font from "./assets/ui/font.json" assert { type: "json" }
import bullet from "./assets/enemy/bullets.json" assert { type: "json" }

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

const gameplayCanvas = document.createElement("canvas");
const gpctx = gameplayCanvas.getContext("2d");

let lastFrameTime = document.timeline.currentTime;
let fps = 0;
let msSinceLastFpsCheck = 0;
let framesSinceLastFpsCheck = 0;
let bgScroll = 0;
const bgScrollRate = 50;

const spriteImages = {};
const fontSheet = new Image();
const bulletSheet = new Image();

// temp
const title = "1-1: Instigation";

function fullscreen() {
    document.body.requestFullscreen({ navigationUI: "hide" });
}

function pause(e) {
    if (e.key === "Escape") {
        if (!Global.paused) {
            gpctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            gpctx.fillRect(0, 0, gameplayCanvas.width, gameplayCanvas.height);
    
            gpctx.font = "60px monospace";
            gpctx.textAlign = "center";
            gpctx.fillStyle = "rgb(255, 255, 255)";
            drawText(gpctx, "Paused", gameplayCanvas.width / 2 - 7 * 3 * 3, gameplayCanvas.height / 2, 3);
            gpctx.font = "20px monospace";
            drawText(gpctx, "Press Z to resume", gameplayCanvas.width / 2 - 7 * 9 * 2, gameplayCanvas.height / 2 + 70, 2);
            drawText(gpctx, "idk why the pause text looks so crusty it looks fine in the ui", 20, 20, 1);
        }

        Global.setPaused(true);
    } else if (e.key.toLowerCase() === "z") {
        Global.setPaused(false);
    }
}

function circle(context, x, y, r) {
    if (r < 0) {
        return;
    }
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.fill();
    context.closePath();
}

function drawText(context, text, sx, sy, scale) {
    for (let i = 0; i < text.length; i++) {
        context.drawImage(fontSheet, font[text[i]][0], font[text[i]][1], 7, 17, sx + i * 7 * scale, sy, 7 * scale, 17 * scale);
    }
}
function drawBullet(b) {
    const sprData = bullet[b.type][b.variety];
    gpctx.setTransform(1, 0, 0, 1, b.x, b.y);
    gpctx.rotate(Math.atan(b.velX / b.velY));
    gpctx.drawImage(bulletSheet, ...sprData, Math.floor(-sprData[2] / 2), Math.floor(-sprData[3] / 2), sprData[2], sprData[3]);
    gpctx.rotate(-Math.atan(b.velX / b.velY));
    gpctx.setTransform(1, 0, 0, 1, 0, 0);
}

function fillPowerMeter(scale) {
    ctx.fillStyle = "rgb(192, 151, 74)";
    ctx.fillRect(700 + 3 * scale, 560 + 10 * scale, Math.floor(Player.power / 4 * (spriteImages.ui.powerMeter.width * scale - 4 * scale) / scale) * scale, 4 * scale);
}

function draw() {
    //gpctx.fillStyle = "#333";
    //gpctx.fillRect(0, 0, 648, 864);
    gpctx.drawImage(spriteImages.ui.gameBg, 0, bgScroll - Global.BOARD_HEIGHT);
    gpctx.drawImage(spriteImages.ui.gameBg, 0, bgScroll);
    gpctx.drawImage(spriteImages.ui.vignette, 0, 0);

    gpctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    circle(gpctx, Player.x, Player.y, Player.bombRadius);

    gpctx.fillStyle = "rgb(80, 112, 128)";
    for (const i of Bullets.playerBullets) {
        gpctx.drawImage(spriteImages.player.bullet, Math.floor(i.x - spriteImages.player.bullet.width / 2), Math.floor(i.y - spriteImages.player.bullet.height / 2));
        //circle(gpctx, i.x, i.y, i.size);
    }

    if (Player.blinkState === 1) {
        gpctx.globalAlpha = 0.2;
    }
    gpctx.drawImage(spriteImages.player.body, Math.floor(Player.x - spriteImages.player.body.width / 2), Math.floor(Player.y - 23));
    gpctx.drawImage(spriteImages.player[`wings${Player.wingState}`], Math.floor(Player.x - spriteImages.player[`wings${Player.wingState}`].width / 2), Math.floor(Player.y - 10));
    gpctx.fillStyle = "rgb(150, 240, 255)";
    gpctx.globalAlpha = 1;
    //circle(gpctx, Player.x, Player.y, Player.size);

    gpctx.fillStyle = "rgb(0, 0, 255)";
    for (const i of Pickup.pickups) {
        gpctx.drawImage(spriteImages.pickup[i.type], Math.floor(i.x - i.size / 2), Math.floor(i.y - i.size / 2));
        //circle(gpctx, i.x, i.y, i.size);
    }
    gpctx.fillStyle = "rgb(180, 0, 0)";
    for (const i of Bullets.bullets) {
        drawBullet(i);
        //circle(gpctx, i.x, i.y, i.size);
    }
    gpctx.fillStyle = "rgb(255, 0, 0)";
    for (const i of Enemy.enemies) { // i am very good at naming variables
        gpctx.drawImage(spriteImages.enemy[i.type], Math.floor(i.x - spriteImages.enemy[i.type].width / 2), Math.floor(i.y - spriteImages.enemy[i.type].height / 2));
        if (spriteImages.enemy.hasOwnProperty(`${i.type}Wings${i.wingState}`)) {
            gpctx.drawImage(spriteImages.enemy[`${i.type}Wings${i.wingState}`], Math.floor(i.x - spriteImages.enemy[`${i.type}Wings${i.wingState}`].width / 2), Math.floor(i.y - spriteImages.enemy[`${i.type}Wings${i.wingState}`].height / 2));   
        }
        //circle(gpctx, i.x, i.y, i.size);
    }
}

function drawUI() {
    const scaleFactor = 3;
    ctx.drawImage(spriteImages.ui.bg, 0, 0);

    drawText(ctx, title, 700, 40, scaleFactor);

    ctx.drawImage(spriteImages.ui.scoreDisplay, 700, 100, spriteImages.ui.scoreDisplay.width * scaleFactor, spriteImages.ui.scoreDisplay.height * scaleFactor);
    for (let i = 0; i < 9; i++) {
        drawText(ctx, `${Math.floor((Player.score / (10 ** (8 - i))) % 10)}`, 700 + 4 * scaleFactor + 7 * scaleFactor * i, 100 + 13 * scaleFactor, scaleFactor);
    }
    
    ctx.font = "20px monospace";
    ctx.drawImage(spriteImages.ui.lifeDisplay, 700, 240, spriteImages.ui.lifeDisplay.width * scaleFactor, spriteImages.ui.lifeDisplay.height * scaleFactor);
    for (let i = 0; i < Player.lives; i++) {
        if (i % 2 === 0) {
            ctx.drawImage(spriteImages.ui.life, 700 + 4 * scaleFactor + i * 8 * scaleFactor, 240 + 12 * scaleFactor, spriteImages.ui.life.width * scaleFactor, spriteImages.ui.life.height * scaleFactor);
        } else {
            ctx.drawImage(spriteImages.ui.life, 700 + 4 * scaleFactor + i * 8 * scaleFactor, 240 + 23 * scaleFactor, spriteImages.ui.life.width * scaleFactor, spriteImages.ui.life.height * scaleFactor);
        }
    }

    ctx.drawImage(spriteImages.ui.bombDisplay, 700, 400, spriteImages.ui.bombDisplay.width * scaleFactor, spriteImages.ui.bombDisplay.height * scaleFactor);
    for (let i = 0; i < Player.bombs; i++) {
        if (i % 2 === 0) {
            ctx.drawImage(spriteImages.ui.bomb, 700 + 4 * scaleFactor + i * 8 * scaleFactor, 400 + 12 * scaleFactor, spriteImages.ui.bomb.width * scaleFactor, spriteImages.ui.bomb.height * scaleFactor);
        } else {
            ctx.drawImage(spriteImages.ui.bomb, 700 + 4 * scaleFactor + i * 8 * scaleFactor, 400 + 23 * scaleFactor, spriteImages.ui.bomb.width * scaleFactor, spriteImages.ui.bomb.height * scaleFactor);
        }
    }

    fillPowerMeter(scaleFactor);
    ctx.drawImage(spriteImages.ui.powerMeter, 700, 560, spriteImages.ui.powerMeter.width * scaleFactor, spriteImages.ui.powerMeter.height * scaleFactor);
    drawText(ctx, Player.power.toFixed(2), 700 + 26 * scaleFactor, 560 + 6 * scaleFactor, scaleFactor);

    drawText(ctx, `${fps.toFixed(2)} fps`, 700, 870 - 10 * scaleFactor, scaleFactor);
}

function tick(ms) {
    const timeElapsed = ms - lastFrameTime;
    msSinceLastFpsCheck += timeElapsed;
    framesSinceLastFpsCheck++;

    if (msSinceLastFpsCheck > 500) {
        fps = framesSinceLastFpsCheck / (msSinceLastFpsCheck / 1000);
        msSinceLastFpsCheck = 0;
        framesSinceLastFpsCheck = 0;
        drawUI();
    }

    if (!Global.paused) {
        bgScroll += bgScrollRate * timeElapsed / 1000;
        if (bgScroll >= Global.BOARD_HEIGHT) {
            bgScroll = 0;
        }
        Player.tick(timeElapsed);
        for (const i of Bullets.playerBullets) {
            i.tick(timeElapsed);
        }
        for (const i of Bullets.bullets) {
            i.tick(timeElapsed);
        }
        for (const i of Enemy.enemies) {
            i.tick(timeElapsed);
        }
        for (const i of Pickup.pickups) {
            i.tick(timeElapsed);
        }
        Level.level.tick(timeElapsed);
        draw();
    }

    lastFrameTime = ms;
    if (Player.lives >= 0)
    requestAnimationFrame(tick);
}

function load() {
    canvas.width = 1200;
    canvas.height = 900;
    document.getElementById("game").appendChild(canvas);
    ctx.imageSmoothingEnabled = false;
    gpctx.imageSmoothingEnabled = false;

    gameplayCanvas.width = Global.BOARD_WIDTH;
    gameplayCanvas.height = Global.BOARD_HEIGHT;
    gameplayCanvas.id = "gameplay";
    document.getElementById("game").appendChild(gameplayCanvas);

    Object.keys(sprites).forEach((v) => {
        spriteImages[v] = {};
        Object.keys(sprites[v]).forEach((val) => {
            spriteImages[v][val] = new Image();
            spriteImages[v][val].src = `./assets/${v}/${sprites[v][val]}`;
        });
    });
    fontSheet.src = "./assets/ui/font.png";
    fontSheet.addEventListener("load", drawUI);

    bulletSheet.src = "./assets/enemy/bullets.png";

    Player.init();
    //addEventListener("click", fullscreen);
    addEventListener("keydown", Player.keydown);
    addEventListener("keyup", Player.keyup);
    addEventListener("game_statupdate", drawUI);
    addEventListener("keydown", pause);

    console.log(`${performance.measure("loadtime").duration.toFixed(1)}ms load time`);
    requestAnimationFrame(tick);
}

addEventListener("load", load);