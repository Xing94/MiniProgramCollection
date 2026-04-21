// ——— 状态 & 存储 ———
const initial = {
    name: 'Dada',
    hunger: 100,
    happy: 100,
    energy: 100,
    bornAt: Date.now(),
    lastTick: Date.now(),
    history: []
};
let pet = load() || initial;

function load() {
    try {
        const raw = localStorage.getItem('pet:v1');
        return raw ? JSON.parse(raw) : null
    } catch (e) {
        return null
    }
}

function save() {
    localStorage.setItem('pet:v1', JSON.stringify(pet))
}

// ——— UI 引用 ———
const hungerBar = document.querySelector('#hungerBar');
const happyBar = document.querySelector('#happyBar');
const energyBar = document.querySelector('#energyBar');
const hungerVal = document.querySelector('#hungerVal');
const happyVal = document.querySelector('#happyVal');
const energyVal = document.querySelector('#energyVal');
const ageChip = document.querySelector('#ageChip');
const moodChip = document.querySelector('#moodChip');
const energyChip = document.querySelector('#energyChip');
const statusText = document.querySelector('#statusText');
const logEl = document.querySelector('#log');
const input = document.querySelector('#input');
const send = document.querySelector('#send');
const toast = document.querySelector('#toast');

const dogMouth = document.querySelector('#dogMouth');
const pupilLeft = document.querySelector('#pupilLeft');
const pupilRight = document.querySelector('#pupilRight');

// ——— 工具 ———
const clamp = (v) => Math.max(0, Math.min(100, v));
const pct = (v) => v + '%';

function setBar(el, val) {
    el.style.width = pct(val)
}

function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1300)
}

function setDogFace() {
    const smile = pet.happy;
    const y = 75 + (50 - smile) / 10;
    dogMouth.setAttribute('d', `M44,${y} Q50,${y + 5} 56,${y}`);

    const eyeLeft = document.querySelector('#eyeLeft');
    const eyeRight = document.querySelector('#eyeRight');

    // 视觉增强：心情极好时眼睛闪烁（加滤镜）
    if (smile > 85) {
        eyeLeft.style.filter = 'drop-shadow(0 0 5px #fff)';
        eyeRight.style.filter = 'drop-shadow(0 0 5px #fff)';
    } else {
        eyeLeft.style.filter = 'none';
        eyeRight.style.filter = 'none';
    }

    // 根据心情切换眼睛大小
    if (smile < 40) {
        eyeLeft.setAttribute('ry', '2');
        eyeRight.setAttribute('ry', '2');
    } else {
        eyeLeft.setAttribute('ry', '7');
        eyeRight.setAttribute('ry', '7');
    }

    const offset = Math.max(-2, Math.min(2, (pet.happy - 50) / 25));
    pupilLeft.setAttribute('cx', 38 + offset);
    pupilRight.setAttribute('cx', 62 + offset);
}

// ——— 渲染 ———
function render() {
    hungerVal.textContent = pet.hunger;
    happyVal.textContent = pet.happy;
    energyVal.textContent = pet.energy;
    setBar(hungerBar, pet.hunger);
    setBar(happyBar, pet.happy);
    setBar(energyBar, pet.energy);
    setDogFace();

    const ageDays = Math.max(0, Math.floor((Date.now() - pet.bornAt) / 86400000));
    ageChip.textContent = `年龄 ${ageDays} 天`;
    moodChip.textContent = `心情 ${pet.happy > 70 ? '🙂' : pet.happy > 40 ? '😐' : '🙁'}`;
    energyChip.textContent = `精力 ${pet.energy > 70 ? '良好' : pet.energy > 40 ? '一般' : '疲惫'}`;

    statusText.textContent = `已保存 · ${new Date().toLocaleTimeString()}`;

    const card = document.querySelector('.card');

    // 视觉增强：根据心情控制尾巴速度
    const tail = document.querySelector('#dogTail');
    if (pet.happy > 70) {
        tail.style.animationDuration = '0.3s'; // 兴奋地摇
    } else if (pet.happy > 40) {
        tail.style.animationDuration = '0.8s'; // 正常的摇
    } else {
        tail.style.display = 'none'; // 难过时不摇尾巴
    }

    // 视觉增强：头像背景色切换（之前的逻辑）
    const avatarWrap = document.querySelector('.avatar');
    if (pet.happy > 80) {
        avatarWrap.style.background = 'linear-gradient(135deg, #ff9a9e, #fad0c4)';
    } else if (pet.happy < 30) {
        avatarWrap.style.background = 'linear-gradient(135deg, #2c3e50, #000000)';
    } else {
        avatarWrap.style.background = 'linear-gradient(135deg, #1f2d58, #0f1730)';
    }

    const hour = new Date().getHours();
    if (hour >= 23 || hour <= 6) {
        statusText.textContent = "Dada 正在打瞌睡... 💤";
        document.getElementById('eyeLeft').setAttribute('ry', '1'); // 眯眯眼
        document.getElementById('eyeRight').setAttribute('ry', '1');
    }
}

