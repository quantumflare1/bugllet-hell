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
let nextTick;
const bgScrollRate = 50;

const spriteImages = {};
const fontSheet = new Image();
const bulletSheet = new Image();

// temp
const title = "1-1: Instigation";

function fullscreen() {
    document.body.requestFullscreen({ navigationUI: "hide" });
}

// note to self: incredible bug happening where despawning guys do not start the next wave

function checkGameState(e) {
    switch (Global.gameState) {
        case Global.game.PLAY:
            switch (Global.prevGameState) {
                case Global.game.NONE:
                    initGame();
                    lastFrameTime = document.timeline.currentTime;
                    nextTick = requestAnimationFrame(tick);
                    break;
                case Global.game.LOST:
                    Player.reset();
                    Level.init();
                    Enemy.enemies.clear();
                    Bullets.bullets.clear();
                    Bullets.playerBullets.clear();
                    Pickup.pickups.clear();
                    lastFrameTime = document.timeline.currentTime;
                    nextTick = requestAnimationFrame(tick);
                    break;
                case Global.game.PAUSED:
                    function pause(e) {
                        if (e.key === "Escape") {
                            Global.setGameState(Global.game.PAUSED);
                            removeEventListener("keydown", pause);
                        }
                    }
                    addEventListener("keydown", pause);
                    //bgm.play();
                    break;
            }
            break;
        case Global.game.PAUSED:
            loadMenu("pause");
            bgm.pause();
            break;
        case Global.game.LOST:
            break;
        case Global.game.WON:
            loadMenu("win");
            break;
    }
}

