// 定义游戏区域的宽度和高度（单位：格）
const boardWidth = 10;
const boardHeight = 20;

// 定义方块的形状（每种形状有几种旋转状态）
const pieces = [
    // O方块
    [
        [[1, 1],
        [1, 1]]
    ],
    // I方块
    [
        [[1, 1, 1, 1]],
        [[1],
        [1],
        [1],
        [1]]
    ],
    // S方块
    [
        [[0, 1, 1],
        [1, 1, 0]],
        [[1, 0],
        [1, 1],
        [0, 1]]
    ],
    // Z方块
    [
        [[1, 1, 0],
        [0, 1, 1]],
        [[0, 1],
        [1, 1],
        [1, 0]]
    ],
    // J方块
    [
        [[1, 0, 0],
        [1, 1, 1]],
        [[1, 1],
        [1, 0],
        [1, 0]],
        [[1, 1, 1],
        [0, 0, 1]],
        [[0, 1],
        [0, 1],
        [1, 1]]
    ],
    // L方块
    [
        [[0, 0, 1],
        [1, 1, 1]],
        [[1, 0],
        [1, 0],
        [1, 1]],
        [[1, 1, 1],
        [1, 0, 0]],
        [[1, 1],
        [0, 1],
        [0, 1]]
    ],
    // T方块
    [
        [[1, 1, 1],
        [0, 1, 0]],
        [[1, 0],
        [1, 1],
        [1, 0]],
        [[0, 1, 0],
        [1, 1, 1]],
        [[0, 1],
        [1, 1],
        [0, 1]]
    ]
];

// 随机选择下一个方块
function getRandomPiece() {
    return pieces[Math.floor(Math.random() * pieces.length)];
}

// 游戏板初始化
let gameBoard = [];
for (let row = 0; row < boardHeight; row++) {
    gameBoard[row] = [];
    for (let col = 0; col < boardWidth; col++) {
        gameBoard[row][col] = 0;
    }
}

// 当前方块
let currentPiece = null;
let currentPiecePosition = { x: 0, y: 0 };
let currentPieceRotation = 0;

// 下一个方块
let nextPiece = null;

// 得分
let score = 0;

// 暂停状态
let isPaused = false;

// 定时器
let dropInterval = null;

// 初始化游戏
function initGame() {
    nextPiece = getRandomPiece();
    newPiece();
    document.getElementById('score').innerText = score;
    dropInterval = setInterval(dropPiece, 500);
}

// 生成新的方块
function newPiece() {
    if (currentPiece !== null) {
        // 检查游戏结束
        for (let row = 0; row < currentPiece[0].length; row++) {
            for (let col = 0; col < currentPiece[0][row].length; col++) {
                if (currentPiece[0][row][col] && gameBoard[currentPiecePosition.y + row][currentPiecePosition.x + col]) {
                    alert('游戏结束！得分：' + score);
                    clearInterval(dropInterval);
                    return;
                }
            }
        }
    }
    // 固定当前方块
    if (currentPiece !== null) {
        for (let row = 0; row < currentPiece[0].length; row++) {
            for (let col = 0; col < currentPiece[0][row].length; col++) {
                if (currentPiece[0][row][col]) {
                    gameBoard[currentPiecePosition.y + row][currentPiecePosition.x + col] = 1;
                }
            }
        }
        // 消除满行
        for (let row = boardHeight - 1; row >= 0; row--) {
            let rowFull = true;
            for (let col = 0; col < boardWidth; col++) {
                if (gameBoard[row][col] === 0) {
                    rowFull = false;
                    break;
                }
            }
            if (rowFull) {
                // 消除该行
                for (let r = row; r > 0; r--) {
                    gameBoard[r] = gameBoard[r - 1].slice();
                }
                gameBoard[0] = Array(boardWidth).fill(0);
                score += 10;
                document.getElementById('score').innerText = score;
                row--;
            }
        }
    }
    // 更新当前方块和位置
    currentPiece = nextPiece;
    nextPiece = getRandomPiece();
    currentPiecePosition = { x: Math.floor(boardWidth / 2) - Math.floor(currentPiece[0][0].length / 2), y: 0 };
    currentPieceRotation = 0;
    // 绘制下一个方块
    drawNextPiece();
}