// --- 新增：初始化时拉取历史记录 ---
function initChatHistory() {
    // 清空当前日志区域，防止重复
    logEl.innerHTML = '';

    if (pet.history && pet.history.length > 0) {
        // 遍历存储的历史消息
        pet.history.forEach(msg => {
            const wrap = document.createElement('div');
            wrap.className = 'msg ' + (msg.role === 'user' ? 'user' : 'bot');
            const b = document.createElement('div');
            b.className = 'bubble';
            b.textContent = msg.content;
            wrap.appendChild(b);
            logEl.appendChild(wrap);
        });
        // 滚动到底部
        logEl.scrollTop = logEl.scrollHeight;
    } else {
        // 如果没有历史记录，才显示默认欢迎语
        logBot('你好呀！我是你的 AI 宠物 Dada～和我聊天、喂食或带我玩吧！');
    }
}

// ——— 时间推进（被动消耗） ———
function tick() {
    const now = Date.now();
    const minutes = Math.max(0, Math.floor((now - pet.lastTick) / 60000));
    if (minutes > 0) {
        pet.hunger = clamp(pet.hunger - minutes);
        pet.energy = clamp(pet.energy - minutes);
        const moodDelta = Math.round((pet.hunger + pet.energy) / 2 >= 60 ? 0 : -1 * minutes);
        pet.happy = clamp(pet.happy + moodDelta);
        pet.lastTick = now;
        save();
        render();
    }
}
setInterval(tick, 5000);
tick();

// ——— 交互 ———
// 行为按钮统一通过 DeepSeekService.deepseekAI 交互
document.querySelector('#feedBtn').addEventListener('click', async () => {
    logUser('我要喂你吃东西');
    // 只插入“思考中...”，不记录到历史
    const wrap = document.createElement('div');
    wrap.className = 'msg bot';
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = '思考中...';
    wrap.appendChild(b);
    logEl.appendChild(wrap);
    logEl.scrollTop = logEl.scrollHeight;

    const reply = await DeepSeekService.deepseekAI('我要喂你吃东西', pet);

    // 替换为真实回复，并记录到历史
    b.textContent = reply;
    pet.history.push({
        role: 'bot',
        content: reply
    });
    if (pet.history.length > 40) pet.history.shift();
    pet.hunger = clamp(pet.hunger + 18);
    pet.happy = clamp(pet.happy + 4);
    save();
    render();
    showToast('饱腹 +18');

    // 在点击 feedBtn 或 playBtn 时增加
    pet.exp = (pet.exp || 0) + 5;
    if (pet.exp >= 100) {
        pet.level = (pet.level || 1) + 1;
        pet.exp = 0;
        showToast('🎉 Dada 升级了！当前等级：' + pet.level);
    }

    // ... 原有逻辑 ...
    spawnHeart(); // 触发爱心
    triggerCoolEffect('explode'); // 出现粒子爆发
});

document.querySelector('#playBtn').addEventListener('click', async () => {
    logUser('我们来玩耍吧');
    const wrap = document.createElement('div');
    wrap.className = 'msg bot';
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = '思考中...';
    wrap.appendChild(b);
    logEl.appendChild(wrap);
    logEl.scrollTop = logEl.scrollHeight;

    const reply = await DeepSeekService.deepseekAI('我们来玩耍吧', pet);

    b.textContent = reply;
    pet.history.push({
        role: 'bot',
        content: reply
    });
    if (pet.history.length > 40) pet.history.shift();
    pet.happy = clamp(pet.happy + 16);
    pet.energy = clamp(pet.energy - 6);
    save();
    render();
    showToast('心情 +16 / 能量 -6');

    // 在点击 feedBtn 或 playBtn 时增加
    pet.exp = (pet.exp || 0) + 5;
    if (pet.exp >= 100) {
        pet.level = (pet.level || 1) + 1;
        pet.exp = 0;
        showToast('🎉 Dada 升级了！当前等级：' + pet.level);
    }
});

