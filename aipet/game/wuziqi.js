/**
 * 五子棋模块
 */
const GomokuModule = {
    size: 20,
    board: [],
    level: 'easy',
    isThinking: false, // 新增：标记是否正在思考或处理中

    init(level) {
        this.level = level;
        this.isThinking = false; // 初始化
        this.board = Array(this.size * this.size).fill(0);
        this.render();
    },

    render() {
        const body = document.getElementById("gameBody");
        const cellSize = 20;
        const pieceSize = cellSize * 0.75;
        const boardSize = this.size * cellSize;

        // 强制 body 样式，确保内容居中且不会被遮挡
        body.style.display = "flex";
        body.style.flexDirection = "column";
        body.style.alignItems = "center";
        body.style.justifyContent = "center";
        body.style.padding = "20px";
        body.style.overflow = "auto";

        body.innerHTML = `
    <div style="
        padding: 10px; 
        background: #5d4037; 
        border-radius: 8px; 
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        display: inline-block;
        line-height: 0; /* 消除行高带来的间隙 */
        ">
        <div id="board" style="
            display: grid; 
            grid-template-columns: repeat(${this.size}, ${cellSize}px); 
            grid-template-rows: repeat(${this.size}, ${cellSize}px); 
            width: ${boardSize}px; 
            height: ${boardSize}px; 
            background: #dcb35c; 
            border: 1px solid #333; /* 细边框作为内线边界 */
            user-select: none;
            cursor: pointer;
        ">
            ${this.board
                .map(
                    (cell, i) => `
                <div onclick="GomokuModule.handleClick(${i})" style="
                    border: 0.5px solid rgba(0,0,0,0.15); 
                    width: ${cellSize}px; 
                    height: ${cellSize}px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    position: relative;
                    box-sizing: border-box; /* 极其重要，防止边框撑开格子 */
                ">
                    ${cell !== 0
                            ? `
                        <div class="piece ${cell === 1 ? "black" : "white"}" style="
                            width: ${pieceSize}px; 
                            height: ${pieceSize}px;
                            border-radius: 50%;
                            box-shadow: 1px 1px 3px rgba(0,0,0,0.4);
                            z-index: 2;
                        "></div>
                    `
                            : ""
                        }
                </div>
            `,
                )
                .join("")}
        </div>
    </div>

    <div style="margin-top: 20px;">
        <span style="background:rgba(255,255,255,0.1); color: #fff; padding:6px 18px; border-radius:20px; font-size:14px;">
            难度：${this.level === "easy" ? "简单" : this.level === "medium" ? "中等" : "困难"}
        </span>
    </div>
    `;
    },

    handleClick(idx) {
        // --- 核心判断：如果是 AI 回合、AI 正在思考、或游戏已结束，禁止落子 ---
        if (this.isThinking || GameEngine.isGameOver || this.board[idx] !== 0) {
            return;
        }

        // 玩家落子 (1 代表红子/玩家)
        this.board[idx] = 1;
        this.render();

        if (this.checkWin(1)) {
            setTimeout(() => GameEngine.end("你赢了！"), 100);
            return;
        }

        // 轮到 Dada 下棋
        this.dadaMove();
    },

    getBestMoveByHeuristic() {
        if (GameEngine.isGameOver) return;
        let bestScore = -1;
        let move = -1;

        const emptyIndices = this.board
            .map((v, i) => (v === 0 ? i : null))
            .filter((v) => v !== null);
        if (emptyIndices.length === 0) return GameEngine.end("平局啦！");

        for (let i of emptyIndices) {
            let score = Math.random() * 2;
            if (this.level !== "easy") {
                score += this.evaluatePosition(i, 2) * 2; // 攻击分
                score +=
                    this.evaluatePosition(i, 1) * (this.level === "hard" ? 1.5 : 1); // 防御分
            }
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }

        this.board[move] = 2;
        this.render();
        if (this.checkWin(2)) return GameEngine.end("哼哼，Dada 赢了！");
    },

    // wuziqi.js

    async dadaMove() {
        if (GameEngine.isGameOver) return;

        this.isThinking = true; // --- 锁定：进入 AI 回合 ---
        let bestIdx = -1;

        // 困难难度逻辑
        if (this.level === 'hard') {
            this.showThinkingTip(true); // 显示思考提示
            try {
                const boardText = this.generateBoardText();
                const move = await DeepSeekService.askGomokuMove(boardText, this.size);

                if (move && typeof move.x === 'number' && typeof move.y === 'number') {
                    console.log("DeepSeek 返回的坐标：", move);
                    const targetIdx = move.y * this.size + move.x;
                    // 校验坐标合法性
                    if (this.board[targetIdx] === 0) {
                        bestIdx = targetIdx;
                    }
                }
            } catch (e) {
                console.error("API 故障1", e);
            }
            this.showThinkingTip(false);
        }

        // 兜底逻辑（简单/中等或 API 失败时）
        if (bestIdx === -1) {
            console.log("API 故障2");
            bestIdx = this.getBestMoveByHeuristic(); // 提取出的原评分逻辑
        }

        // 执行 AI 落子
        if (bestIdx !== -1 && this.board[bestIdx] === 0) {
            this.board[bestIdx] = -1;
            this.render();
            if (this.checkWin(-1)) {
                setTimeout(() => GameEngine.end("Dada 赢了！"), 100);
            }
        }

        this.isThinking = false; // --- 解锁：回到玩家回合 ---
    },

    // 3. 新增辅助方法：将棋盘转换为坐标文本
    generateBoardText() {
        let text = "  "; // 起始留空，对齐列号

        // 1. 生成顶部列标 (0 1 2 3...)
        for (let x = 0; x < this.size; x++) {
            text += (x < 10 ? " " + x : x) + " ";
        }
        text += "\n";

        // 2. 生成每一行，带行标
        for (let y = 0; y < this.size; y++) {
            // 行号占位对齐 (如果是个位数补空格)
            text += (y < 10 ? " " + y : y) + " ";

            for (let x = 0; x < this.size; x++) {
                const p = this.board[y * this.size + x];
                if (p === 0) {
                    text += " . ";  // 使用空格增加间距，避免 Token 压缩
                } else if (p === 1) {
                    text += " X ";  // 玩家
                } else {
                    text += " O ";  // Dada (AI)
                }
            }
            text += "\n";
        }

        text += "\n当前玩家: O (Dada)\n";
        text += "目标: 找到最佳空位(.)落子，连成五子或阻止玩家(X)连线。";
        return text;
    },

    // 辅助：显示“思考中”UI，增强反馈
    showThinkingTip(show) {
        let tip = document.getElementById('ai-thinking-hint');
        if (show) {
            if (!tip) {
                tip = document.createElement('div');
                tip.id = 'ai-thinking-hint';
                tip.innerHTML = '<span class="loading-dot">Dada 正在思考中...</span>';
                tip.style = "position:absolute; top:10px; background:rgba(0,0,0,0.6); padding:5px 15px; border-radius:20px; color:var(--accent); font-size:12px; z-index:100;";
                document.getElementById('board').parentElement.appendChild(tip);
            }
        } else if (tip) {
            tip.remove();
        }
    },

    evaluatePosition(idx, p) {
        let totalScore = 0;
        const x = idx % this.size;
        const y = Math.floor(idx / this.size);
        const dirs = [
            [1, 0],
            [0, 1],
            [1, 1],
            [1, -1],
        ];

        for (let [dx, dy] of dirs) {
            let count = 0;
            for (let step of [1, -1]) {
                for (let i = 1; i < 5; i++) {
                    const nx = x + dx * step * i;
                    const ny = y + dy * step * i;
                    if (
                        nx >= 0 &&
                        nx < this.size &&
                        ny >= 0 &&
                        ny < this.size &&
                        this.board[ny * this.size + nx] === p
                    ) {
                        count++;
                    } else break;
                }
            }
            if (count >= 4) totalScore += 1000;
            else if (count === 3) totalScore += 100;
            else if (count === 2) totalScore += 10;
        }
        return totalScore;
    },

    checkWin(p) {
        const s = this.size;
        for (let i = 0; i < s * s; i++) {
            if (this.board[i] !== p) continue;
            const x = i % s,
                y = Math.floor(i / s);
            const dirs = [
                [1, 0],
                [0, 1],
                [1, 1],
                [1, -1],
            ];
            for (let [dx, dy] of dirs) {
                let count = 1;
                for (let step = 1; step < 5; step++) {
                    const nx = x + dx * step,
                        ny = y + dy * step;
                    if (
                        nx >= 0 &&
                        nx < s &&
                        ny >= 0 &&
                        ny < s &&
                        this.board[ny * s + nx] === p
                    )
                        count++;
                    else break;
                }
                if (count >= 5) return true;
            }
        }
        return false;
    },
};
