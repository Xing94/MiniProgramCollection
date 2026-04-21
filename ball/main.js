const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ball = {
    x: 50,
    y: 50,
    radius: 15,
    color: "yellow",
    vx: 0,
    vy: 0
};

const goal = { x: canvas.width - 80, y: canvas.height - 80, size: 50 };

const walls = [
    { x: 150, y: 150, w: 200, h: 20 },
    { x: 300, y: 300, w: 20, h: 200 },
    { x: 500, y: 100, w: 20, h: 300 }
];

let gameOver = false;

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
}

function drawGoal() {
    ctx.fillStyle = "lime";
    ctx.fillRect(goal.x, goal.y, goal.size, goal.size);
}

function drawWalls() {
    ctx.fillStyle = "red";
    walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));
}

function checkCollision() {
    for (let w of walls) {
        if (
            ball.x + ball.radius > w.x &&
            ball.x - ball.radius < w.x + w.w &&
            ball.y + ball.radius > w.y &&
            ball.y - ball.radius < w.y + w.h
        ) {
            ball.vx = 0;
            ball.vy = 0;
            if (ball.x < w.x) ball.x = w.x - ball.radius;
            if (ball.x > w.x + w.w) ball.x = w.x + w.w + ball.radius;
            if (ball.y < w.y) ball.y = w.y - ball.radius;
            if (ball.y > w.y + w.h) ball.y = w.y + w.h + ball.radius;
        }
    }
}

function checkWin() {
    if (
        ball.x > goal.x &&
        ball.x < goal.x + goal.size &&
        ball.y > goal.y &&
        ball.y < goal.y + goal.size
    ) {
        gameOver = true;
        document.getElementById("message").innerText = "🎉 你赢了！刷新重新开始";
    }
}

function update() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.vx *= -0.5;
    }
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.vy *= -0.5;
    }

    checkCollision();
    checkWin();

    drawGoal();
    drawWalls();
    drawBall();

    requestAnimationFrame(update);
}

window.addEventListener("deviceorientation", function (event) {
    const tiltX = event.gamma; // 左右
    const tiltY = event.beta;  // 前后

    ball.vx += tiltX * 0.05;
    ball.vy += tiltY * 0.05;
});

update();
