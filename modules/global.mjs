const BOARD_WIDTH = 648;
const BOARD_HEIGHT = 864;
let paused = false;

function setPaused(state) {
    paused = state;
}

export { BOARD_HEIGHT, BOARD_WIDTH, paused, setPaused };