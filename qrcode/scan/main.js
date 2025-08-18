const video = document.getElementById('video');
const resultContainer = document.getElementById('result');
const startButton = document.getElementById('startButton');
const copyButton = document.getElementById('copyButton');
let scanning = false;
let stream = null;

function startCamera() {
    if (scanning) return;
    scanning = true;
    startButton.textContent = '停止扫描';
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
            stream = s;
            video.srcObject = stream;
            video.setAttribute('playsinline', true);
            video.play();
            requestAnimationFrame(tick);
        })
        .catch(err => {
            resultContainer.innerText = '无法访问摄像头，请检查权限设置。';
            scanning = false;
            startButton.textContent = '开始扫描';
            copyButton.style.display = 'none';
        });
}

function stopCamera() {
    scanning = false;
    startButton.textContent = '开始扫描';
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    video.srcObject = null;
    video.pause();
}

function tick() {
    if (!scanning) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvasElement = document.createElement('canvas');
        const canvas = canvasElement.getContext('2d');
        canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
        const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
        const code = jsQR(imageData.data, canvasElement.width, canvasElement.height);
        if (code) {
            resultContainer.innerText = `${code.data}`;
            copyButton.style.display = 'inline-block';
            stopCamera();
        } else {
            requestAnimationFrame(tick);
        }
    } else {
        requestAnimationFrame(tick);
    }
}

startButton.addEventListener('click', () => {
    if (!scanning) {
        resultContainer.innerText = '';
        copyButton.style.display = 'none';
        startCamera();
    } else {
        stopCamera();
        resultContainer.innerText = '';
        copyButton.style.display = 'none';
    }
});

copyButton.addEventListener('click', () => {
    const text = resultContainer.innerText.replace(/^二维码内容：/, '');
    navigator.clipboard.writeText(text).then(() => {
        copyButton.textContent = '已复制！';
        setTimeout(() => {
            copyButton.textContent = '复制内容';
        }, 1200);
    });
});