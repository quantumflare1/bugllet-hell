import * as Global from "./global.mjs";

const startMenu = {
    bgCol: "rgb(0, 0, 0)",
    transition: 0,
    content: {
        // todo: maybe stick these all in an array named "labels" or something
        fireTutorial: { // these can actually be named literally anything
            "label": ["Z to fire", 40, 60, 2]
        },
        bombTutorial: {
            "label": ["X to bomb", 40, 100, 2]
        },
        moveTutorial: {
            "label": ["Arrow keys to move", 40, 140, 2]
        },
        focusTutorial: {
            "label": ["Shift to focus", 40, 180, 2]
        },
        pauseTutorial: {
            "label": ["Esc to pause", 40, 220, 2]
        },
        startTutorial: {
            "label": ["Any key* to start", 40, 260, 2]
        },
        explanation1: {
            "label": ["\"you gotta explain this better man i didn\'t even know you could use space to jump", 40, 800, 1]
        },
        explanation1_2: {
            "label": ["until like my 3rd run\"", 40, 820, 1]
        },
        explanation2: {
            "label": ["- TheMobile, Feb 28 2024 (this screen is for you)", 40, 840, 1]
        },
        startCaveat: {
            "label": ["*any key that isn't Shift, Alt, Ctrl or Win/Cmd", 40, 300, 1]
        },
    }
};

const death = {
    bgCol: "rgb(0, 0, 0)",
    transition: 1,
    content: {
        gameOver: {
            "label": ["Game Over", Math.floor(Global.BOARD_WIDTH / 2 - 7 * 4.5 * 3), Global.BOARD_HEIGHT / 2, 3]
        },
        retryPrompt: {
            "label": ["Press R to retry", Global.BOARD_WIDTH / 2 - 7 * 8 * 2, Global.BOARD_HEIGHT / 2 + 70, 2]
        }
    }
};

const win = {
    bgCol: "rgb(255, 220, 0)",
    transition: 2,
    content: {
        gameOver: {
            "label": ["You win!!!", Global.BOARD_WIDTH / 2 - 7 * 5 * 3, Global.BOARD_HEIGHT / 2 - 130, 3]
        },
        credits1: {
            "label": ["Game by QuantumFlare", Global.BOARD_WIDTH / 2 - 7 * 10 * 2, Global.BOARD_HEIGHT / 2 - 60, 2]
        },
        credits2: {
            "label": ["All artwork, design and programming", Global.BOARD_WIDTH / 2 - 7 * 17.5 * 2, Global.BOARD_HEIGHT / 2 - 20, 2]
        },
        credits3: {
            "label": ["by QuantumFlare", Global.BOARD_WIDTH / 2 - 7 * 7.5 * 2, Global.BOARD_HEIGHT / 2 + 20, 2]
        },
        credits4: {
            "label": ["Music by ZUN", Global.BOARD_WIDTH / 2 - 7 * 6 * 2, Global.BOARD_HEIGHT / 2 + 60, 2]
        },
        credits5: {
            "label": ["(from Touhou 15: Legacy of Lunatic Kingdom)", Global.BOARD_WIDTH / 2 - 7 * 21.5 * 2, Global.BOARD_HEIGHT / 2 + 80, 1]
        },
        credits5: {
            "label": ["Thank you for playing!", Global.BOARD_WIDTH / 2 - 7 * 11 * 2, Global.BOARD_HEIGHT / 2 + 120, 2]
        }
    }
}

const pause = {
    bgCol: "rgba(0, 0, 0, 0.8)",
    transition: 0,
    content: {
        bigTitle: {
            "label": ["Paused", Global.BOARD_WIDTH / 2 - 7 * 3 * 3, Global.BOARD_HEIGHT / 2, 3]
        },
        resumePrompt: {
            "label": ["Press Z to unpause", Global.BOARD_WIDTH / 2 - 7 * 9 * 2, Global.BOARD_HEIGHT / 2 + 70, 2]
        }
    }
}

export { startMenu, death, pause, win };