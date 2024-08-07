import * as Player from "./modules/player.mjs";
import * as Global from "./modules/global.mjs";
import * as Bullets from "./modules/bullets.mjs";
import * as Pattern from "./modules/pattern.mjs";
import * as Enemy from "./modules/enemy.mjs";
import * as Level from "./modules/level.mjs";
import * as Pickup from "./modules/pickup.mjs";
import * as Menu from "./modules/menu.mjs";
import sprites from "./sprites.json" assert { type: "json" }
import font from "./assets/ui/font.json" assert { type: "json" }
import bullet from "./assets/enemy/bullets.json" assert { type: "json" }

// extremely rushed music stuff
const bgm = new Audio("./assets/sounds/placeholder_bgm.ogg");

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

function keydown(e) {
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        initEventListeners();
        lastFrameTime = document.timeline.currentTime;
        requestAnimationFrame(tick);
        removeEventListener("keydown", keydown);
    }
}

function retryKeyDown(e) {
    if (e.key.toLowerCase() === "r" && Global.gameOver) {
        Global.setGameState(false);
        Player.init();
        Level.init();
        Enemy.enemies.clear();
        Bullets.bullets.clear();
        Bullets.playerBullets.clear();
        Pickup.pickups.clear();

        lastFrameTime = document.timeline.currentTime;
        requestAnimationFrame(tick);
    }
}

function loadMenu(name) {
    let lastMenuFrameTime = document.timeline.currentTime;
    function render(ms) {
        draw();
        const elapsed = ms - lastMenuFrameTime;
        gpctx.globalAlpha = elapsed / (1000 * Menu[name].transition);
        gpctx.fillStyle = Menu[name].bgCol;
        gpctx.fillRect(0, 0, Global.BOARD_WIDTH, Global.BOARD_HEIGHT);
        console.log(elapsed);
    
        Object.keys(Menu[name].content).forEach((v) => {
            if (v === "bgCol") return;
            drawText(gpctx, ...Menu[name].content[v].label);
        });
        if (Menu[name].transition !== 0 && elapsed / (1000 * Menu[name].transition) < 1) {
            requestAnimationFrame(render);
        } else {
            gpctx.globalAlpha = 1;
        }
    }
    requestAnimationFrame(render);
}

function circle(context, x, y, r) {
    if (r < 0) return;
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.fill();
    context.closePath();
}

function drawText(context, text, sx, sy, scale) {
    for (let i = 0; i < text.length; i++)
        context.drawImage(fontSheet, font[text[i]][0], font[text[i]][1], 7, 17, sx + i * 7 * scale, sy, 7 * scale, 17 * scale);
}
function drawBullet(b) {
    let sprData = bullet[b.type][b.variety];
    if (!sprData) sprData = bullet["basic"][2];

    gpctx.setTransform(1, 0, 0, 1, b.x, b.y);
    gpctx.rotate(Math.atan(b.velX / b.velY));
    gpctx.drawImage(bulletSheet, ...sprData, Math.floor(-sprData[2] / 2), Math.floor(-sprData[3] / 2), sprData[2], sprData[3]);
    gpctx.rotate(-Math.atan(b.velX / b.velY));
    gpctx.setTransform(1, 0, 0, 1, 0, 0);
}

// actually implement this??
function drawEnemy(e) {
    gpctx.setTransform(1, 0, 0, 1, e.x, e.y);
    gpctx.rotate(Math.atan(e.velX / e.velY));
    gpctx.drawImage(spriteImages.enemy[e.type], -spriteImages.enemy[e.type].width / 2, -spriteImages.enemy[e.type].height / 2);
    gpctx.rotate(-Math.atan(e.velX / e.velY));
    gpctx.setTransform(1, 0, 0, 1, 0, 0);
}

function fillPowerMeter(scale) {
    ctx.fillStyle = "rgb(192, 151, 74)";
    ctx.fillRect(700 + 3 * scale, 560 + 10 * scale, Math.floor(Player.power / 4 * (spriteImages.ui.powerMeter.width * scale - 4 * scale) / scale) * scale, 4 * scale);
}

function draw() {
    gpctx.drawImage(spriteImages.ui.gameBg, 0, bgScroll - Global.BOARD_HEIGHT);
    gpctx.drawImage(spriteImages.ui.gameBg, 0, bgScroll);
    gpctx.drawImage(spriteImages.ui.vignette, 0, 0);

    gpctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    circle(gpctx, Player.x, Player.y, Player.bombRadius);

    for (const i of Bullets.playerBullets)
        gpctx.drawImage(spriteImages.player.bullet, Math.floor(i.x - spriteImages.player.bullet.width / 2), Math.floor(i.y - spriteImages.player.bullet.height / 2));

    if (Player.blinkState === 1) gpctx.globalAlpha = 0.2;
    gpctx.drawImage(spriteImages.player.body, Math.floor(Player.x - spriteImages.player.body.width / 2), Math.floor(Player.y - 23));
    gpctx.drawImage(spriteImages.player[`wings${Player.wingState}`], Math.floor(Player.x - spriteImages.player[`wings${Player.wingState}`].width / 2), Math.floor(Player.y - 10));
    gpctx.globalAlpha = 1;

    for (const i of Pickup.pickups)
        gpctx.drawImage(spriteImages.pickup[i.type], Math.floor(i.x - i.size / 2), Math.floor(i.y - i.size / 2));

    for (const i of Bullets.bullets)
        drawBullet(i);

    for (const i of Enemy.enemies) { // i am very good at naming variables
        gpctx.drawImage(spriteImages.enemy[i.type], Math.floor(i.x - spriteImages.enemy[i.type].width / 2), Math.floor(i.y - spriteImages.enemy[i.type].height / 2));
        if (spriteImages.enemy.hasOwnProperty(`${i.type}Wings${i.wingState}`))
            gpctx.drawImage(spriteImages.enemy[`${i.type}Wings${i.wingState}`], Math.floor(i.x - spriteImages.enemy[`${i.type}Wings${i.wingState}`].width / 2), Math.floor(i.y - spriteImages.enemy[`${i.type}Wings${i.wingState}`].height / 2));
    }
}

