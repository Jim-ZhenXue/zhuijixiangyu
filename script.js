// 获取DOM元素
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const speedAInput = document.getElementById('speed-a');
const speedBInput = document.getElementById('speed-b');
const initialDistanceInput = document.getElementById('initial-distance');
const speedAValue = document.getElementById('speed-a-value');
const speedBValue = document.getElementById('speed-b-value');
const distanceValue = document.getElementById('distance-value');
const timeDisplay = document.getElementById('time-display');
const distanceDisplay = document.getElementById('distance-display');
const predictionDisplay = document.getElementById('prediction-display');

// 游戏状态
let gameState = {
    isRunning: false,
    elapsedTime: 0,
    lastTimestamp: 0,
    objectA: {
        x: 0, // 现在这是汽车的中心点x坐标
        y: canvas.height / 2 - 15, // 红车在白线上方，但在灰色区域内
        width: 30,
        height: 20,
        color: '#e74c3c',
        speed: 0
    },
    objectB: {
        x: 0, // 现在这是汽车的中心点x坐标
        y: canvas.height / 2 + 15, // 蓝车在白线下方，但在灰色区域内
        width: 30,
        height: 20,
        color: '#3498db',
        speed: 0
    },
    initialDistance: 0,
    predictedTime: 0,
    hasMet: false,
    speedScale: 30 // 速度缩放因子，使较小的速度值在视觉上更明显
};

// 初始化游戏
function initGame() {
    gameState.isRunning = false;
    gameState.elapsedTime = 0;
    gameState.hasMet = false;
    
    // 获取用户输入的参数
    gameState.objectA.speed = parseFloat(speedAInput.value) * gameState.speedScale;
    gameState.objectB.speed = parseFloat(speedBInput.value) * gameState.speedScale;
    gameState.initialDistance = parseFloat(initialDistanceInput.value) * gameState.speedScale;
    
    // 设置初始位置 - 现在基于车辆中心点
    gameState.objectA.x = 80; // 红车中心点位置
    gameState.objectB.x = 80 + gameState.initialDistance; // 蓝车中心点位置
    // 确保Y坐标正确设置，且在灰色道路边界内
    gameState.objectA.y = canvas.height / 2 - 15; // 红车在白线上方，但在灰色区域内
    gameState.objectB.y = canvas.height / 2 + 15; // 蓝车在白线下方，但在灰色区域内
    
    // 计算预测相遇时间
    calculatePrediction();
    
    // 更新显示
    timeDisplay.textContent = `时间: 0.00 秒`;
    distanceDisplay.textContent = `距离: ${(gameState.initialDistance / gameState.speedScale).toFixed(0)}`;
    
    // 绘制初始状态
    drawScene();
}

// 开始模拟
function startSimulation() {
    if (gameState.isRunning) return;
    
    gameState.isRunning = true;
    gameState.lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);
}

// 重置模拟
function resetSimulation() {
    gameState.isRunning = false;
    initGame();
}

// 游戏主循环
function gameLoop(timestamp) {
    if (!gameState.isRunning) return;
    
    // 计算时间差
    const deltaTime = (timestamp - gameState.lastTimestamp) / 1000; // 转换为秒
    gameState.lastTimestamp = timestamp;
    
    // 更新时间
    gameState.elapsedTime += deltaTime;
    
    // 更新位置 - 中心点位置更新
    gameState.objectA.x += gameState.objectA.speed * deltaTime;
    gameState.objectB.x += gameState.objectB.speed * deltaTime;
    
    // 计算当前距离 - 基于中心点计算
    const currentDistance = gameState.objectB.x - gameState.objectA.x;
    
    // 检查是否相遇 - 当两车中心点距离小于它们半宽之和时认为相遇
    if (Math.abs(currentDistance) <= (gameState.objectA.width + gameState.objectB.width) / 2 && !gameState.hasMet) {
        gameState.hasMet = true;
        timeDisplay.textContent = `相遇时间: ${gameState.elapsedTime.toFixed(2)} 秒`;
        
        // 计算理论相遇时间与实际相遇时间的误差
        if (gameState.objectA.speed > gameState.objectB.speed) {
            const theoreticalTime = gameState.initialDistance / (gameState.objectA.speed - gameState.objectB.speed);
            const error = Math.abs(gameState.elapsedTime - theoreticalTime);
            predictionDisplay.textContent = `理论相遇时间: ${theoreticalTime.toFixed(2)}秒 (误差: ${error.toFixed(2)}秒)`;
        }
    }
    
    // 更新显示
    if (!gameState.hasMet) {
        timeDisplay.textContent = `时间: ${gameState.elapsedTime.toFixed(2)} 秒`;
        distanceDisplay.textContent = `距离: ${Math.max(0, parseInt(currentDistance / gameState.speedScale))}`;
    }
    
    // 绘制场景
    drawScene();
    
    // 检查是否应该继续模拟
    if (gameState.hasMet && gameState.elapsedTime > gameState.predictedTime + 2) {
        gameState.isRunning = false;
    } else {
        requestAnimationFrame(gameLoop);
    }
}