// 方块下落
function dropPiece() {
    if (!isPaused) {
        currentPiecePosition.y++;
        if (!isValidPosition(currentPiece, currentPiecePosition, currentPieceRotation)) {
            currentPiecePosition.y--;
            newPiece();
        }
        drawGameBoard();
    }
}

// 移动方块
function movePiece(direction) {
    if (!isPaused) {
        let newX = currentPiecePosition.x;
        if (direction === 'left') {
            newX--;
        } else if (direction === 'right') {
            newX++;
        }
        if (isValidPosition(currentPiece, { x: newX, y: currentPiecePosition.y }, currentPieceRotation)) {
            currentPiecePosition.x = newX;
        }
        drawGameBoard();
    }
}

// 旋转方块
function rotatePiece() {
    if (!isPaused) {
        let newRotation = (currentPieceRotation + 1) % currentPiece.length;
        if (isValidPosition(currentPiece, currentPiecePosition, newRotation)) {
            currentPieceRotation = newRotation;
        }
        drawGameBoard();
    }
}

// 检查位置是否合法
function isValidPosition(piece, position, rotation) {
    const shape = piece[rotation];
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const boardX = position.x + col;
                const boardY = position.y + row;
                if (boardX < 0 || boardX >= boardWidth || boardY >= boardHeight || (boardY >= 0 && gameBoard[boardY][boardX])) {
                    return false;
                }
            }
        }
    }
    return true;
}

// 绘制游戏板
function drawGameBoard() {
    const gameBoardDiv = document.getElementById('game-board');
    gameBoardDiv.innerHTML = '';
    for (let row = 0; row < boardHeight; row++) {
        for (let col = 0; col < boardWidth; col++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.style.left = (col * 20) + 'px';
            square.style.top = (row * 20) + 'px';
            if (gameBoard[row][col]) {
                square.style.backgroundColor = 'blue';
            }
            gameBoardDiv.appendChild(square);
        }
    }
    // 绘制当前方块
    if (currentPiece !== null) {
        const shape = currentPiece[currentPieceRotation];
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const square = document.createElement('div');
                    square.className = 'square';
                    square.style.left = (currentPiecePosition.x + col) * 20 + 'px';
                    square.style.top = (currentPiecePosition.y + row) * 20 + 'px';
                    square.style.backgroundColor = 'red';
                    gameBoardDiv.appendChild(square);
                }
            }
        }
    }
}

// 绘制下一个方块
function drawNextPiece() {
    const nextPieceDiv = document.getElementById('next-piece');
    nextPieceDiv.innerHTML = '';
    if (nextPiece !== null) {
        const shape = nextPiece[0];
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const square = document.createElement('div');
                    square.className = 'next-square';
                    square.style.left = col * 20 + 'px';
                    square.style.top = row * 20 + 'px';
                    square.style.backgroundColor = 'green';
                    nextPieceDiv.appendChild(square);
                }
            }
        }
    }
}

// 暂停/继续游戏
document.getElementById('pause-btn').addEventListener('click', function () {
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(dropInterval);
    } else {
        dropInterval = setInterval(dropPiece, 500);
    }
});

// 键盘事件
document.addEventListener('keydown', function (event) {
    if (!isPaused) {
        if (event.key === 'ArrowLeft') {
            movePiece('left');
        } else if (event.key === 'ArrowRight') {
            movePiece('right');
        } else if (event.key === 'ArrowDown') {
            dropPiece();
        } else if (event.key === 'ArrowUp') {
            rotatePiece();
        }
    }
});

// 初始化游戏
initGame();