function loadMenu(name) {
    let lastMenuFrameTime = document.timeline.currentTime;
    function render(ms) {
        draw();
        const elapsed = ms - lastMenuFrameTime;
        const transitionPercentComplete = elapsed / (1000 * Menu[name].transition);
        gpctx.globalAlpha = transitionPercentComplete;
        gpctx.fillStyle = Menu[name].bgCol;
        gpctx.fillRect(0, 0, Global.BOARD_WIDTH, Global.BOARD_HEIGHT);

        for (const i of Menu[name].labels) drawText(gpctx, ...i);

        if (Menu[name].transition !== 0 && transitionPercentComplete < 1) requestAnimationFrame(render);
        else gpctx.globalAlpha = 1;
    }
    Menu[name].onload();
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
    try {
        let sprData = bullet[b.sprite][b.variety];
        if (!sprData) sprData = bullet["basic"][2];
        const rotation = (Math.atan(b.velY / b.velX) + Math.PI / 2) + (b.velX > 0 ? Math.PI : 0);
    
        gpctx.setTransform(1, 0, 0, 1, b.x, b.y);
        gpctx.rotate(rotation);
        gpctx.drawImage(bulletSheet, ...sprData, Math.floor(-sprData[2] / 2), Math.floor(-sprData[3] / 2), sprData[2], sprData[3]);
        gpctx.rotate(-rotation);
        gpctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    catch (e) {
        console.log(bullet[b.sprite], b.variety);
        throw e;
    }
}

function drawEnemy(e) {
    const wingId = `${e.type}Wings${e.wingState}`;
    const enemySprite = spriteImages.enemy[e.type];
    const wingSprite = spriteImages.enemy[wingId];
    if (e.useRotation) {
        gpctx.setTransform(1, 0, 0, 1, e.x, e.y);
        gpctx.rotate(e.rotation);

        gpctx.drawImage(enemySprite, -enemySprite.width / 2, -enemySprite.height / 2);
        if (spriteImages.enemy.hasOwnProperty(wingId))
            gpctx.drawImage(wingSprite, Math.floor(-wingSprite.width / 2), Math.floor(-wingSprite.height / 2));

        gpctx.rotate(-e.rotation);
        gpctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    else {
        gpctx.drawImage(enemySprite, e.x - enemySprite.width / 2, e.y - enemySprite.height / 2);
        if (spriteImages.enemy.hasOwnProperty(wingId))
            gpctx.drawImage(wingSprite, Math.floor(e.x - wingSprite.width / 2), Math.floor(e.y - wingSprite.height / 2));
    }

}

function fillPowerMeter(scale) {
    ctx.fillStyle = "rgb(233, 102, 76)";
    ctx.fillRect(700 + 3 * scale, 560 + 10 * scale, Math.floor(Player.power / 4 * (spriteImages.ui.powerMeter.width * scale - 4 * scale) / scale) * scale, 4 * scale);
}

function draw() {
    gpctx.drawImage(spriteImages.ui.gameBg, 0, bgScroll - Global.BOARD_HEIGHT);
    gpctx.drawImage(spriteImages.ui.gameBg, 0, bgScroll);
    gpctx.drawImage(spriteImages.ui.vignette, 0, 0);

    const bombBlastOpacity = Player.bombRadius < 0 ? 1 : -Player.bombRadius / 1050 + 1;
    console.log(`rgba(255, 255, 255, ${0.5 * bombBlastOpacity})`)
    gpctx.fillStyle = `rgba(255, 255, 255, ${0.5 * bombBlastOpacity})`;
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

    for (const i of Enemy.enemies)
        drawEnemy(i);
}

function drawUI() {
    const sf = 3; // was originally scaleFactor but everything became unreadably long so it got shortened
    ctx.drawImage(spriteImages.ui.bg, 0, 0);

    drawText(ctx, title, 700, 40, sf);

    const scoreDisplay = spriteImages.ui.scoreDisplay;
    ctx.drawImage(scoreDisplay, 700, 100, scoreDisplay.width * sf, scoreDisplay.height * sf);
    for (let i = 0; i < 9; i++)
        drawText(ctx, `${Math.floor((Player.score / (10 ** (8 - i))) % 10)}`, 700 + 4 * sf + 7 * sf * i, 100 + 13 * sf, sf);
    
    const lifeDisplay = spriteImages.ui.lifeDisplay;
    const life = spriteImages.ui.life;
    ctx.drawImage(lifeDisplay, 700, 240, lifeDisplay.width * sf, lifeDisplay.height * sf);
    for (let i = 0; i < Player.lives; i++) {
        if (i % 2 === 0) ctx.drawImage(life, 700 + 4 * sf + i * 8 * sf, 240 + 12 * sf, life.width * sf, life.height * sf);
        else ctx.drawImage(life, 700 + 4 * sf + i * 8 * sf, 240 + 23 * sf, life.width * sf, life.height * sf);
    }

    const bombDisplay = spriteImages.ui.bombDisplay;
    const bomb = spriteImages.ui.bomb;
    ctx.drawImage(bombDisplay, 700, 400, bombDisplay.width * sf, bombDisplay.height * sf);
    for (let i = 0; i < Player.bombs; i++) {
        if (i % 2 === 0) ctx.drawImage(bomb, 700 + 4 * sf + i * 8 * sf, 400 + 12 * sf, bomb.width * sf, bomb.height * sf);
        else ctx.drawImage(bomb, 700 + 4 * sf + i * 8 * sf, 400 + 23 * sf, bomb.width * sf, bomb.height * sf);
    }

    const powerMeter = spriteImages.ui.powerMeter;
    fillPowerMeter(sf);
    ctx.drawImage(powerMeter, 700, 560, powerMeter.width * sf, powerMeter.height * sf);
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

    if (Global.gameState === Global.game.PLAY) {
        bgScroll += bgScrollRate * timeElapsed / 1000;
        if (bgScroll >= Global.BOARD_HEIGHT) bgScroll = 0;

        Player.tick(timeElapsed);
        Level.tick(timeElapsed);
        for (const i of Bullets.playerBullets)
            i.tick(timeElapsed);
        for (const i of Bullets.bullets)
            i.tick(timeElapsed);
        for (const i of Enemy.enemies)
            i.tick(timeElapsed);
        for (const i of Pattern.patterns)
            i.tick(timeElapsed);
        for (const i of Pickup.pickups)
            i.tick(timeElapsed);

        draw();
    }

    lastFrameTime = ms;
    if (Player.lives < 0) loadMenu("death");
    if (Global.gameState !== Global.game.LOST && Global.gameState !== Global.game.WON) nextTick = requestAnimationFrame(tick);
}

function initGame() {
    addEventListener("game_statupdate", drawUI);
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

    addEventListener("game_statechange", checkGameState);
    console.log(`${performance.measure("loadtime").duration.toFixed(1)}ms load time`);
}

addEventListener("load", load);