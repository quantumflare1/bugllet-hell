const BOARD_WIDTH = 648;
const BOARD_HEIGHT = 864;
let paused = false;
let gameOver = false;
let gameWon = false;

function setPaused(state) {
    paused = state;
}
function setGameState(state) {
    gameOver = state;
}
function setWinState(state) {
    gameWon = state;
}

export { BOARD_HEIGHT, BOARD_WIDTH, paused, gameOver, gameWon, setPaused, setGameState, setWinState };