function drawUI() {
    const sf = 3; // was originally scaleFactor but everything became unreadably long so it got shortened
    ctx.drawImage(spriteImages.ui.bg, 0, 0);

    drawText(ctx, title, 700, 40, sf);

    ctx.drawImage(spriteImages.ui.scoreDisplay, 700, 100, spriteImages.ui.scoreDisplay.width * sf, spriteImages.ui.scoreDisplay.height * sf);
    for (let i = 0; i < 9; i++)
        drawText(ctx, `${Math.floor((Player.score / (10 ** (8 - i))) % 10)}`, 700 + 4 * sf + 7 * sf * i, 100 + 13 * sf, sf);
    
    ctx.drawImage(spriteImages.ui.lifeDisplay, 700, 240, spriteImages.ui.lifeDisplay.width * sf, spriteImages.ui.lifeDisplay.height * sf);
    for (let i = 0; i < Player.lives; i++) {
        if (i % 2 === 0)
            ctx.drawImage(spriteImages.ui.life, 700 + 4 * sf + i * 8 * sf, 240 + 12 * sf, spriteImages.ui.life.width * sf, spriteImages.ui.life.height * sf);
        else
            ctx.drawImage(spriteImages.ui.life, 700 + 4 * sf + i * 8 * sf, 240 + 23 * sf, spriteImages.ui.life.width * sf, spriteImages.ui.life.height * sf);
    }

    ctx.drawImage(spriteImages.ui.bombDisplay, 700, 400, spriteImages.ui.bombDisplay.width * sf, spriteImages.ui.bombDisplay.height * sf);
    for (let i = 0; i < Player.bombs; i++) {
        if (i % 2 === 0) {
            ctx.drawImage(spriteImages.ui.bomb, 700 + 4 * sf + i * 8 * sf, 400 + 12 * sf, spriteImages.ui.bomb.width * sf, spriteImages.ui.bomb.height * sf);
        } else {
            ctx.drawImage(spriteImages.ui.bomb, 700 + 4 * sf + i * 8 * sf, 400 + 23 * sf, spriteImages.ui.bomb.width * sf, spriteImages.ui.bomb.height * sf);
        }
    }

    fillPowerMeter(sf);
    ctx.drawImage(spriteImages.ui.powerMeter, 700, 560, spriteImages.ui.powerMeter.width * sf, spriteImages.ui.powerMeter.height * sf);
    drawText(ctx, Player.power.toFixed(2), 700 + 26 * sf, 560 + 6 * sf, sf);

    drawText(ctx, `${fps.toFixed(2)} fps`, 700, 870 - 10 * sf, sf);
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
        Level.tick(timeElapsed);
        draw();
    }

    lastFrameTime = ms;
    if (Player.lives < 0) Global.setGameState(true);
    if (Global.gameOver) {
        loadMenu("death");
        addEventListener("keydown", retryKeyDown);
    } else if (Global.gameWon) {
        loadMenu("win");
    } else {
        requestAnimationFrame(tick);
    }
}

function initEventListeners() {
    addEventListener("keydown", Player.keydown);
    addEventListener("keyup", Player.keyup);
    addEventListener("game_statupdate", drawUI);
    addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !Global.gameOver) {
            if (!Global.paused) loadMenu("pause");
            Global.setPaused(true);
            bgm.pause();
        } else if (e.key.toLowerCase() === "z") {
            Global.setPaused(false);
            //bgm.play();
        }
    });
    // func could use better name (also draws UI and starts music)
    drawUI();
    //bgm.play();
    //bgm.volume = 0.1;
    bgm.loop = true;
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
    gpctx.imageSmoothingEnabled = false;

    Object.keys(sprites).forEach((v) => {
        spriteImages[v] = {};
        Object.keys(sprites[v]).forEach((val) => {
            spriteImages[v][val] = new Image();
            spriteImages[v][val].src = `./assets/${v}/${sprites[v][val]}`;
        });
    });
    fontSheet.src = "./assets/ui/font.png";
    fontSheet.addEventListener("load", () => { loadMenu("startMenu"); });

    bulletSheet.src = "./assets/enemy/bullets.png";

    Player.init();
    Level.init();
    //addEventListener("click", fullscreen);

    console.log(`${performance.measure("loadtime").duration.toFixed(1)}ms load time`);
    //requestAnimationFrame(tick);
    addEventListener("keydown", keydown);
}

addEventListener("load", load);