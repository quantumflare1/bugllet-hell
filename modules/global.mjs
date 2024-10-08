const BOARD_WIDTH = 648;
const BOARD_HEIGHT = 864;

// use as start pos
const START_WAVE = 0;
const START_POWER = 0;

const game = {
    NONE: 0,
    PLAY: 1,
    PAUSED: 2,
    WON: 3,
    LOST: 4
}
let gameState = game.NONE;
let prevGameState;

/**
 * @param {number} state 
 */
function setGameState(state) {
    const gameStateChange = new Event("game_statechange");
    prevGameState = gameState;
    gameState = state;
    dispatchEvent(gameStateChange);
}

export { BOARD_HEIGHT, BOARD_WIDTH, START_WAVE, START_POWER, game, prevGameState, gameState, setGameState };