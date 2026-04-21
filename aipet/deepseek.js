
// DeepSeek API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'; // 请替换为实际接口地址
const DEEPSEEK_API_KEY = 'sk-2f7337c6f2c24f12a367db416f696fac'; // 请替换为你的密钥

/**
 * DeepSeek API 通信模块
 */
const DeepSeekService = {

    // deepseek.js 增加到 DeepSeekService 对象中
    async generateAdventureDiariesStream(scene, duration, count, onChunk) {
        const prompt = `
        你现在是宠物小狗 Dada 的冒险记录员。
        Dada 前往了【${scene}】世界进行了为期【${duration}】的冒险。
        
        要求：
        1. 生成 ${count} 篇日记。
        2. 内容要求：每篇 50-200 字，语气活泼、充满 Dada 作为小狗的视角（如：喜欢闻味道、摇尾巴、对新奇事物的吐槽）。
        3. 场景融合，查询【${scene}】类型的出名的故事，并且将这些故事的人事物融合写到日记里面。
        4. 经历安排：要有起伏，从最初的惊恐到后来的称霸一方或结交大佬。
        5. 生辰的内容只需要根据【${scene}】的场景来，不要提及现实世界或其他场景。
        6. 每篇日记必须以 "[第 N 天]" 开头（N 为从 1 开始的序列）。
        7. 格式严格要求："[第 N 天]： \n 内容 \n ---" 
        8. 必须按时间顺序从小到大排列。
        
        请直接输出日记文本，每篇之间用 "---" 分隔。
    `;

        try {
            const res = await fetch(DEEPSEEK_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.9,
                    stream: true // 开启流式输出
                })
            });

            const reader = res.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let done = false;
            let buffer = "";

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: !done });

                // 处理 SSE 格式的数据 (data: {...})
                const lines = chunkValue.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        const json = JSON.parse(line.substring(6));
                        const content = json.choices[0].delta.content || "";
                        buffer += content;
                        // 回调给界面：每当 buffer 里出现分隔符，就通知界面渲染
                        onChunk(buffer, false);
                    }
                }
            }

            onChunk(buffer, true); // 最后一次调用，标记为完成
        } catch (e) {
            console.error("流式生成失败", e);
        }
    },

    // 在 deepseek.js 的 DeepSeekService 对象中添加：
    async askGomokuMove(boardDescription, size) {
        const prompt = `你是一个五子棋大师。
            当前棋盘状态如下：
            ${boardDescription}

            【棋局分析指令】：
                1. 扫描棋盘：列出玩家(X)所有的活三、冲四威胁。
                2. 扫描棋盘：寻找你(O)是否有可以连成五子或活四的位置。
                3. 坐标定位：行标在左侧(0-${size - 1})，列标在上方(0-${size - 1})。

            【落子约束】：
                - 严禁下在已有 "X" 或 "O" 的位置。
                - 必须下在 "." 位置。
                - 仔细核对行号(y)和列号(x)，不要混淆。

            请只返回 JSON: {"x": 列号, "y": 行号, "analysis": "简析"}`;

        try {
            const response = await fetch(DEEPSEEK_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: "你是一个专业的五子棋 AI，只输出 JSON 格式的坐标。并且必须严格遵守坐标系统，确保落子在空位上。" },
                        { role: "user", content: prompt }
                    ],
                    response_format: { type: 'json_object' }, // 如果 API 支持强制 JSON 
                    temperature: 0.2, // 降低随机性，确保计算严谨
                })
            });

            const data = await response.json();
            const result = JSON.parse(data.choices[0].message.content);
            return result; // 预期格式 {x: 10, y: 10}
        } catch (e) {
            console.error("DeepSeek 五子棋决策失败", e);
            return null;
        }
    },

    /**
     * 向 DeepSeek 发送决策请求
     * @param {string} boardText 棋盘的文本描述
     * @param {string} level 难度等级
     * @returns {Promise<{from: number, to: number, analysis: string}>}
     */
    async askXiangQiMove(boardArray, level) {

        let boardDescription = "";
        for (let r = 0; r < 10; r++) {
            let rowStr = `行${r}: `;
            for (let c = 0; c < 9; c++) {
                const idx = r * 9 + c;
                const p = boardArray[idx];
                const pieceChar = this.getPieceName(p);
                rowStr += `[${idx}:${pieceChar}] `;
            }
            boardDescription += rowStr + "\n";
        }

        const prompt = `
            你现在是一位拥有顶级棋力的中国象棋 AI。请分析当前局面并给出黑方的最佳着法。

            【1. 角色与目标】
            - 你代表 **黑方 (负数)**。
            - 你的目标是：吃掉红方的“帅(1)”或通过战术获胜。
            - 红色棋子 (正数) 是你的对手。
            - 你只能移动黑色方的棋子 (负数)。
            - 你需要根据当前局势和难度等级，选择一个最优走法。

            【2. 棋子数值与走法规则定义】
            - **将/帅 (±1)**: 只能在九宫格内走动，每步走1格（横或竖）。
            - **士 (±2)**: 只能在九宫格内走斜线，每步1格。
            - **象 (±3)**: 走“田”字，不能过河。若“田”中心有子（塞象眼），不能走。
            - **马 (±4)**: 走“日”字。若移动方向第一格有子（蹩马腿），不能走。
            - **车 (±5)**: 直走，横竖均可，中间不能有任何子遮挡。
            - **炮 (±6)**: 不吃子时同“车”；吃子时必须隔且仅隔一个棋子（炮架）。
            - **卒/兵 (±7)**: 未过河前只能向前；过河后可向前、左、右。
            - **传过去的数据中，比如黑将才是你的棋子，你只能移动负数的棋子**。
            - **当你被将军的时候，必须优先解将。**
            - **不能做出非法走法。**
            - **不能做出会导致自己被将军的走法。**
            - **不能做出重复局面的走法（如：长将、打吃等）。**
            - **如果没有合法走法，请说明并认输。**
            - **每次只能移动一枚棋子。**
            - **走法格式：from 索引 to 索引**，例如：from:25, to:22。
            - **只有有棋子的格子才能作为 from 索引。**

            【3. 棋盘当前状态 (索引 0-89)】
                ${boardDescription}

            【4. 决策逻辑要求】
                - **必须从黑方棋子中选择 from 索引**（即上方列表中带有“黑”字的索引）。
                - **必须根据规则选择合法的 to 索引**。
                - 考虑到当前难度为：${level}。请给出具有策略性的移动（如：捉子、将军、保子）。

            【5. 输出规范】
                第一行：分析当前局势及你的意图。
                第二行：严格按格式输出：from:数字, to:数字
                示例：
                局势分析：黑方炮8平5将军，准备抽吃红车。
                from:25, to:22
            `;

        try {
            const response = await fetch(DEEPSEEK_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.2, // 降低随机性，确保计算严谨
                    max_tokens: 200
                })
            });

            const data = await response.json();

            console.log("DeepSeek 返回数据:", data);
            return data.choices[0].message.content;
        } catch (error) {
            console.error("DeepSeek 连接失败:", error);
            return null;
        }
    },
    getPieceName(p) {
        if (p === 0) return "．";
        const names = {
            1: "红帅", 2: "红仕", 3: "红相", 4: "红马", 5: "红车", 6: "红炮", 7: "红兵",
            "-1": "黑将", "-2": "黑士", "-3": "黑象", "-4": "黑马", "-5": "黑车", "-6": "黑炮", "-7": "黑卒"
        };
        return names[p] || "？";
    },

    // 调用 DeepSeek
    async deepseekAI(text, state) {
        const SYSTEM_PROMPT = "你是一只可爱的AI小狗宠物，名字叫Dada。你会用活泼、温暖的语气和主人互动，回答问题、表达情感、回应抚摸和玩耍等行为。";

        // 构造历史消息
        const messages = [
            { role: "system", content: SYSTEM_PROMPT }
        ];
        pet.history.slice(-10).forEach(msg => {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            });
        });
        // messages.push({ role: "user", content: text });

        const body = {
            model: "deepseek-chat", // 请根据实际API文档填写
            messages: messages,
            temperature: 0.8
        };

        try {
            const res = await fetch(DEEPSEEK_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            // 解析回复
            return data.choices?.[0]?.message?.content || "网络异常，暂时无法和你互动哦～";
        } catch (e) {
            return "网络异常，暂时无法和你互动哦～";
        }
    }
};