document.querySelector('#sleepBtn').addEventListener('click', async () => {
    logUser('你可以休息一下');
    const wrap = document.createElement('div');
    wrap.className = 'msg bot';
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = '思考中...';
    wrap.appendChild(b);
    logEl.appendChild(wrap);
    logEl.scrollTop = logEl.scrollHeight;

    const reply = await DeepSeekService.deepseekAI('你可以休息一下', pet);

    b.textContent = reply;
    pet.history.push({
        role: 'bot',
        content: reply
    });
    if (pet.history.length > 40) pet.history.shift();
    pet.energy = clamp(pet.energy + 20);
    pet.hunger = clamp(pet.hunger - 4);
    save();
    render();
    showToast('能量 +20 / 饱腹 -4');
});


// 聊天按钮和输入框交互保持不变
document.querySelector('#talkBtn').addEventListener('click', () => {
    input.focus();
    showToast('和我聊聊吧！')
});
send.addEventListener('click', onSend);
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        onSend();
    }
});


// ——— 日志 & 历史 ———
function addMsg(role, content) {
    const wrap = document.createElement('div');
    wrap.className = 'msg ' + role;
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = content;
    wrap.appendChild(b);
    logEl.appendChild(wrap);
    logEl.scrollTop = logEl.scrollHeight;
    pet.history.push({
        role,
        content
    });
    if (pet.history.length > 40) pet.history.shift();
    save();
}

function logUser(c) {
    addMsg('user', c)
}

function logBot(c) {
    addMsg('bot', c)
}

// 初次问候
if (!pet.history.length) {
    logBot('你好呀！我是你的 AI 宠物 Dada～和我聊天、喂食或带我玩吧！');
}

const dogSvg = document.getElementById('dogSvg');
let isWinking = false;

// 点击小狗互动：眨眼并弹出提示
dogSvg.addEventListener('click', async () => {
    if (isWinking) return;
    isWinking = true;

    // 眨眼并缩放
    document.getElementById('eyeLeft').setAttribute('ry', '2');
    document.getElementById('eyeRight').setAttribute('ry', '2');

    triggerCoolEffect('heart'); // 出现 3D 粒子爱心

    spawnHeart(); // 点击也会出爱心
    logUser('我轻轻抚摸了一下小狗');

    try {
        const reply = await DeepSeekService.deepseekAI('我轻轻抚摸了一下小狗', pet);
        // 注意：此处移除了对变量 b 的引用，改为直接 addMsg 或展示回复
        pet.history.push({ role: 'bot', content: reply });
        save();
        render();
        showToast(reply);
    } catch (e) {
        console.error(e);
    } finally {
        setTimeout(() => {
            // 恢复眼睛，需考虑当前基础心情
            const eyeSize = pet.happy < 40 ? '2' : '7';
            document.getElementById('eyeLeft').setAttribute('ry', eyeSize);
            document.getElementById('eyeRight').setAttribute('ry', eyeSize);
            isWinking = false;
        }, 500);
    }
});

async function onSend() {
    const text = input.value.trim();
    if (!text) return;
    logUser(text);
    input.value = '';

    // 只在界面插入“思考中...”，不记录到历史
    const wrap = document.createElement('div');
    wrap.className = 'msg bot';
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = '思考中...';
    wrap.appendChild(b);
    logEl.appendChild(wrap);
    logEl.scrollTop = logEl.scrollHeight;

    const reply = await DeepSeekService.deepseekAI(text, pet);

    // 替换“思考中...”为真实回复，并记录到历史
    b.textContent = reply;
    pet.history.push({
        role: 'bot',
        content: reply
    });
    if (pet.history.length > 40) pet.history.shift();
    save();
}

document.querySelector('#clearChatBtn').addEventListener('click', () => {
    pet.history = [];
    save();
    logEl.innerHTML = '';
    logBot('聊天记录已清除，重新开始吧！');
});

dogSvg.parentElement.addEventListener('mousedown', () => {
    dogSvg.parentElement.classList.add('active-tap');
});

