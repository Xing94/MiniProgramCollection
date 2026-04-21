let N = 8;
let GRID_SIZE = 45;
const GAP = 3;
const COLORS = ['#E6194B', '#3CB44B', '#4363D8', '#F58231', '#911EB4', '#42D4F4', '#F032E6', '#008080', '#BFEF45', '#FABEBE', '#469990', '#E6BEFF'];

const canvas = document.getElementById('gameBoard');
const ctx = canvas.getContext('2d');
let board = [], health = 3, lastClickTime = 0, lastTarget = { r: -1, c: -1 };
let currentMode = 'normal';

// --- UI 交互逻辑 ---
document.getElementById('difficulty-select').onchange = (e) => {
    document.getElementById('custom-options').style.display = e.target.value === 'custom' ? 'block' : 'none';
};

document.getElementById('start-btn').onclick = () => {
    currentMode = document.getElementById('difficulty-select').value;
    if (currentMode === 'custom') {
        N = Math.min(12, Math.max(6, parseInt(document.getElementById('n-size').value)));
    } else if (currentMode === 'easy') {
        N = 6;
    } else {
        N = 8;
    }
    GRID_SIZE = N > 10 ? 35 : (N <= 6 ? 55 : 45);
    document.getElementById('settings-panel').style.display = 'none';
    document.getElementById('game-panel').style.display = 'block';
    document.getElementById('game-over-controls').style.display = 'none';
    initGame();
};

document.getElementById('play-again-btn').onclick = () => {
    document.getElementById('game-over-controls').style.display = 'none';
    initGame();
};

document.getElementById('back-btn').onclick = () => {
    document.getElementById('settings-panel').style.display = 'flex';
    document.getElementById('game-panel').style.display = 'none';
};

function initGame() {
    health = 3;
    document.getElementById('hearts').innerText = "❤️❤️❤️";
    document.getElementById('mode-display').innerText = document.getElementById('difficulty-select').selectedOptions[0].text;
    canvas.width = N * GRID_SIZE;
    canvas.height = N * GRID_SIZE;
    generateLogicPuzzle();
    render();
}

// --- 核心算法：逆向生成逻辑 ---

function generateLogicPuzzle() {
    // 1. N皇后变体算法：先放置羊的位置
    let sheepPositions = placeSheepIterative();
    let map = Array.from({ length: N }, () => Array(N).fill(-1));
    let colorGroups = [];

    sheepPositions.forEach((pos, i) => {
        map[pos.r][pos.c] = i;
        colorGroups[i] = [pos];
    });

    // 2. 根据模式确定锁定格数量（面积为1的色块）
    const fixedCount = (currentMode === 'easy') ? 2 : (currentMode === 'normal' ? 1 : 0);

    // 3. 图染色扩张算法
    let unassignedCount = N * N - N;
    let attempts = 0;
    const maxAttempts = N * N * 10;

    while (unassignedCount > 0 && attempts < maxAttempts) {
        attempts++;
        // 随机选择一个色块，但避开需要保持面积为1的锁定格
        let colorId = Math.floor(Math.random() * (N - fixedCount)) + fixedCount;
        let currentCells = colorGroups[colorId];
        let cell = currentCells[Math.floor(Math.random() * currentCells.length)];

        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]].sort(() => Math.random() - 0.5);
        for (let [dr, dc] of dirs) {
            let nr = cell.r + dr, nc = cell.c + dc;
            if (nr >= 0 && nr < N && nc >= 0 && nc < N && map[nr][nc] === -1) {
                // 障碍逻辑检查
                if (!wouldCreateDeadlyPattern(nr, nc, colorId, map)) {
                    map[nr][nc] = colorId;
                    colorGroups[colorId].push({ r: nr, c: nc });
                    unassignedCount--;
                    break;
                }
            }
        }
    }

    // 4. 强制满足困难模式的最小面积限制 (Hard模式下每个色块需 >= 3)
    if (currentMode === 'hard') {
        ensureMinArea(map, colorGroups, 3);
    }

    fillRemainingCells(map);
    for (let i = 0; i < 2; i++) breakSymmetry(map);
    finalizeBoard(map, sheepPositions);
}

