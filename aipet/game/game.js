/**
 * Dada Game Engine - 核心调度器
 */
const GameEngine = {
    current: null,
    level: 'easy',
    isGameOver: false,

    init() {
        const gameBtn = document.getElementById('gameBtn');
        const closeBtn = document.getElementById('closeGameBtn');

        if (gameBtn) {
            gameBtn.onclick = (e) => {
                e.preventDefault();
                this.showMenu();
            };
        }

        if (closeBtn) closeBtn.onclick = () => this.close();
    },

    showMenu() {
        const modal = document.getElementById('gameModal');
        const body = document.getElementById('gameBody');
        modal.style.display = 'flex';
        body.innerHTML = `
            <div class="game-menu">
                <p>想玩什么？跟 Dada 切磋一下吧</p>
                <button class="game-opt" onclick="GameEngine.selectLevel('gomoku')">五子棋 ⚪⚫</button>
                <button class="game-opt" onclick="GameEngine.selectLevel('chess')">中国象棋 🐎</button>
            </div>
        `;
    },

    selectLevel(game) {
        this.current = game;
        const body = document.getElementById('gameBody');
        body.innerHTML = `
            <h3>选择 Dada 的智商</h3>
            <button class="game-opt" onclick="GameEngine.start('easy')">简单 (呆呆的)</button>
            <button class="game-opt" onclick="GameEngine.start('medium')">中等 (聪明的)</button>
            <button class="game-opt" onclick="GameEngine.start('hard')">困难 (天才哒哒)</button>
        `;
    },

    start(level) {
        this.level = level;
        this.isGameOver = false;

        const modalContent = document.querySelector('.game-content');

        // 调用不同模块的初始化方法
        if (this.current === 'gomoku') {
            if (modalContent) modalContent.style.width = "480px";
            GomokuModule.init(level);
        } else {
            if (modalContent) modalContent.style.width = "520px"; // 象棋需要更宽的空间
            XiangqiModule.init();
        }
    },

    end(msg) {
        this.isGameOver = true;
        const overlay = document.createElement('div');
        overlay.id = "gameResultOverlay";
        overlay.style = "position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:100;";
        overlay.innerHTML = `
            <h2 style="color:var(--accent)">${msg}</h2>
            <button class="game-opt" style="width:150px" onclick="GameEngine.start('${this.level}')">再来一局</button>
            <button class="game-opt" style="width:150px; background:#444" onclick="GameEngine.close()">结束游戏</button>
        `;
        document.getElementById('gameBody').appendChild(overlay);

        // 宠物反馈
        if (typeof pet !== 'undefined') {
            pet.happy = Math.min(100, pet.happy + 15);
            if (typeof save === 'function') save();
            if (typeof render === 'function') render();
        }
    },

    close() {
        document.getElementById('gameModal').style.display = 'none';
        const res = document.getElementById('gameResultOverlay');
        if (res) res.remove();
    }
};

window.addEventListener('load', () => GameEngine.init());