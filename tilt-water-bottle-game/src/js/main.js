const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

let bottle = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 50,
    height: 100,
    waterLevel: 80,
    maxWaterLevel: 100,
    tilt: 0
};

let isGameRunning = true;

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('deviceorientation', handleTilt);
    requestAnimationFrame(gameLoop);
}

function handleTilt(event) {
    bottle.tilt = event.gamma; // Get the tilt angle
}

function update() {
    // Update water level based on tilt
    if (bottle.tilt > 15) {
        bottle.waterLevel -= 1; // Spill water
    } else if (bottle.tilt < -15) {
        bottle.waterLevel -= 1; // Spill water
    }

    // Prevent water level from going below 0
    if (bottle.waterLevel < 0) {
        bottle.waterLevel = 0;
        isGameRunning = false; // Game over if no water left
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw bottle
    ctx.fillStyle = '#8B4513'; // Bottle color
    ctx.fillRect(bottle.x, bottle.y, bottle.width, bottle.height);
    
    // Draw water
    ctx.fillStyle = '#1E90FF'; // Water color
    ctx.fillRect(bottle.x, bottle.y + (bottle.height - (bottle.height * (bottle.waterLevel / bottle.maxWaterLevel))), bottle.width, bottle.height * (bottle.waterLevel / bottle.maxWaterLevel));
}

function gameLoop() {
    if (isGameRunning) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    } else {
        ctx.fillStyle = 'red';
        ctx.font = '48px Arial';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
    }
}

init();