function ensureMinArea(map, colorGroups, minSize) {
    for (let i = 0; i < N; i++) {
        let currentAttempts = 0;
        while (colorGroups[i].length < minSize && currentAttempts < 20) {
            currentAttempts++;
            for (let cell of colorGroups[i]) {
                const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                for (let [dr, dc] of dirs) {
                    let nr = cell.r + dr, nc = cell.c + dc;
                    if (nr >= 0 && nr < N && nc >= 0 && nc < N && map[nr][nc] !== i) {
                        let oldColor = map[nr][nc];
                        // 只有当被抢格子的原色块面积大于1时才允许抢夺，保证不破坏其他色块的羊
                        if (oldColor !== -1 && colorGroups[oldColor].length > 1) {
                            map[nr][nc] = i;
                            colorGroups[i].push({ r: nr, c: nc });
                            colorGroups[oldColor] = colorGroups[oldColor].filter(p => !(p.r === nr && p.c === nc));
                            break;
                        }
                    }
                }
                if (colorGroups[i].length >= minSize) break;
            }
        }
    }
}

// --- 辅助算法函数 ---

function placeSheepIterative() {
    let success = false, positions = [];
    while (!success) {
        positions = [];
        let rows = Array.from({ length: N }, (_, i) => i).sort(() => Math.random() - 0.5);
        let possible = true;
        for (let r of rows) {
            let cols = Array.from({ length: N }, (_, i) => i)
                .filter(c => !positions.some(p => p.c === c || (Math.abs(p.r - r) <= 1 && Math.abs(p.c - c) <= 1)))
                .sort(() => Math.random() - 0.5);
            if (cols.length > 0) positions.push({ r, c: cols[0] });
            else { possible = false; break; }
        }
        if (possible && positions.length === N) success = true;
    }
    return positions;
}

function wouldCreateDeadlyPattern(r, c, colorId, map) {
    const offsets = [[[0, -1], [-1, -1], [-1, 0]], [[0, 1], [-1, 1], [-1, 0]], [[0, -1], [1, -1], [1, 0]], [[0, 1], [1, 1], [1, 0]]];
    return offsets.some(offset => offset.every(([dr, dc]) => {
        let nr = r + dr, nc = c + dc;
        return nr >= 0 && nr < N && nc >= 0 && nc < N && map[nr][nc] === colorId;
    }));
}

function breakSymmetry(map) {
    for (let r = 0; r < N - 1; r++) {
        for (let c = 0; c < N - 1; c++) {
            if (map[r][c] !== -1 && map[r][c] === map[r + 1][c + 1] && map[r + 1][c] === map[r][c + 1]) {
                const colorA = map[r][c], colorB = map[r + 1][c];
                if (colorA !== colorB) {
                    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                    for (let [dr, dc] of dirs) {
                        let nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < N && nc >= 0 && nc < N && map[nr][nc] !== colorA) {
                            map[r][c] = map[nr][nc]; break;
                        }
                    }
                }
            }
        }
    }
}

function fillRemainingCells(map) {
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            if (map[r][c] === -1) {
                const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                for (let [dr, dc] of dirs) {
                    let nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < N && nc >= 0 && nc < N && map[nr][nc] !== -1) {
                        map[r][c] = map[nr][nc]; break;
                    }
                }
            }
        }
    }
}

function finalizeBoard(map, sheepPositions) {
    board = map.map((row, r) => row.map((colorId, c) => ({
        colorId,
        isSheep: false, isWrongX: false, isAssistX: false, isLocked: false,
        hasSheep: sheepPositions.some(p => p.r === r && p.c === c)
    })));
    updateScoreUI();
}

// --- 渲染与交互 (包含双击手感优化与全局锁定) ---

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const cell = board[r][c];
            const x = c * GRID_SIZE, y = r * GRID_SIZE;
            ctx.fillStyle = COLORS[cell.colorId % COLORS.length];
            drawSimpleRect(ctx, x + GAP, y + GAP, GRID_SIZE - GAP * 2, GRID_SIZE - GAP * 2, 8);
            if (cell.isSheep) {
                ctx.font = `${GRID_SIZE * 0.7}px Arial`;
                ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.fillText("🐑", x + GRID_SIZE / 2, y + GRID_SIZE / 2);
            } else if (cell.isWrongX) {
                ctx.fillStyle = "rgba(255, 0, 0, 0.4)"; ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                ctx.strokeStyle = "white"; ctx.lineWidth = 4; drawX(x, y, 10);
            } else if (cell.isAssistX) {
                ctx.strokeStyle = "white"; ctx.lineWidth = 2; drawX(x, y, 15);
            }
        }
    }
}