// 绘制场景
function drawScene() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制道路
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(0, canvas.height / 2 - 25, canvas.width, 50);
    
    // 绘制道路标记线
    ctx.beginPath();
    ctx.setLineDash([20, 20]);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 计算可见区域
    const visibleWidth = canvas.width - 100;
    const maxX = Math.max(gameState.objectA.x, gameState.objectB.x);
    const minX = Math.min(gameState.objectA.x, gameState.objectB.x);
    const viewportWidth = Math.max(maxX - minX + 200, 500);
    const scale = visibleWidth / viewportWidth;
    
    // 计算缩放后的位置
    const offsetX = 50 - minX * scale;
    
    // 绘制红色车
    drawCar(
        50 + (gameState.objectA.x - 50) * scale,
        gameState.objectA.y, 
        gameState.objectA.width * scale, 
        gameState.objectA.height, 
        gameState.objectA.color,
        '红车'
    );
    
    // 绘制蓝色车
    drawCar(
        50 + (gameState.objectB.x - 50) * scale,
        gameState.objectB.y, 
        gameState.objectB.width * scale, 
        gameState.objectB.height, 
        gameState.objectB.color,
        '蓝车'
    );
    
    // 添加距离标记
    if (!gameState.hasMet) {
        const distance = gameState.objectB.x - gameState.objectA.x;
        if (distance > 0) {
            // 显示两车中心点之间的距离线
            const carAX = 50 + (gameState.objectA.x - 50) * scale;
            const carBX = 50 + (gameState.objectB.x - 50) * scale;
            const midX = (carAX + carBX) / 2;
            const lineY = canvas.height / 2 - 40; // 将距离线放在道路上方
            
            // 绘制水平距离线
            ctx.beginPath();
            ctx.moveTo(carAX, lineY);
            ctx.lineTo(carBX, lineY);
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // 绘制两端的垂直短线
            ctx.beginPath();
            ctx.moveTo(carAX, lineY - 5);
            ctx.lineTo(carAX, lineY + 5);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(carBX, lineY - 5);
            ctx.lineTo(carBX, lineY + 5);
            ctx.stroke();
            
            // 绘制距离文本
            ctx.fillStyle = '#2c3e50';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.floor(distance / gameState.speedScale)}`, midX, lineY - 10);
        }
    }
}

// 绘制汽车 - 注意x,y现在是车辆的中心点坐标
function drawCar(x, y, width, height, color, label) {
    // 计算车辆各部分尺寸
    const carLength = width;
    const carHeight = height * 0.6;
    
    // 计算车身左上角坐标（因为x,y是中心点）
    const carX = x - carLength / 2;
    const carY = y - height * 0.1;
    
    // 保存当前状态
    ctx.save();
    
    // 绘制车身底盘
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(carX, carY);
    ctx.lineTo(carX + carLength * 0.1, carY - carHeight * 0.4); // 左前上角
    ctx.lineTo(carX + carLength * 0.3, carY - carHeight * 0.4); // 前挡风玻璃底部
    ctx.lineTo(carX + carLength * 0.4, carY - carHeight); // 前挡风玻璃顶部
    ctx.lineTo(carX + carLength * 0.7, carY - carHeight); // 车顶后部
    ctx.lineTo(carX + carLength * 0.9, carY - carHeight * 0.4); // 后挡风玻璃底部
    ctx.lineTo(carX + carLength, carY); // 右下角
    ctx.closePath();
    ctx.fill();
    
    // 车身轮廓
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 绘制车窗
    ctx.fillStyle = '#a8d8ff';
    
    // 前窗
    ctx.beginPath();
    ctx.moveTo(carX + carLength * 0.12, carY - carHeight * 0.38);
    ctx.lineTo(carX + carLength * 0.29, carY - carHeight * 0.38);
    ctx.lineTo(carX + carLength * 0.38, carY - carHeight * 0.96);
    ctx.lineTo(carX + carLength * 0.31, carY - carHeight * 0.96);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 驾驶室窗
    ctx.beginPath();
    ctx.moveTo(carX + carLength * 0.31, carY - carHeight * 0.96);
    ctx.lineTo(carX + carLength * 0.42, carY - carHeight * 0.96);
    ctx.lineTo(carX + carLength * 0.42, carY - carHeight * 0.38);
    ctx.lineTo(carX + carLength * 0.31, carY - carHeight * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 后窗
    ctx.beginPath();
    ctx.moveTo(carX + carLength * 0.44, carY - carHeight * 0.96);
    ctx.lineTo(carX + carLength * 0.68, carY - carHeight * 0.96);
    ctx.lineTo(carX + carLength * 0.68, carY - carHeight * 0.38);
    ctx.lineTo(carX + carLength * 0.44, carY - carHeight * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 后挡风玻璃
    ctx.beginPath();
    ctx.moveTo(carX + carLength * 0.7, carY - carHeight * 0.96);
    ctx.lineTo(carX + carLength * 0.78, carY - carHeight * 0.96);
    ctx.lineTo(carX + carLength * 0.89, carY - carHeight * 0.38);
    ctx.lineTo(carX + carLength * 0.7, carY - carHeight * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 绘制轮胎
    const wheelRadius = height * 0.28;
    const frontWheelX = carX + carLength * 0.2;
    const rearWheelX = carX + carLength * 0.8;
    const wheelY = carY + wheelRadius * 0.3;
    
    // 前轮
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(frontWheelX, wheelY, wheelRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#777';
    ctx.beginPath();
    ctx.arc(frontWheelX, wheelY, wheelRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // 后轮
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(rearWheelX, wheelY, wheelRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#777';
    ctx.beginPath();
    ctx.arc(rearWheelX, wheelY, wheelRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加车灯
    // 前灯
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.rect(carX, carY - carHeight * 0.2, carLength * 0.05, carHeight * 0.2);
    ctx.fill();
    
    // 后灯
    ctx.fillStyle = label === '红车' ? '#ff0000' : '#3498db';
    ctx.beginPath();
    ctx.rect(carX + carLength - carLength * 0.05, carY - carHeight * 0.2, carLength * 0.05, carHeight * 0.2);
    ctx.fill();
    
    // 绘制速度信息
    if (gameState.isRunning) {
        const speed = label === '红车' ? gameState.objectA.speed / gameState.speedScale : gameState.objectB.speed / gameState.speedScale;
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(`${speed}`, carX + carLength/2, carY - carHeight - 10);
        ctx.fillText(`${speed}`, carX + carLength/2, carY - carHeight - 10);
    }
    
    // 恢复之前的状态
    ctx.restore();
}

// 计算预计相遇时间
function calculatePrediction() {
    if (gameState.objectA.speed > gameState.objectB.speed) {
        gameState.predictedTime = gameState.initialDistance / (gameState.objectA.speed - gameState.objectB.speed);
        predictionDisplay.textContent = `预计相遇时间: ${gameState.predictedTime.toFixed(2)} 秒`;
    } else if (gameState.objectA.speed <= gameState.objectB.speed) {
        predictionDisplay.textContent = '预计相遇时间: 永远不会相遇';
    }
}

// 事件监听器
startBtn.addEventListener('click', startSimulation);
resetBtn.addEventListener('click', resetSimulation);

// 滑块值变化处理
speedAInput.addEventListener('input', function() {
    speedAValue.textContent = this.value;
    if (!gameState.isRunning) {
        gameState.objectA.speed = parseFloat(this.value) * gameState.speedScale;
        resetSimulation();
    }
});

speedBInput.addEventListener('input', function() {
    speedBValue.textContent = this.value;
    if (!gameState.isRunning) {
        gameState.objectB.speed = parseFloat(this.value) * gameState.speedScale;
        resetSimulation();
    }
});

initialDistanceInput.addEventListener('input', function() {
    distanceValue.textContent = this.value;
    if (!gameState.isRunning) {
        resetSimulation();
    }
});

// 初始化游戏
initGame();
