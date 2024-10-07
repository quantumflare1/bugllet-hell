import * as Player from "./modules/player.mjs";
import * as Global from "./modules/global.mjs";
import * as Bullets from "./modules/bullets.mjs";
import * as Pattern from "./modules/pattern.mjs";
import * as Enemy from "./modules/enemy.mjs";
import * as Level from "./modules/level.mjs";
import * as Pickup from "./modules/pickup.mjs";
import * as Menu from "./modules/menu.mjs";
import assets from "./sprites.json" with { type: "json" }
import font from "./assets/ui/font.json" with { type: "json" }
import bullet from "./assets/enemy/bullets.json" with { type: "json" }

// extremely lazy music stuff
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

let spriteImages = {};
const fontSheet = new Image();
const bulletSheet = new Image();

function fullscreen() {
    document.body.requestFullscreen({ navigationUI: "hide" });
}

// note to self: incredible bug happening where despawning guys do not start the next wave

/**
 * @param {Event} e 
 */
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

/**
 * @param {string} name 
 */
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
        gpctx.globalAlpha = 1;
    }
    Menu[name].onload();
    requestAnimationFrame(render);
}

/**
 * @param {CanvasRenderingContext2D} context 
 * @param {number} x 
 * @param {number} y 
 * @param {number} r 
 * @returns void
 */
function circle(context, x, y, r) {
    if (r < 0) return;
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.fill();
    context.closePath();
}

/**
 * @param {CanvasRenderingContext2D} context 
 * @param {string} text 
 * @param {number} sx 
 * @param {number} sy 
 * @param {number} scale 
 */
function drawText(context, text, sx, sy, scale) {
    for (let i = 0; i < text.length; i++)
        context.drawImage(fontSheet, font[text[i]][0], font[text[i]][1], 7, 17, sx + i * 7 * scale, sy, 7 * scale, 17 * scale);
}

/**
 * @param {Bullets.Bullet} b 
 */