function drawX(x, y, p) {
    ctx.beginPath();
    ctx.moveTo(x + p, y + p); ctx.lineTo(x + GRID_SIZE - p, y + GRID_SIZE - p);
    ctx.moveTo(x + GRID_SIZE - p, y + p); ctx.lineTo(x + p, y + GRID_SIZE - p);
    ctx.stroke();
}

function drawSimpleRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath(); ctx.fill();
}

let clickTimeout = null, longPressTimer = null, isLongPressMode = false, batchMode = null;

canvas.addEventListener('mousedown', (e) => {
    if (health <= 0 || board.flat().filter(c => c.isSheep).length === N) return;
    const rect = canvas.getBoundingClientRect();
    const c = Math.floor((e.clientX - rect.left) / GRID_SIZE), r = Math.floor((e.clientY - rect.top) / GRID_SIZE);
    if (r < 0 || r >= N || c < 0 || c >= N) return;
    lastTarget = { r, c };
    longPressTimer = setTimeout(() => {
        if (!board[r][c].isLocked) {
            isLongPressMode = true;
            batchMode = board[r][c].isAssistX ? 'unmark' : 'mark';
            processBatchCell(r, c);
        }
    }, 250);
});

canvas.addEventListener('mousemove', (e) => {
    if (!isLongPressMode) return;
    const rect = canvas.getBoundingClientRect();
    const c = Math.floor((e.clientX - rect.left) / GRID_SIZE), r = Math.floor((e.clientY - rect.top) / GRID_SIZE);
    if (r >= 0 && r < N && c >= 0 && c < N) processBatchCell(r, c);
});

window.addEventListener('mouseup', () => {
    clearTimeout(longPressTimer);
    if (isLongPressMode) {
        isLongPressMode = false; batchMode = null; return;
    }
    if (lastTarget.r !== -1) {
        handleCombinedClick(lastTarget.r, lastTarget.c);
        lastTarget = { r: -1, c: -1 };
    }
});

function processBatchCell(r, c) {
    const cell = board[r][c];
    if (cell.isLocked) return;
    if (batchMode === 'mark' && !cell.isAssistX) { cell.isAssistX = true; render(); }
    else if (batchMode === 'unmark' && cell.isAssistX) { cell.isAssistX = false; render(); }
}

function handleCombinedClick(r, c) {
    const now = Date.now();
    if (now - lastClickTime < 220) {
        clearTimeout(clickTimeout);
        if (board[r][c].isAssistX) board[r][c].isAssistX = false;
        handleAction(r, c, 'double');
        lastClickTime = 0;
    } else {
        lastClickTime = now;
        clickTimeout = setTimeout(() => handleAction(r, c, 'single'), 220);
    }
}

function handleAction(r, c, type) {
    if (health <= 0 || board.flat().filter(cell => cell.isSheep).length === N) return;
    const cell = board[r][c];
    if (cell.isLocked) return;

    if (type === 'single') {
        cell.isAssistX = !cell.isAssistX;
    } else {
        if (cell.hasSheep) {
            cell.isSheep = true; cell.isLocked = true; cell.isAssistX = false;
            autoFillX(r, c);
        } else {
            cell.isWrongX = true; cell.isLocked = true; cell.isAssistX = false;
            health--;
            document.getElementById('hearts').innerText = "❤️".repeat(Math.max(0, health));
            if (health <= 0) {
                lockAllCells();
                document.getElementById('game-over-controls').style.display = 'block';
                setTimeout(() => alert("失败了！再接再厉。"), 50);
            }
        }
    }
    updateScoreUI();
    render();
}

function autoFillX(row, col) {
    const targetColor = board[row][col].colorId;
    board.flat().forEach((cell, i) => {
        const r = Math.floor(i / N), c = i % N;
        if ((r === row && c === col) || cell.isLocked) return;
        if (r === row || c === col || (Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1) || cell.colorId === targetColor) {
            cell.isAssistX = true;
        }
    });
}

function updateScoreUI() {
    const currentSheeps = board.flat().filter(c => c.isSheep).length;
    document.getElementById('sheep-count').innerText = N - currentSheeps;
    if (currentSheeps === N) {
        lockAllCells();
        render();
        document.getElementById('game-over-controls').style.display = 'block';
        setTimeout(() => alert("恭喜通关！🎉"), 200);
    }
}

function lockAllCells() {
    board.forEach(row => row.forEach(cell => cell.isLocked = true));
}