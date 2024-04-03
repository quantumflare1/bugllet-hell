import * as Player from "./modules/player.mjs";
import * as Global from "./modules/global.mjs";
import * as Bullets from "./modules/bullets.mjs";
import * as Pattern from "./modules/pattern.mjs";
import * as Enemy from "./modules/enemy.mjs";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

const gameplayCanvas = document.createElement("canvas");
const gpctx = gameplayCanvas.getContext("2d");

let lastFrameTime = document.timeline.currentTime;
const bullets = new Set();
const playerBullets = new Set();

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

function draw() {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, 1200, 900);

    gpctx.fillStyle = "#333";
    gpctx.fillRect(0, 0, 540, 864);

    gpctx.fillStyle = "rgb(80, 112, 128)";
    for (const i of Bullets.playerBullets) {
        circle(gpctx, i.x, i.y, i.size);
    }
    gpctx.fillStyle = "rgb(150, 240, 255)";
    circle(gpctx, Player.x, Player.y, Player.size);

    gpctx.fillStyle = "rgb(180, 0, 0)";
    for (const i of Bullets.bullets) {
        circle(gpctx, i.x, i.y, i.size);
    }
    gpctx.fillStyle = "rgb(255, 0, 0)";
    for (const i of Enemy.enemies) { // i am very good at naming variables
        circle(gpctx, i.x, i.y, i.size);
    }

    ctx.fillStyle = "white";
    ctx.font = "50px monospace";
    ctx.textAlign = "start"
    ctx.fillText("bullet smell", 600, 80);

    ctx.font = "20px monospace";
    ctx.fillText("Lives", 600, 140);
    for (let i = 0; i < Player.lives; i++) {
        circle(ctx, 708 + 30 * i, 133, 8);
    }
    if (Player.lives < 0) {
        ctx.fillText("you lose", 700, 140);
    }

    ctx.fillText("Bombs", 600, 180);
    for (let i = 0; i < Player.bombs; i++) {
        circle(ctx, 708 + 30 * i, 173, 8);
    }

    ctx.fillText("Score", 600, 220);
    ctx.fillText(Player.score, 700, 220);

    ctx.fillText("Power", 600, 260);
    ctx.fillText(Player.power.toFixed(2), 700, 260);
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
    draw();

    lastFrameTime = ms;
    if (Player.lives >= 0)
    requestAnimationFrame(tick);
}

function load() {
    canvas.width = 1200;
    canvas.height = 900;
    document.getElementById("game").appendChild(canvas);

    gameplayCanvas.width = Global.BOARD_WIDTH;
    gameplayCanvas.height = Global.BOARD_HEIGHT;
    gameplayCanvas.id = "gameplay";
    document.getElementById("game").appendChild(gameplayCanvas);

    Player.init();
    //addEventListener("click", fullscreen);
    addEventListener("keydown", Player.keydown);
    addEventListener("keyup", Player.keyup);

    Enemy.makeEnemy(100, 70, "drone");
    requestAnimationFrame(tick);
}

addEventListener("load", load);