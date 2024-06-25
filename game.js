import * as Player from "./modules/player.mjs";
import * as Global from "./modules/global.mjs";
import * as Bullets from "./modules/bullets.mjs";
import * as Pattern from "./modules/pattern.mjs";
import * as Enemy from "./modules/enemy.mjs";
import * as Level from "./modules/level.mjs";
import sprites from "./sprites.json" assert { type: "json" }
import font from "./font.json" assert { type: "json" }

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

const gameplayCanvas = document.createElement("canvas");
const gpctx = gameplayCanvas.getContext("2d");

let lastFrameTime = document.timeline.currentTime;
const bullets = new Set();
const playerBullets = new Set();

const spriteImages = {};
const fontBitmap = new Image();

// temp
const title = "1-1: First Encounter";

function fullscreen() {
    document.body.requestFullscreen({ navigationUI: "hide" });
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

function drawText(context, text, sx, sy) {
    for (let i = 0; i < text.length; i++) {
        context.drawImage(fontBitmap, font[text[i]][0], font[text[i]][1], 7, 12, sx + i * 14, sy, 14, 24);
    }
}

function fillPowerMeter() {
    ctx.fillStyle = "rgb(192, 151, 74)";
    ctx.fillRect(702, 414, Math.floor(Player.power / 4 * (spriteImages.ui.powerMeter.width - 8)), 16);
}

function draw() {
    gpctx.fillStyle = "#333";
    gpctx.fillRect(0, 0, 648, 864);

    gpctx.fillStyle = "rgb(99, 99, 99)";
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

    gpctx.fillStyle = "rgb(180, 0, 0)";
    for (const i of Bullets.bullets) {
        circle(gpctx, i.x, i.y, i.size);
    }
    gpctx.fillStyle = "rgb(255, 0, 0)";
    for (const i of Enemy.enemies) { // i am very good at naming variables
        circle(gpctx, i.x, i.y, i.size);
    }
}

function drawUI() {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, 1200, 900);

    ctx.fillStyle = "white";
    ctx.font = "50px monospace";
    ctx.textAlign = "start"
    //ctx.fillText("bullet smell", 700, 80);

    drawText(ctx, title, 700, 40);

    ctx.font = "20px monospace";
    ctx.drawImage(spriteImages.ui.lifeDisplay, 700, 200);
    for (let i = 0; i < Player.lives; i++) {
        //circle(ctx, 708 + 30 * i, 133, 8);
        if (i % 2 === 0) {
            ctx.drawImage(spriteImages.ui.life, 700 + 8 + i * 16, 200 + 24);
        } else {
            ctx.drawImage(spriteImages.ui.life, 700 + 8 + i * 16, 200 + 46);
        }
    }

    ctx.drawImage(spriteImages.ui.bombDisplay, 700, 300);
    for (let i = 0; i < Player.bombs; i++) {
        if (i % 2 === 0) {
            ctx.drawImage(spriteImages.ui.bomb, 700 + 8 + i * 16, 300 + 24);
        } else {
            ctx.drawImage(spriteImages.ui.bomb, 700 + 8 + i * 16, 300 + 46);
        }
    }

    ctx.drawImage(spriteImages.ui.scoreDisplay, 700, 95);
    for (let i = 0; i < 9; i++) {
        drawText(ctx, `${Math.floor((Player.score / (10 ** (8 - i))) % 10)}`, 708 + 14 * i, 120);
    }

    fillPowerMeter();
    ctx.drawImage(spriteImages.ui.powerMeter, 700, 400);
    drawText(ctx, Player.power.toFixed(2), 752, 412);
}

function tick(ms) {
    const timeElapsed = ms - lastFrameTime;

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
    Level.level.tick(timeElapsed);
    draw();

    lastFrameTime = ms;
    if (Player.lives >= 0)
    requestAnimationFrame(tick);
}

function load() {
    canvas.width = 1200;
    canvas.height = 900;
    document.getElementById("game").appendChild(canvas);
    ctx.imageSmoothingEnabled = false;

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
    fontBitmap.src = "./assets/ui/font.png";
    fontBitmap.addEventListener("load", drawUI);

    Player.init();
    //addEventListener("click", fullscreen);
    addEventListener("keydown", Player.keydown);
    addEventListener("keyup", Player.keyup);
    addEventListener("game_statupdate", drawUI);

    requestAnimationFrame(tick);
}

addEventListener("load", load);