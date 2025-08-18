// script.js
const gridElement = document.querySelector(".grid");
const mineCountElement = document.getElementById("mine-count");
const rowsElement = document.getElementById("rows");
const colsElement = document.getElementById("cols");
const minesElement = document.getElementById("mines");
const resetButton = document.getElementById("reset");
const applySettingsButton = document.getElementById("apply-settings");

let ROWS = 10;
let COLS = 30;
let MINES = 50;

let board = [];
let mineLocations = [];
let revealedCount = 0;
let gameOver = false;
let inted = false;

// Initialize the game
function init() {
    board = Array.from({
        length: ROWS
    }, () => Array(COLS).fill(0));
    mineLocations = [];
    revealedCount = 0;
    gameOver = false;
    mineCountElement.textContent = MINES;
    rowsElement.value = ROWS;
    colsElement.value = COLS;
    minesElement.value = MINES;

    // Generate mines
    while (mineLocations.length < MINES) {
        const row = Math.floor(Math.random() * ROWS);
        const col = Math.floor(Math.random() * COLS);
        if (!mineLocations.some(([r, c]) => r === row && c === col)) {
            mineLocations.push([row, col]);
            board[row][col] = -1; // -1 represents a mine
        }
    }

    // Calculate numbers
    for (let [row, col] of mineLocations) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && board[newRow][newCol] !== -1) {
                    board[newRow][newCol]++;
                }
            }
        }
    }

    renderBoard();

    if (inted) {
        showToast("游戏已开始！", "success");
    }
    inted = true;
    updateGameState()
}

// Render the board
function renderBoard() {
    gridElement.innerHTML = "";
    gridElement.style.gridTemplateColumns = `repeat(${COLS}, 30px)`;
    gridElement.style.gridTemplateRows = `repeat(${ROWS}, 30px)`;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement("div");
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener("click", handleCellClick);
            cell.addEventListener("dblclick", handleCellDoubleClick);
            cell.addEventListener("contextmenu", handleCellRightClick);
            gridElement.appendChild(cell);
        }
    }
}

// Handle cell click
function handleCellClick(event) {
    if (gameOver) return;

    const cell = event.target;
    if (cell.classList.contains("flagged")) {
        return; // 如果格子已标记，则不允许点击
    }

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    if (board[row][col] === -1) {
        // Mine clicked
        revealMines();
        gameOver = true;
        updateGameState("error")
        
    } else {
        revealCell(row, col);
        if (revealedCount === ROWS * COLS - MINES) {
            gameOver = true;
            updateGameState("success")
        }
    }
}

// Handle cell double-click
function handleCellDoubleClick(event) {
    if (gameOver) return;

    const cell = event.target;
    if (cell.classList.contains("flagged")) {
        return; // 如果格子已标记，则不允许双击
    }

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    if (board[row][col] > 0) {
        const flaggedCount = countFlaggedNeighbors(row, col);
        if (flaggedCount === board[row][col]) {
            revealNeighbors(row, col);
        } else {
            showToast("标记的地雷数量与数字不匹配！", "error");
        }
    }
}

// Count flagged neighbors
function countFlaggedNeighbors(row, col) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const newRow = row + i;
            const newCol = col + j;
            if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
                const cell = document.querySelector(`.grid div[data-row="${newRow}"][data-col="${newCol}"]`);
                if (cell.classList.contains("flagged")) {
                    count++;
                }
            }
        }
    }
    return count;
}

// Reveal neighbors
function revealNeighbors(row, col) {
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const newRow = row + i;
            const newCol = col + j;
            if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
                const cell = document.querySelector(`.grid div[data-row="${newRow}"][data-col="${newCol}"]`);
                if (!cell.classList.contains("revealed") && !cell.classList.contains("flagged")) {
                    if (board[newRow][newCol] === -1) {
                        // Mine revealed
                        revealMines();
                        gameOver = true;
                        gameOverElement.style.display = "block";
                        return;
                    } else {
                        revealCell(newRow, newCol);
                    }
                }
            }
        }
    }
    if (revealedCount === ROWS * COLS - MINES) {
        gameOver = true;
        updateGameState("success")
    }
}

// Handle cell right-click (flag)
function handleCellRightClick(event) {
    event.preventDefault();
    if (gameOver) return;

    const cell = event.target;
    if (!cell.classList.contains("revealed")) {
        cell.classList.toggle("flagged");
        updateMineCount();
    }
}

// Reveal a cell
function revealCell(row, col) {
    const cell = document.querySelector(`.grid div[data-row="${row}"][data-col="${col}"]`);
    if (cell.classList.contains("revealed") || cell.classList.contains("flagged")) return;

    cell.classList.add("revealed");
    revealedCount++;

    if (board[row][col] > 0) {
        cell.textContent = board[row][col];
    } else if (board[row][col] === 0) {
        // Reveal adjacent cells
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
                    revealCell(newRow, newCol);
                }
            }
        }
    }
}

// Reveal all mines and check for wrong flags
function revealMines() {
    for (let [row, col] of mineLocations) {
        const cell = document.querySelector(`.grid div[data-row="${row}"][data-col="${col}"]`);
        if (!cell.classList.contains("flagged")) {
            cell.classList.add("mine");
        }
    }

    // Check for wrong flags
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.querySelector(`.grid div[data-row="${row}"][data-col="${col}"]`);
            if (cell.classList.contains("flagged") && board[row][col] !== -1) {
                cell.classList.add("flagged-wrong");
            }
        }
    }
}

// Update mine count
function updateMineCount() {
    const flaggedCount = document.querySelectorAll(".flagged").length;
    mineCountElement.textContent = MINES - flaggedCount;
}

// Apply settings
applySettingsButton.addEventListener("click", () => {
    const newRows = parseInt(document.getElementById("rows").value);
    const newCols = parseInt(document.getElementById("cols").value);
    const newMines = parseInt(document.getElementById("mines").value);

    if (newRows * newCols <= newMines) {
        showToast("地雷数量不能超过格子总数！", "error");
        return;
    }

    ROWS = newRows;
    COLS = newCols;
    MINES = newMines;
    init();
});

function showToast(message, type = 'default', duration = 1500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        ${message}
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    const toastContainer = document.getElementById('toastContainer');
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    }
}

function updateGameState(gameState = "default") {
    if (gameState === 'error') {
        resetButton.className = 'reset-error';
        resetButton.textContent = '游戏失败';
        showToast("游戏结束！", "error");
    } else if (gameState === 'success') {
        resetButton.className = 'reset-success';
        resetButton.textContent = '游戏成功';
        showToast("游戏成功", "success");
    } else {
        resetButton.className = '';
        resetButton.textContent = '重新开始';
    }
}

// Reset the game
resetButton.addEventListener("click", init);

// Start the game
init();