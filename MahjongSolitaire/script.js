const cells = document.querySelectorAll('.cell');
const pairs = [
    'A', 'A',
    'B', 'B',
    'C', 'C',
    'D', 'D',
    // 其他配对省略
];
shuffle(pairs);

const grid = Array(4).fill(false).map(() => Array(4).fill(false));

cells.forEach((cell, index) => {
    cell.style.backgroundColor = getRandomColor();
    cell.dataset.pair = pairs[index];
});

let firstCell = null;
let secondCell = null;

cells.forEach(cell => {
    cell.addEventListener('click', () => {
        if (cell.style.display === 'none') return;
        if (firstCell === null) {
            firstCell = cell;
            firstCell.style.backgroundColor = 'yellow';
        } else if (secondCell === null && cell !== firstCell) {
            secondCell = cell;
            secondCell.style.backgroundColor = 'yellow';
            const startIndex = parseInt(firstCell.dataset.index);
            const endIndex = parseInt(secondCell.dataset.index);
            if (pairs[startIndex] === pairs[endIndex]) {
                if (canConnect(startIndex, endIndex, grid)) {
                    setTimeout(() => {
                        firstCell.style.display = 'none';
                        secondCell.style.display = 'none';
                        const startRow = Math.floor(startIndex / 4);
                        const startCol = startIndex % 4;
                        const endRow = Math.floor(endIndex / 4);
                        const endCol = endIndex % 4;
                        grid[startRow][startCol] = true;
                        grid[endRow][endCol] = true;
                        drawConnection(startIndex, endIndex);
                        firstCell = null;
                        secondCell = null;
                        checkGameOver();
                    }, 500);
                } else {
                    setTimeout(() => {
                        firstCell.style.backgroundColor = getRandomColor();
                        secondCell.style.backgroundColor = getRandomColor();
                        firstCell = null;
                        secondCell = null;
                    }, 500);
                }
            } else {
                setTimeout(() => {
                    firstCell.style.backgroundColor = getRandomColor();
                    secondCell.style.backgroundColor = getRandomColor();
                    firstCell = null;
                    secondCell = null;
                }, 500);
            }
        }
    });
});

function canConnect(startIndex, endIndex, grid) {
    const startRow = Math.floor(startIndex / 4);
    const startCol = startIndex % 4;
    const endRow = Math.floor(endIndex / 4);
    const endCol = endIndex % 4;

    if (startRow === endRow) {
        for (let col = Math.min(startCol, endCol) + 1; col < Math.max(startCol, endCol); col++) {
            if (grid[startRow][col]) return false;
        }
        return true;
    } else if (startCol === endCol) {
        for (let row = Math.min(startRow, endRow) + 1; row < Math.max(startRow, endRow); row++) {
            if (grid[row][startCol]) return false;
        }
        return true;
    } else {
        return canConnectWithOneTurn(startIndex, endIndex, grid);
    }
}

function canConnectWithOneTurn(startIndex, endIndex, grid) {
    // 尝试四个可能的拐点
    // 代码省略
}

function drawConnection(startIndex, endIndex) {
    const canvas = document.getElementById('连线画布');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 画线逻辑省略
}

function getCellCenter(index) {
    const row = Math.floor(index / 4);
    const col = index % 4;
    const x = col * 100 + 50;
    const y = row * 100 + 50;
    return { x, y };
}

function shuffle(array) {
    let m = array.length, t, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
}

function getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

function checkGameOver() {
    const visibleCells = Array.from(cells).filter(cell => cell.style.display !== 'none');
    if (visibleCells.length === 0) {
        alert('恭喜你，通关了！');
    }
}