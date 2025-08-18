// script.js
const grid = document.querySelector('.grid');
const scoreDisplay = document.querySelector('.score');
const gameOverDisplay = document.querySelector('.game-over');
const restartButton = document.querySelector('.restart-button');

let board = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
];
let score = 0;

function initializeGame() {
    board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    score = 0;
    scoreDisplay.textContent = score;
    gameOverDisplay.style.display = 'none';
    addNumber();
    addNumber();
    updateGrid();
}

function addNumber() {
    const emptyCells = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 0) {
                emptyCells.push({ x: i, y: j });
            }
        }
    }
    if (emptyCells.length > 0) {
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[randomCell.x][randomCell.y] = Math.random() > 0.1 ? 2 : 4;
    }
}

function updateGrid() {
    grid.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const cell = document.createElement('div');
            cell.textContent = board[i][j] === 0 ? '' : board[i][j];
            cell.style.backgroundColor = getBackgroundColor(board[i][j]);
            grid.appendChild(cell);
        }
    }
}

function getBackgroundColor(value) {
    switch (value) {
        case 2: return '#eee4da';
        case 4: return '#ede0c8';
        case 8: return '#f2b179';
        case 16: return '#f59563';
        case 32: return '#f67c5f';
        case 64: return '#f65e3b';
        case 128: return '#edcf72';
        case 256: return '#edcc61';
        case 512: return '#edc850';
        case 1024: return '#edc53f';
        case 2048: return '#edc22e';
        default: return '#cdc1b4';
    }
}

function slide(row) {
    let arr = row.filter(val => val);
    let missing = 4 - arr.length;
    let zeros = Array(missing).fill(0);
    arr = arr.concat(zeros);
    return arr;
}

function combine(row) {
    for (let i = 3; i >= 1; i--) {
        if (row[i] === row[i - 1] && row[i] !== 0) {
            row[i] *= 2;
            score += row[i];
            row[i - 1] = 0;
        }
    }
    return row;
}

function operate(row) {
    row = slide(row);
    row = combine(row);
    row = slide(row);
    return row;
}

function moveLeft() {
    let newBoard = [];
    for (let i = 0; i < 4; i++) {
        newBoard.push(operate(board[i]));
    }
    board = newBoard;
}

function moveRight() {
    let newBoard = [];
    for (let i = 0; i < 4; i++) {
        newBoard.push(operate(board[i].reverse()).reverse());
    }
    board = newBoard;
}

function moveUp() {
    let newBoard = [[], [], [], []];
    for (let i = 0; i < 4; i++) {
        let column = [board[0][i], board[1][i], board[2][i], board[3][i]];
        column = operate(column);
        for (let j = 0; j < 4; j++) {
            newBoard[j][i] = column[j];
        }
    }
    board = newBoard;
}

function moveDown() {
    let newBoard = [[], [], [], []];
    for (let i = 0; i < 4; i++) {
        let column = [board[0][i], board[1][i], board[2][i], board[3][i]];
        column = operate(column.reverse()).reverse();
        for (let j = 0; j < 4; j++) {
            newBoard[j][i] = column[j];
        }
    }
    board = newBoard;
}

function checkGameOver() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 0) {
                return false;
            }
            if (i < 3 && board[i][j] === board[i + 1][j]) {
                return false;
            }
            if (j < 3 && board[i][j] === board[i][j + 1]) {
                return false;
            }
        }
    }
    return true;
}

function handleKeyPress(event) {
    const key = event.key;
    let moved = false;
    if (key === 'ArrowLeft') {
        moveLeft();
        moved = true;
    } else if (key === 'ArrowRight') {
        moveRight();
        moved = true;
    } else if (key === 'ArrowUp') {
        moveUp();
        moved = true;
    } else if (key === 'ArrowDown') {
        moveDown();
        moved = true;
    }
    if (moved) {
        addNumber();
        updateGrid();
        scoreDisplay.textContent = score;
        if (checkGameOver()) {
            gameOverDisplay.style.display = 'block';
        }
    }
}

restartButton.addEventListener('click', initializeGame);
document.addEventListener('keydown', handleKeyPress);

initializeGame();