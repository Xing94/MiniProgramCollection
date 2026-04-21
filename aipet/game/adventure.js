const AdventureModule = {
    scenes: [
        { id: '1', name: '修仙', desc: '修仙：御剑飞行，宗门斗法' },
        { id: '2', name: '玄幻', desc: '玄幻：莫欺少年穷，异火争夺' },
        { id: '3', name: '克苏鲁', desc: '克苏鲁：SAN值狂降，古神低语' },
        { id: '4', name: '赛博朋克', desc: '赛博朋克：身体是铁，灵魂是火' },
        { id: '5', name: '未来科学', desc: '未来科学：跨越星系，降维打击' },
        { id: '6', name: '末日废土', desc: '废土：捡垃圾，喝可乐，打变异兽' },
        { id: '7', name: '大唐诡事', desc: '古风悬疑：长安幻夜，狄公断案，幻术横行' },
        { id: '8', name: '无限流', desc: '无限轮回：主神空间，生存游戏，基因锁开启' },
        { id: '9', name: '霍格沃茨', desc: '魔法校园：分院帽，骑扫帚，对决食死徒' },
        { id: '10', name: '规则怪谈', desc: '惊悚解谜：不要回头，遵守告示，影子在动' },
        { id: '11', name: '动物森友', desc: '治愈日常：抓虫子，钓鱼，给邻居送信' },
        { id: '12', name: '模拟经营', desc: '种田争霸：基建狂魔，屯粮积草，坐拥万亩良田' },
        { id: '13', name: '武侠江湖', desc: '快意恩仇：血雨腥风，独孤九剑，华山论剑' },
        { id: '14', name: '极地探险', desc: '生存极限：万年冰川，极光之下，寻找失落文明' },
        { id: '15', name: '宫廷斗争', desc: '后宫模拟：步步惊心，位份晋升，终成一宫之主' },
        { id: '16', name: '蒸汽朋克', desc: '齿轮美学：飞艇轰鸣，差分机，发条之心' },
        { id: '17', name: '灵异校园', desc: '都市传说：笔仙游戏，深夜走廊，七大不可思议' },
        { id: '18', name: '龙与地下城', desc: '奇幻跑团：骰子点数，屠龙勇士，吟游诗人' }
    ],
    durations: [
        { name: '一个月', days: '30', count: 30 },
        { name: '一年', days: '365', count: 50 },
        { name: '十年', days: '10年', count: 80 },
        { name: '百年', days: '100年', count: 100 },
        { name: '千年', days: '1000年', count: 150 }
    ],

    init() {
        document.getElementById('adventureBtn').onclick = () => this.showSceneMenu();
        document.getElementById('closeAdventureBtn').onclick = () => {
            document.getElementById('adventureModal').style.display = 'none';
        };
    },

    showSceneMenu() {
        const modal = document.getElementById('adventureModal');
        const body = document.getElementById('adventureBody');
        modal.style.display = 'flex';

        let html = `
        <div id="fixedHeader" style="
            flex-shrink: 0; 
            padding: 20px 20px 10px 20px; 
            background: #1a1a1a; /* 建议给个背景色，防止内容滚到标题后方可见 */
            border-bottom: 1px solid rgba(255,255,255,0.1);
            z-index: 10;
        ">
            <h3 style="margin:0; display:flex; align-items:center;">
                <div class="loading-spinner"></div> 
                <span id="adventureTitle">选择冒险目的地</span>
            </h3>
        </div>

        <div id="diaryContainer" class="diary-list" style="
            flex: 1; 
            overflow-y: auto; 
            padding: 15px 20px;
            scroll-behavior: smooth;
        "></div>
        `;

        this.scenes.forEach(s => {
            html += `<button class="game-opt" onclick="AdventureModule.selectDuration('${s.name}')">
                        <b>${s.name}</b><br><small>${s.desc}</small>
                     </button>`;
        });
        html += `</div>`;
        body.innerHTML = html;
    },

    selectDuration(sceneName) {
        const body = document.getElementById('adventureBody');
        let html = `<h3>在 ${sceneName} 待多久？</h3><div class="game-menu">`;
        this.durations.forEach(d => {
            html += `<button class="game-opt" onclick="AdventureModule.startAdventure('${sceneName}', '${d.name}', ${d.count})">
                        ${d.name} (记录 ${d.count} 篇)
                     </button>`;
        });
        html += `</div>`;
        body.innerHTML = html;
    },

    // adventure.js
    async startAdventure(scene, duration, count) {
        const modal = document.getElementById('adventureModal');
        const body = document.getElementById('adventureBody');
        const closeBtn = document.getElementById('closeAdventureBtn');

        // --- 强制修正父级容器样式，防止整体滚动 ---
        modal.style.overflow = 'hidden';
        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        body.style.height = '450px'; // 必须给一个固定高度，或者根据你的 UI 调整
        body.style.position = 'relative';
        body.style.padding = '0'; // 清空内边距，由内部组件控制

        // --- 强制修正关闭按钮，确保它永远在右上角 ---
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '15px';
        closeBtn.style.right = '15px';
        closeBtn.style.zIndex = '100'; // 确保在最上层

        // --- 重新构建内部 HTML ---
        body.innerHTML = `
        <div id="fixedHeader" style="
            flex-shrink: 0; 
            padding: 20px 20px 10px 20px; 
            background: #1a1a1a; /* 建议给个背景色，防止内容滚到标题后方可见 */
            border-bottom: 1px solid rgba(255,255,255,0.1);
            z-index: 10;
        ">
            <h3 style="margin:0; display:flex; align-items:center;">
                <div class="loading-spinner"></div> 
                <span id="adventureTitle">Dada 的 ${scene} 冒险</span>
            </h3>
        </div>

        <div id="diaryContainer" class="diary-list" style="
            flex: 1; 
            overflow-y: auto; 
            padding: 15px 20px;
            scroll-behavior: smooth;
        "></div>
        `;

        const container = document.getElementById('diaryContainer');
        const titleSpan = document.getElementById('adventureTitle');
        const spinner = body.querySelector('.loading-spinner');

        // 调用流式接口 (逻辑保持不变)
        await DeepSeekService.generateAdventureDiariesStream(scene, duration, count, (fullText, isDone) => {
            const diaryParts = fullText.split('---').filter(p => p.trim());

            container.innerHTML = diaryParts.map(content => `
            <div class="diary-item" style="
                background: rgba(255,255,255,0.05);
                padding: 15px;
                margin-bottom: 10px;
                border-left: 3px solid #ffcc00;
                border-radius: 4px;
            ">
                ${content.trim()}
            </div>
        `).join('');

            // 自动置底判断
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
            if (isAtBottom) {
                container.scrollTop = container.scrollHeight;
            }

            if (isDone) {
                if (spinner) spinner.style.display = 'none';
                titleSpan.innerText = `✨ ${scene} 冒险完结！`;
            }
        });
    }
};

// 记得在 window.onload 里执行 AdventureModule.init();
window.onload = () => {
    AdventureModule.init();
    // 其他初始化代码...
};