dogSvg.parentElement.addEventListener('mouseup', () => {
    dogSvg.parentElement.classList.remove('active-tap');
});

function spawnHeart() {
    const layer = document.querySelector('#effectLayer');
    const heart = document.createElement('div');
    heart.className = 'heart-effect';
    heart.textContent = '❤️';
    // 随机位置偏移
    heart.style.left = (Math.random() * 60 + 20) + 'px';
    heart.style.top = (Math.random() * 60 + 20) + 'px';
    layer.appendChild(heart);

    // 动画结束后移除元素
    setTimeout(() => heart.remove(), 1000);
}

render();
// --- 摄像监控交互系统 ---
const videoElement = document.getElementById('webcam');
let lastGestureTime = 0;

async function initHandTracking() {
    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
    });

    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 320,
        height: 240
    });

    // 启动摄像头并处理权限失败
    camera.start().catch(err => {
        console.error("摄像头启动失败:", err);
        showToast("请开启摄像头权限以进行互动");
    });
}

// --- 增强版手势状态记录 ---
let waveHistory = []; // 记录手部 X 轴轨迹
let lastWaveTime = 0;

function onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const now = Date.now();

        // --- 1. 基础眼神跟随 (保持原有逻辑) ---
        const followX = (0.5 - landmarks[8].x) * 10;
        const followY = (landmarks[8].y - 0.5) * 10 + 57;
        pupilLeft.setAttribute('cx', 38 + followX);
        pupilRight.setAttribute('cx', 62 + followX);
        pupilLeft.setAttribute('cy', followY);
        pupilRight.setAttribute('cy', followY);

        // --- 2. 交互判定逻辑 ---

        // A. 捏合手势 (喂食) - 4号点和8号点距离
        const pinchDist = Math.hypot(
            landmarks[8].x - landmarks[4].x,
            landmarks[8].y - landmarks[4].y
        );

        // B. 挥手检测 (打招呼)
        // 记录食指尖的 X 坐标，判断在 500ms 内的横向移动总和
        waveHistory.push({ x: landmarks[8].x, t: now });
        waveHistory = waveHistory.filter(p => now - p.t < 500);

        const xMovement = waveHistory.length > 5 ?
            Math.abs(waveHistory[0].x - waveHistory[waveHistory.length - 1].x) : 0;

        // C. 摸头检测
        // 判断手掌中心(9号点)是否靠近屏幕中心区域（假设宠物在屏幕中央）
        const isOverHead = landmarks[9].y < 0.4 && landmarks[9].x > 0.3 && landmarks[9].x < 0.7;

        // --- 3. 执行动作 (增加冷却时间防止重复触发) ---
        if (now - lastGestureTime > 2000) {
            if (pinchDist < 0.05) {
                handleGestureAction('feed');
                lastGestureTime = now;
            } else if (xMovement > 0.3) {
                handleGestureAction('wave');
                lastGestureTime = now;
            } else if (isOverHead && pinchDist > 0.1) { // 并非捏合，只是手掌覆盖
                handleGestureAction('pet');
                lastGestureTime = now;
            }
        }
    }
}

// 映射手势到宠物逻辑
async function handleGestureAction(action) {
    switch (action) {
        case 'feed':
            showToast("看你喂了顿好吃的！🍩");
            document.querySelector('#feedBtn').click();
            break;
        case 'wave':
            showToast("👋 嘿！Dada 看到你在打招呼呢！");
            const waveReply = await DeepSeekService.deepseekAI('我对你挥了挥手，说你好', pet);
            logBot(waveReply);
            spawnHeart();
            break;
        case 'pet':
            showToast("摸摸头，好舒服呀~ ☁️");
            pet.happy = clamp(pet.happy + 10);
            const petReply = await DeepSeekService.deepseekAI('我轻轻摸了摸你的头', pet);
            logBot(petReply);
            spawnHeart();
            dogSvg.classList.add('enjoy-animation');
            setTimeout(() => dogSvg.classList.remove('enjoy-animation'), 500);
            render();
            break;
    }
}

// --- 粒子系统全局变量 ---
let pcTargetPositions;
const PC_COUNT = 2000; // 宠物用 2000 个粒子即可，保证手机端流畅