function drawBullet(b) {
    try {
        let sprData = bullet[b.sprite][b.animFrame][b.variety];
        if (!sprData) sprData = bullet["basic"][0][2];
        const rotation = (Math.atan(b.velY / b.velX) + Math.PI / 2) + (b.velX > 0 ? Math.PI : 0);
    
        gpctx.setTransform(1, 0, 0, 1, b.x, b.y);
        gpctx.rotate(rotation);
        gpctx.drawImage(bulletSheet, ...sprData, Math.floor(-sprData[2] / 2), Math.floor(-sprData[3] / 2), sprData[2], sprData[3]);
        gpctx.rotate(-rotation);
        gpctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    catch (e) {
        console.log(bullet[b.sprite], b.animFrame, b.variety);
        throw e;
    }
}

/**
 * @param {Enemy.Enemy} e 
 */
function drawEnemy(e) {
    const enemySprite = spriteImages.enemy[e.type][e.animFrame];

    gpctx.setTransform(1, 0, 0, 1, e.x, e.y);
    gpctx.rotate(e.rotation);
    gpctx.drawImage(enemySprite, -enemySprite.width / 2, -enemySprite.height / 2);

    gpctx.rotate(-e.rotation);
    gpctx.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * @param {number} scale 
 */
function fillPowerMeter(scale) {
    ctx.fillStyle = "rgb(233, 102, 76)";
    ctx.fillRect(700 + 3 * scale, 560 + 10 * scale, Math.floor(Player.power / 4 * (spriteImages.ui.powerMeter.width * scale - 4 * scale) / scale) * scale, 4 * scale);
}

function draw() {
    //performance.mark("drawbegan");
    gpctx.drawImage(spriteImages.ui.gameBg, 0, bgScroll - Global.BOARD_HEIGHT);
    gpctx.drawImage(spriteImages.ui.gameBg, 0, bgScroll);
    gpctx.drawImage(spriteImages.ui.vignette, 0, 0);

    const bombBlastOpacity = Player.bombRadius < 0 ? 1 : -Player.bombRadius / 1050 + 1;
    gpctx.fillStyle = `rgba(255, 255, 255, ${0.5 * bombBlastOpacity})`;
    circle(gpctx, Player.x, Player.y, Player.bombRadius);

    for (const i of Bullets.playerBullets)
        gpctx.drawImage(spriteImages.player.bullet, Math.floor(i.x - spriteImages.player.bullet.width / 2), Math.floor(i.y - i.size));

    if (Player.blinkState === 1) gpctx.globalAlpha = 0.2;
    if (Player.movingLeft && !Player.movingRight) {
        gpctx.drawImage(spriteImages.player.left[Player.animFrame], Math.floor(Player.x - spriteImages.player.left[Player.animFrame].width / 2), Math.floor(Player.y - 23));
    }
    else if (Player.movingRight && !Player.movingLeft) {
        gpctx.drawImage(spriteImages.player.right[Player.animFrame], Math.floor(Player.x - spriteImages.player.right[Player.animFrame].width / 2), Math.floor(Player.y - 23));
    } else {
        gpctx.drawImage(spriteImages.player.default[Player.animFrame], Math.floor(Player.x - spriteImages.player.default[Player.animFrame].width / 2), Math.floor(Player.y - 23));
    }
    gpctx.globalAlpha = 1;

    for (const i of Pickup.pickups)
        gpctx.drawImage(spriteImages.pickup[i.type], Math.floor(i.x - i.size / 2), Math.floor(i.y - i.size / 2));

    for (const i of Bullets.bullets)
        drawBullet(i);

    for (const i of Enemy.enemies)
        drawEnemy(i);

    //console.log(`draw took ${performance.measure("drawlength", "drawbegan").duration.toFixed(1)}ms`);
    // sep 4 2024 (0.1.0a v18): 0.5-12.7ms per draw on personal machine during normal gameplay (battery saving mode used)
}

function drawUI() {
    const sf = 3; // was originally scaleFactor but everything became unreadably long so it got shortened
    const offset = 18 + Global.BOARD_WIDTH;
    ctx.drawImage(spriteImages.ui.bg, offset, 0, canvas.width - offset, canvas.height, offset, 0, canvas.width - offset, canvas.height);

    drawText(ctx, Level.name, 700, 40, sf);

    const scd = spriteImages.ui.scoreDisplay;
    ctx.drawImage(scd, 700, 100, scd.width * sf, scd.height * sf);
    for (let i = 0; i < 9; i++)
        drawText(ctx, `${Math.floor((Player.score / (10 ** (8 - i))) % 10)}`, 700 + 4 * sf + 7 * sf * i, 100 + 13 * sf, sf);
    
    const lfd = spriteImages.ui.lifeDisplay;
    const lf = spriteImages.ui.life;
    ctx.drawImage(lfd, 700, 240, lfd.width * sf, lfd.height * sf);
    for (let i = 0; i < Player.lives; i++) {
        if (i % 2 === 0) ctx.drawImage(lf, 700 + 4 * sf + i * 8 * sf, 240 + 12 * sf, lf.width * sf, lf.height * sf);
        else ctx.drawImage(lf, 700 + 4 * sf + i * 8 * sf, 240 + 23 * sf, lf.width * sf, lf.height * sf);
    }

    const bmd = spriteImages.ui.bombDisplay;
    const bm = spriteImages.ui.bomb;
    ctx.drawImage(bmd, 700, 400, bmd.width * sf, bmd.height * sf);
    for (let i = 0; i < Player.bombs; i++) {
        if (i % 2 === 0) ctx.drawImage(bm, 700 + 4 * sf + i * 8 * sf, 400 + 12 * sf, bm.width * sf, bm.height * sf);
        else ctx.drawImage(bm, 700 + 4 * sf + i * 8 * sf, 400 + 23 * sf, bm.width * sf, bm.height * sf);
    }

    const pwm = spriteImages.ui.powerMeter;
    fillPowerMeter(sf);
    ctx.drawImage(pwm, 700, 560, pwm.width * sf, pwm.height * sf);
    drawText(ctx, Player.power.toFixed(2), 700 + 26 * sf, 560 + 6 * sf, sf);

    drawText(ctx, `${fps.toFixed(2)} fps`, 700, 870 - 10 * sf, sf);
}

/**
 * @param {number} ms 
 */
function tick(ms) {
    const timeElapsed = ms - lastFrameTime;
    msSinceLastFpsCheck += timeElapsed;
    framesSinceLastFpsCheck++;

    if (msSinceLastFpsCheck > 500) {
        fps = framesSinceLastFpsCheck / (msSinceLastFpsCheck / 1000);
        msSinceLastFpsCheck = 0;
        framesSinceLastFpsCheck = 0;
        dispatchEvent(new Event("game_statupdate"));
    }

    if (Global.gameState === Global.game.PLAY) {
        //performance.mark("tickbegan"); // profiling yippee!
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

        //console.log(`tick took ${performance.measure("ticklength", "tickbegan").duration.toFixed(1)}ms`);
        // sep 4 2024 (0.1.0a v18): 0.6-2.7ms per tick on personal machine during normal gameplay (battery saving mode used)
        draw();
    }

    lastFrameTime = ms;
    if (Player.lives < 0) loadMenu("death");
    if (Global.gameState !== Global.game.LOST && Global.gameState !== Global.game.WON)
        nextTick = requestAnimationFrame(tick);
}

function initGame() {
    addEventListener("game_statupdate", drawUI);
    ctx.drawImage(spriteImages.ui.bg, 0, 0);
    drawUI();
    //bgm.play();
    //bgm.volume = 0.1;
    bgm.loop = true;
}

function loadAssets() {
    /**
     * @param {object} obj 
     * @param {string[]} ids 
     */
    function loadRecursive(obj, ids) {
        for (const v in obj) {
            if (Array.isArray(obj[v])) {
                for (let i = 0; i < obj[v].length; i++) {
                    const path = `${ids.join("/")}/${obj[v][i]}`;

                    obj[v][i] = new Image();
                    obj[v][i].src = path;
                }
            } else if (typeof obj[v] === "string") {
                const path = `${ids.join("/")}/${obj[v]}`;

                obj[v] = new Image();
                obj[v].src = path;
            } else if (typeof obj[v] === "object" && obj[v] !== null) {
                loadRecursive(obj[v], [...ids, v]);
            }
        }
    }
    spriteImages = structuredClone(assets);
    loadRecursive(spriteImages, ["./assets"]);
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

    loadAssets();
    fontSheet.src = "./assets/ui/font.png";
    fontSheet.addEventListener("load", () => { loadMenu("startMenu"); });
    bulletSheet.src = "./assets/enemy/bullets.png";

    console.log(spriteImages);

    Player.init();
    Level.init();

    addEventListener("game_statechange", checkGameState);
    console.log(`${performance.measure("loadtime").duration.toFixed(1)}ms load time`);
}

addEventListener("load", load);