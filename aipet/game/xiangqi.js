/**
 * 中国象棋模块 - 基础 AI 版
 */
const XiangqiModule = {
    board: [],
    selected: null, // 当前选中的棋子索引
    turn: 'player', // player (红方), dada (黑方)
    lastMove: null, // 新增：记录 { from, to }

    // 棋子枚举：正数为红方，负数为黑方
    // 1: 帅/将, 2: 仕, 3: 相/象, 4: 马, 5: 车, 6: 炮, 7: 兵/卒
    initialBoard: [
        -5, -4, -3, -2, -1, -2, -3, -4, -5,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, -6, 0, 0, 0, 0, 0, -6, 0,
        -7, 0, -7, 0, -7, 0, -7, 0, -7,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        // --- 楚河汉界 ---
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        7, 0, 7, 0, 7, 0, 7, 0, 7,
        0, 6, 0, 0, 0, 0, 0, 6, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        5, 4, 3, 2, 1, 2, 3, 4, 5
    ],

    pieceMap: {
        '1': { text: '帅', color: 'red' }, '-1': { text: '将', color: 'black' },
        '2': { text: '仕', color: 'red' }, '-2': { text: '士', color: 'black' },
        '3': { text: '相', color: 'red' }, '-3': { text: '象', color: 'black' },
        '4': { text: '马', color: 'red' }, '-4': { text: '马', color: 'black' },
        '5': { text: '车', color: 'red' }, '-5': { text: '车', color: 'black' },
        '6': { text: '炮', color: 'red' }, '-6': { text: '炮', color: 'black' },
        '7': { text: '兵', color: 'red' }, '-7': { text: '卒', color: 'black' }
    },

    init() {
        this.board = [...this.initialBoard];
        this.selected = null;
        this.lastMove = null; // 重置
        this.turn = 'player';
        this.render();
    },

    render() {
        const body = document.getElementById('gameBody');
        const step = 42; // 每个交叉点的间距
        const boardW = step * 8; // 8个间距 = 9条线
        const boardH = step * 9; // 9个间距 = 10条线

        body.style.display = "flex";
        body.style.flexDirection = "column";
        body.style.alignItems = "center";

        // 状态判定
        const isPlayerUnderCheck = this.isAttacked(this.findKing(1), -1);
        const isDadaUnderCheck = this.isAttacked(this.findKing(-1), 1);

        let boardHtml = `
        <div id="chess-wrapper" style="
            position: relative; 
            padding: 30px; 
            background: #dcb35c; 
            border: 3px solid #5d4037; 
            border-radius: 4px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6);
            user-select: none;
        ">
            <div id="board-grid" style="
                width: ${boardW}px; 
                height: ${boardH}px; 
                border: 1px solid #5d4037;
                position: relative;
                background-image: 
                    linear-gradient(#5d4037 1px, transparent 1px),
                    linear-gradient(90deg, #5d4037 1px, transparent 1px);
                background-size: ${step}px ${step}px;
            ">
                ${this.drawPalaceLines(step)}

                ${this.drawCornerMarks(step)}

                <div style="
                    position: absolute; top: ${step * 4}px; left: 0; 
                    width: 100%; height: ${step}px; 
                    background: #dcb35c; 
                    display: flex; justify-content: space-around; align-items: center;
                    font-size: 20px; font-weight: bold; color: #5d4037;
                    border-top: 1px solid #5d4037; border-bottom: 1px solid #5d4037;
                ">
                    <span style="transform:rotate(90deg)">楚河</span>
                    <span style="transform:rotate(-90deg)">汉界</span>
                </div>
            </div>

            <div id="piece-layer" style="
                position: absolute; 
                top: ${30 - step / 2}px; left: ${30 - step / 2}px; 
                width: ${boardW + step}px; 
                height: ${boardH + step}px;
                display: grid;
                grid-template-columns: repeat(9, ${step}px);
                grid-template-rows: repeat(10, ${step}px);
                z-index: 10;
            ">
                ${this.board.map((piece, i) => this.renderPiece(piece, i, isPlayerUnderCheck, isDadaUnderCheck)).join('')}
            </div>
        </div>
        <div style="margin-top:20px; color:#fff; font-size:14px; background:rgba(0,0,0,0.5); padding:8px 20px; border-radius:20px;">
            ${isPlayerUnderCheck ? '<b style="color:#ff4444; animation:blink 0.6s infinite;">⚠️ 正在被将军！</b>' : (this.turn === 'player' ? '请走棋...' : 'Dada 思考中...')}
        </div>
    `;

        body.innerHTML = boardHtml + `
        <style>
            @keyframes king-flash { from { background:#fdfcf8; } to { background:#ff5252; transform:scale(1.1); } }
            @keyframes blink { opacity: 1; to { opacity: 0.3; } }
        </style>

        <style>
            .ds-loader {
                width: 24px; height: 24px;
                border: 3px solid rgba(0, 230, 118, 0.3);
                border-top: 3px solid #00e676;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    },

    // 棋子渲染逻辑
    renderPiece(piece, i, checkP, checkD) {
        const pInfo = this.pieceMap[piece];
        const isSelected = this.selected === i;
        const isKing = Math.abs(piece) === 1;
        const isCheck = isKing && ((piece > 0 && checkP) || (piece < 0 && checkD));

        let highlightHtml = '';
        if (this.lastMove) {
            if (this.lastMove.from === i) {
                // 起点：淡淡的虚线圆圈
                highlightHtml = `<div style="position:absolute; width:36px; height:36px; border:2px dashed rgba(255,255,255,0.4); border-radius:50%; pointer-events:none;"></div>`;
            } else if (this.lastMove.to === i) {
                // 终点：强力高光（外发光 + 四角定位框）
                highlightHtml = `
                <div style="position:absolute; width:40px; height:40px; background:rgba(255,235,59,0.35); border-radius:50%; box-shadow:0 0 20px 5px #ffeb3b; pointer-events:none; z-index:1;"></div>
                <div class="move-target-box" style="position:absolute; width:42px; height:42px; pointer-events:none; z-index:2;">
                    <i style="position:absolute;top:0;left:0;width:8px;height:8px;border-top:3px solid #ffeb3b;border-left:3px solid #ffeb3b;"></i>
                    <i style="position:absolute;top:0;right:0;width:8px;height:8px;border-top:3px solid #ffeb3b;border-right:3px solid #ffeb3b;"></i>
                    <i style="position:absolute;bottom:0;left:0;width:8px;height:8px;border-bottom:3px solid #ffeb3b;border-left:3px solid #ffeb3b;"></i>
                    <i style="position:absolute;bottom:0;right:0;width:8px;height:8px;border-bottom:3px solid #ffeb3b;border-right:3px solid #ffeb3b;"></i>
                </div>
            `;
            }
        }

        return `
        <div onclick="XiangqiModule.handleClick(${i})" style="
            width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative;
        ">
            ${highlightHtml}

            ${piece !== 0 ? `
                <div class="chess-piece" style="
                    width: 38px; height: 38px; border-radius: 50%;
                    background: #fdfcf8; border: 2px solid ${pInfo.color === 'red' ? '#d32f2f' : '#212121'};
                    color: ${pInfo.color === 'red' ? '#d32f2f' : '#212121'};
                    display: flex; align-items: center; justify-content: center;
                    font-weight: bold; font-size: 19px; font-family: 'STKaiti', 'KaiTi';
                    box-shadow: 0 4px 8px rgba(0,0,0,0.5);
                    cursor: pointer; z-index: 5; transition: transform 0.2s;
                    ${isSelected ? 'border-color:#00e676; transform:scale(1.18) translateY(-3px); box-shadow:0 10px 20px rgba(0,0,0,0.4);' : ''}
                    ${isCheck ? 'animation: king-flash 0.4s infinite alternate;' : ''}
                ">
                    ${pInfo.text}
                </div>
            ` : ''}
        </div>
    `;
    },

    // 绘制九宫格米字线
    drawPalaceLines(step) {
        const stroke = "#5d4037";
        // 计算斜线的长度：2x2方格的对角线长度 = sqrt( (2*step)^2 + (2*step)^2 )
        const diagonalPath = Math.sqrt(Math.pow(step * 2, 2) * 2);
        const lineStyle = `position:absolute; width:${diagonalPath}px; height:1px; background:${stroke}; z-index:1;`;

        return `
        <div style="${lineStyle} top:0px; left:${step * 3}px; transform: rotate(45deg); transform-origin: 0 0;"></div>
        <div style="${lineStyle} top:0px; left:${step * 5}px; transform: rotate(135deg); transform-origin: 0 0;"></div>
        
        <div style="${lineStyle} top:${step * 7}px; left:${step * 3}px; transform: rotate(45deg); transform-origin: 0 0;"></div>
        <div style="${lineStyle} top:${step * 7}px; left:${step * 5}px; transform: rotate(135deg); transform-origin: 0 0;"></div>
    `;
    },
    drawCornerMarks(step) {
        const points = [
            // 黑方
            { r: 2, c: 1 }, { r: 2, c: 7 }, // 炮位
            { r: 3, c: 0 }, { r: 3, c: 2 }, { r: 3, c: 4 }, { r: 3, c: 6 }, { r: 3, c: 8 }, // 卒位
            // 红方
            { r: 7, c: 1 }, { r: 7, c: 7 }, // 炮位
            { r: 6, c: 0 }, { r: 6, c: 2 }, { r: 6, c: 4 }, { r: 6, c: 6 }, { r: 6, c: 8 }  // 兵位
        ];

        let html = "";
        const lineColor = "#5d4037"; // 这里的颜色要和背景线条一致
        const space = 2;  // 标记与线条之间的微小间隙
        const size = 7;   // L型线的边长

        points.forEach(p => {
            const top = p.r * step;
            const left = p.c * step;

            html += `<div style="position:absolute; top:${top}px; left:${left}px; pointer-events:none;">`;

            // --- 右上角 (Top-Right) ---
            // 逻辑：位于中心点右上方，向左和向下画线
            if (p.c < 8) html += `
            <i style="position:absolute; top:-${space + size}px; left:${space}px; width:${size}px; height:${size}px; border-bottom:1px solid ${lineColor}; border-left:1px solid ${lineColor};"></i>`;

            // --- 左上角 (Top-Left) ---
            // 逻辑：位于中心点左上方，向右和向下画线
            if (p.c > 0) html += `
            <i style="position:absolute; top:-${space + size}px; left:-${space + size}px; width:${size}px; height:${size}px; border-bottom:1px solid ${lineColor}; border-right:1px solid ${lineColor};"></i>`;

            // --- 右下角 (Bottom-Right) ---
            // 逻辑：位于中心点右下方，向左和向上画线
            if (p.c < 8) html += `
            <i style="position:absolute; top:${space}px; left:${space}px; width:${size}px; height:${size}px; border-top:1px solid ${lineColor}; border-left:1px solid ${lineColor};"></i>`;

            // --- 左下角 (Bottom-Left) ---
            // 逻辑：位于中心点左下方，向右和向上画线
            if (p.c > 0) html += `
            <i style="position:absolute; top:${space}px; left:-${space + size}px; width:${size}px; height:${size}px; border-top:1px solid ${lineColor}; border-right:1px solid ${lineColor};"></i>`;

            html += `</div>`;
        });

        return html;
    },

    findKing(color) {
        for (let i = 0; i < 90; i++) {
            if (this.board[i] === (color === 1 ? 1 : -1)) return i;
        }
        return -1;
    },

    handleClick(i) {
        if (this.turn !== 'player' || GameEngine.isGameOver) return;

        const piece = this.board[i];

        // 选中自己的棋子
        if (piece > 0) {
            this.selected = i;
            this.render();
            return;
        }

        // 移动棋子（如果已选中）
        if (this.selected !== null) {
            if (this.canMove(this.selected, i)) {
                this.makeMove(this.selected, i);
                if (!GameEngine.isGameOver) {
                    this.turn = 'dada';
                    this.render();
                    setTimeout(() => this.dadaMove(), 800);
                }
            } else {
                this.selected = null;
                this.render();
            }
        }
    },

    /**
    * 真正的合法性检查：物理合法 + 走完后自己不被将军
    */
    canMove(from, to) {
        const piece = this.board[from];
        const color = piece > 0 ? 1 : -1;

        // 1. 首先必须符合棋子本身的物理行走规则
        if (!this.canMovePhysical(from, to)) return false;

        // 2. 模拟移动
        const backupTarget = this.board[to];
        const backupFrom = this.board[from];

        this.board[to] = backupFrom; // 假装挪过去
        this.board[from] = 0;

        // 找到我方“帅/将”的位置
        let kingPos = -1;
        for (let i = 0; i < 90; i++) {
            if (this.board[i] === (color === 1 ? 1 : -1)) {
                kingPos = i;
                break;
            }
        }

        // 检查走完之后，我的王是否安全
        const isSafe = !this.isAttacked(kingPos, -color);

        // 3. 还原棋盘
        this.board[from] = backupFrom;
        this.board[to] = backupTarget;

        return isSafe;
    },

    // 辅助函数：计算直线路径上的障碍子数量（不含起点终点）
    countObstacles(from, to) {
        const fx = from % 9, fy = Math.floor(from / 9);
        const tx = to % 9, ty = Math.floor(to / 9);
        let count = 0;
        if (fx === tx) { // 纵向
            const min = Math.min(fy, ty), max = Math.max(fy, ty);
            for (let y = min + 1; y < max; y++) {
                if (this.board[y * 9 + fx] !== 0) count++;
            }
        } else { // 横向
            const min = Math.min(fx, tx), max = Math.max(fx, tx);
            for (let x = min + 1; x < max; x++) {
                if (this.board[fy * 9 + x] !== 0) count++;
            }
        }
        return count;
    },

    /**
    * 检查 position 这个位置是否正被 color 方攻击
    * @param {number} position - 检查的格子索引
    * @param {number} attackerColor - 攻击者颜色 (1为红，-1为黑)
     */
    isAttacked(position, attackerColor) {
        // 物理规则检查：是否有任何棋子能攻击到该位置
        for (let i = 0; i < 90; i++) {
            const piece = this.board[i];
            if (piece * attackerColor > 0) {
                if (this.canMovePhysical(i, position)) return true;
            }
        }

        // 王不见王检查
        let redKing = -1, blackKing = -1;
        for (let i = 0; i < 90; i++) {
            if (this.board[i] === 1) redKing = i;
            if (this.board[i] === -1) blackKing = i;
        }

        if (redKing % 9 === blackKing % 9) { // 同一列
            // 计算两王之间的障碍物
            let count = 0;
            const min = Math.min(redKing, blackKing);
            const max = Math.max(redKing, blackKing);
            for (let j = min + 9; j < max; j += 9) {
                if (this.board[j] !== 0) count++;
            }

            if (count === 0) {
                // 如果中间无子，且我们正在检查其中一个王的位置
                if (position === redKing || position === blackKing) return true;
            }
        }
        return false;
    },

    // 将之前的 canMove 改名为 canMovePhysical，仅表示棋子的物理行走路径是否合法
    canMovePhysical(from, to) {
        // 这里放你之前写的 switch(type) 逻辑...
        // (包含车马炮、马腿、象眼、九宫限制等)
        const board = this.board;
        const piece = board[from];
        const target = board[to];

        // 1. 基本限制：不能原地踏步，不能吃自己的棋子
        if (from === to) return false;
        if (piece * target > 0) return false;

        const fx = from % 9, fy = Math.floor(from / 9);
        const tx = to % 9, ty = Math.floor(to / 9);
        const dx = Math.abs(tx - fx);
        const dy = Math.abs(ty - fy);
        const type = Math.abs(piece);

        switch (type) {
            case 5: // 车 (Rook): 直行，中间不能有障碍
                if (fx !== tx && fy !== ty) return false;
                if (this.countObstacles(from, to) !== 0) return false;
                return true;

            case 6: // 炮 (Cannon): 直行。不吃子时中间0个子，吃子时中间必须1个子
                if (fx !== tx && fy !== ty) return false;
                const count = this.countObstacles(from, to);
                if (target === 0) return count === 0; // 不吃子
                return count === 1; // 吃子（翻山炮）

            case 4: // 马 (Knight): 走日字，需检查“蹩马腿”
                if (!((dx === 1 && dy === 2) || (dx === 2 && dy === 1))) return false;
                // 蹩马腿：检查横向或纵向靠近起始点的那一个格
                const mx = fx + (dx === 2 ? (tx - fx) / 2 : 0);
                const my = fy + (dy === 2 ? (ty - fy) / 2 : 0);
                if (board[my * 9 + mx] !== 0) return false;
                return true;

            case 3: // 相/象 (Bishop): 走田字，不能过河，需检查“塞象眼”
                if (dx !== 2 || dy !== 2) return false;
                if (piece > 0 && ty < 5) return false; // 红相不过河
                if (piece < 0 && ty > 4) return false; // 黑象不过河
                const ex = (fx + tx) / 2;
                const ey = (fy + ty) / 2;
                if (board[ey * 9 + ex] !== 0) return false; // 塞象眼
                return true;

            case 2: // 士 (Guard): 九宫格内斜行
                if (dx !== 1 || dy !== 1) return false;
                if (tx < 3 || tx > 5) return false; // 出九宫横向
                if (piece > 0 && ty < 7) return false; // 红士九宫
                if (piece < 0 && ty > 2) return false; // 黑士九宫
                return true;

            case 1: // 帅/将 (King): 九宫格内横竖行
                if (dx + dy !== 1) return false;
                if (tx < 3 || tx > 5) return false;
                if (piece > 0 && ty < 7) return false;
                if (piece < 0 && ty > 2) return false;
                return true;

            case 7: // 兵/卒 (Pawn): 过河前只能前行，过河后可左右移动，不可后退
                if (piece > 0) { // 红兵
                    if (ty > fy) return false; // 不能后退
                    if (fy >= 5 && dx !== 0) return false; // 未过河不能横走
                } else { // 黑卒
                    if (ty < fy) return false;
                    if (fy <= 4 && dx !== 0) return false;
                }
                return dx + dy === 1;

            default: return false;
        }
    
    },

    makeMove(from, to) {
        const piece = this.board[from];
        const color = piece > 0 ? 1 : -1;
        const eaten = this.board[to];

        // 记录上一步
        this.lastMove = { from, to };

        // 执行物理坐标更新
        this.board[to] = piece;
        this.board[from] = 0;
        this.selected = null;

        // 检查对方是否还有棋可走
        const opponentColor = -color;
        const gameResult = this.checkGameState(opponentColor);

        if (gameResult) {
            // 触发 GameEngine 弹窗，显示具体的胜负信息
            GameEngine.end(gameResult);
        } else {
            // 检查对方是否正在被将军（仅做界面提示）
            let oppKingPos = -1;
            for (let i = 0; i < 90; i++) {
                if (this.board[i] === (opponentColor === 1 ? 1 : -1)) {
                    oppKingPos = i;
                    break;
                }
            }

            if (this.isAttacked(oppKingPos, color)) {
                const oppName = opponentColor === 1 ? "红方" : "黑方";
                this.showStatusTip(`${oppName} 被将军！`);
            }
        }
    },

    // 辅助方法：在棋盘上方显示文字提示
    showStatusTip(msg) {
        const body = document.getElementById('gameBody');
        // 先清理旧提示
        const oldTip = document.getElementById('ai-thinking-tip');
        if (oldTip) oldTip.remove();

        const tip = document.createElement('div');
        tip.id = "ai-thinking-tip";

        // 判断是否为 DS AI
        const isDeepSeek = GameEngine.level === 'hard';

        // 设置样式
        tip.style = `
        position: absolute; top: 50%; left: 50%; 
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.85);
        color: white; padding: 15px 25px;
        border-radius: 10px; z-index: 1000;
        display: flex; flex-direction: column;
        align-items: center; gap: 10px;
        border: 1px solid ${isDeepSeek ? '#00e676' : '#ffeb3b'};
        box-shadow: 0 0 20px rgba(0,0,0,0.5);
    `;

        // 动态 HTML 内容
        tip.innerHTML = `
        ${isDeepSeek ? '<div class="ds-loader"></div>' : ''}
        <div style="font-weight: bold; font-size: 14px;">
            ${isDeepSeek ? '<span style="color:#00e676">DeepSeek AI</span> ' : ''}${msg}
        </div>
    `;

        body.appendChild(tip);

        // 如果不是 DS（即本地 AI 很快就走完的），设置自动消失
        if (!isDeepSeek) {
            setTimeout(() => tip.remove(), 1000);
        }
    },

    async dadaMove() {
        if (this.isGameOver) return;

        // 1. 根据难度选择 AI 逻辑
        if (GameEngine.level !== 'hard') {
            // 简单/中等难度：直接执行本地逻辑
            this.runLocalAI();
            this.turn = 'player';
            this.render();
            return;
        }

        // 2. 困难难度：显示 DeepSeek 专属提示并调用 API
        this.showStatusTip("正在通过 DeepSeek 云端大脑规划棋局...");

        try {
            // const boardDesc = this.generateBoardText();
            const dsResponse = await DeepSeekService.askXiangQiMove(this.board, GameEngine.level);
            console.log("Dada 的分析:", dsResponse);

            if (dsResponse) {
                const match = dsResponse.match(/from[:\s]*(\d+).*to[:\s]*(\d+)/i);
                if (match) {
                    const from = parseInt(match[1]);
                    const to = parseInt(match[2]);

                    if (this.canMove(from, to)) {
                        console.log(`AI 选择移动: ${from} -> ${to}`);

                        this.makeMove(from, to);
                    } else {
                        console.warn("AI 尝试了非法移动:", dsResponse);
                        this.runLocalAI(); // 保底
                    }
                } else {
                    this.runLocalAI();
                }
            }
        } catch (e) {
            console.error("DeepSeek 接口调用失败:", e);
            this.runLocalAI();
        }

        // 移除提示并更新 UI
        const tip = document.getElementById('ai-thinking-tip');
        if (tip) tip.remove();

        this.turn = 'player';
        this.render();
    },

    runLocalAI() {
        // 找出所有合法的步法
        let moves = [];
        for (let i = 0; i < 90; i++) {
            if (this.board[i] < 0) { // 黑方
                for (let j = 0; j < 90; j++) {
                    if (this.canMove(i, j)) {
                        // 简单的评分：吃子得分越高
                        let score = Math.abs(this.board[j]) * 10 + Math.random();
                        moves.push({ from: i, to: j, score });
                    }
                }
            }
        }

        if (moves.length > 0) {
            // 根据难度决定是否选最高分
            if (GameEngine.level === 'medium') {
                moves.sort((a, b) => b.score - a.score);
            } else {
                // 简单模式下随机打乱，增加失误
                moves.sort(() => Math.random() - 0.5);
            }
            const move = moves[0];
            this.makeMove(move.from, move.to);
        }
    },
    /**
    * 判定当前棋局状态
    * @param {number} color - 当前该走棋的一方 (1: 红, -1: 黑)
    * @returns {string|null} - 返回胜负描述字符串或 null
    */
    checkGameState(color) {
        let hasLegalMove = false;
        const attackerColor = -color;
        const victimName = color === 1 ? "红方" : "黑方";
        const winnerName = color === 1 ? "黑方 (Dada)" : "红方 (你)";

        // 1. 遍历所有属于当前方的棋子
        for (let from = 0; from < 90; from++) {
            if (this.board[from] * color > 0) {
                // 2. 尝试该棋子所有可能的目的地
                for (let to = 0; to < 90; to++) {
                    // canMove 内部已经包含了“移动后不能被将军”的模拟逻辑
                    if (this.canMove(from, to)) {
                        hasLegalMove = true;
                        break;
                    }
                }
            }
            if (hasLegalMove) break;
        }

        // 3. 如果没有任何合法移动
        if (!hasLegalMove) {
            // 寻找当前方王的位置
            let kingPos = -1;
            const kingType = color === 1 ? 1 : -1;
            for (let i = 0; i < 90; i++) {
                if (this.board[i] === kingType) {
                    kingPos = i;
                    break;
                }
            }

            // 判定是绝杀还是困毙
            const isCurrentlyAttacked = this.isAttacked(kingPos, attackerColor);
            if (isCurrentlyAttacked) {
                return `【绝杀】${winnerName} 将死了 ${victimName}！`;
            } else {
                return `【困毙】${victimName} 无路可走，${winnerName} 获胜！`;
            }
        }
        return null;
    },
    // xiangqi.js 内部方法
    generateBoardText() {
        let rows = [];
        for (let y = 0; y < 10; y++) { // 遍历 10 行
            let row = [];
            for (let x = 0; x < 9; x++) { // 遍历 9 列
                const p = this.board[y * 9 + x];
                if (p === 0) row.push("．"); // 空位
                else row.push(this.pieceMap[p].text + (p > 0 ? "(红)" : "(黑)")); // 棋子及颜色
            }
            rows.push(row.join(" "));
        }
        return rows.join("\n"); // 组合成完整的棋盘文本
    }
};