// 触发炫酷变形的函数
function triggerCoolEffect(type) {
    for (let i = 0; i < PC_COUNT; i++) {
        let p;
        if (type === 'heart') {
            // 粒子汇聚在 Dada 的心脏位置，然后向四周扩散
            const angle = Math.random() * Math.PI * 2;
            const force = 5 + Math.random() * 5;
            p = {
                x: Math.cos(angle) * force,
                y: Math.sin(angle) * force,
                z: 0 // 保持在 2D 平面感
            };
        } else if (type === 'explode') {
            // 模拟“放烟花”的效果
            const r = 10 * Math.sqrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            p = { x: r * Math.cos(theta), y: r * Math.sin(theta), z: 0 };
        }
        pcTargetPositions[i * 3] = p.x;
        pcTargetPositions[i * 3 + 1] = p.y;
        pcTargetPositions[i * 3 + 2] = p.z;
    }

    // 重点：粒子显示一段时间后，将所有坐标归零（或移出屏幕），实现消失效果
    setTimeout(() => {
        for (let i = 0; i < PC_COUNT * 3; i++) pcTargetPositions[i] = 0;
    }, 1500);
}

const mat = new THREE.PointsMaterial({
    size: 2.0, // 先调大看能不能看见点
    color: 0x7c9dff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});


// --- 变量声明 ---
let isCamOpen = false; // 默认开启
let camera = null;    // 用于存储 MediaPipe Camera 实例
let hands = null;      // 提取到全局以便复用
const camWindow = document.getElementById('cam-mini-window');
const toggleCamBtn = document.getElementById('toggleCamBtn');

// 初始 UI 状态
camWindow.style.display = 'none';
toggleCamBtn.textContent = '开启摄像头 📷';
toggleCamBtn.classList.add('warn');

// --- 摄像头与手势初始化函数 ---
function initCameraSystem() {
    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    // 实例化 Camera 但不立即 .start()
    camera = new Camera(videoElement, {
        onFrame: async () => {
            if (isCamOpen && hands) {
                await hands.send({ image: videoElement });
            }
        },
        width: 320,
        height: 240
    });
}

// --- 开关控制逻辑 ---
toggleCamBtn.addEventListener('click', async () => {
    isCamOpen = !isCamOpen;

    if (isCamOpen) {
        // 开启：启动实例并显示窗口
        try {
            await camera.start();
            camWindow.style.display = 'block';
            toggleCamBtn.textContent = '关闭摄像头 📷';
            toggleCamBtn.classList.remove('warn');
            showToast("摄像头已开启，快来互动吧！");
        } catch (err) {
            console.error("摄像头启动失败:", err);
            showToast("无法访问摄像头，请检查权限");
            isCamOpen = false;
        }
    } else {
        // 关闭：停止实例并隐藏窗口
        if (camera) camera.stop();
        camWindow.style.display = 'none';
        toggleCamBtn.textContent = '开启摄像头 📷';
        toggleCamBtn.classList.add('warn');
        showToast("摄像头已关闭");

        // 重置瞳孔位置（防止停留在跟随状态）
        pupilLeft.setAttribute('cx', 38);
        pupilRight.setAttribute('cx', 62);
    }
});

// --- 方案 B: Canvas 2D 轻量粒子系统 ---
const canvas = document.getElementById('petCanvas');
const ctx = canvas.getContext('2d');
let particles = [];

// 调整画布分辨率
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 15 + 10;
        this.speedX = (Math.random() - 0.5) * 3;
        this.speedY = -Math.random() * 2 - 1; // 向上飘
        this.gravity = 0.05;
        this.opacity = 1;
        this.life = 1; // 寿命 1.0 -> 0
        this.content = type === 'heart' ? '❤️' : (type === 'feed' ? '🍩' : '✨');
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity; // 模拟重力感或浮力感
        this.life -= 0.02;
        this.opacity = Math.max(0, this.life);
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.font = `${this.size}px Arial`;
        ctx.fillText(this.content, this.x, this.y);
        ctx.restore();
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
    requestAnimationFrame(animate);
}
animate();

// 暴露给外部调用的触发函数
function triggerCoolEffect(type) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    // 每次触发生成 10-15 个粒子
    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(centerX, centerY, type));
    }
}

// 页面加载时启动
window.addEventListener('load', () => {
    render();             // 初始渲染宠物状态
    initCameraSystem();   // 仅初始化配置，不激活硬件
    initChatHistory();   // 【新增】加载历史记录

    // initParticleSystem(); // 初始化粒子系统
});