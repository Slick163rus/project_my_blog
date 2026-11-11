// ИГРА «Увернись от встречки»


const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');
const speedEl = document.getElementById('speed');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');

// ---------- Настройки ----------
const LANES = 3;
const LANE_WIDTH = canvas.width / LANES;
const ROAD_COLOR = '#2a2a2a';
const LINE_COLOR = '#f5c518';   // жёлтая разметка
const GRASS_COLOR = '#1a3a1a';

// ---------- Состояние игры ----------
let player, enemies, roadOffset, score, speed, gameRunning, isPaused, highscore, animationId;

highscore = parseInt(localStorage.getItem('carGameHighscore') || '0');
highscoreEl.textContent = highscore;

// ---------- Игрок ----------
function createPlayer() {
    return {
        lane: 1, // средняя полоса
        width: 50,
        height: 90,
        x: 0,
        y: canvas.height - 120,
        color: '#e10600' // красный F1
    };
}

function updatePlayerX() {
    player.x = player.lane * LANE_WIDTH + (LANE_WIDTH - player.width) / 2;
}

// ---------- Враги ----------
function spawnEnemy() {
    const lane = Math.floor(Math.random() * LANES);
    const colors = ['#00aaff', '#ffaa00', '#aa00ff', '#00ff88', '#ffffff'];
    enemies.push({
        lane: lane,
        x: lane * LANE_WIDTH + (LANE_WIDTH - 50) / 2,
        y: -100,
        width: 50,
        height: 90,
        color: colors[Math.floor(Math.random() * colors.length)]
    });
}

// ---------- Рисование ----------
function drawRoad() {
    // Обочина
    ctx.fillStyle = GRASS_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Дорога
    ctx.fillStyle = ROAD_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Разделительные полосы (движутся вниз)
    ctx.fillStyle = LINE_COLOR;
    const dashHeight = 40;
    const dashGap = 30;
    for (let i = 1; i < LANES; i++) {
        const x = i * LANE_WIDTH - 3;
        for (let y = -dashHeight + (roadOffset % (dashHeight + dashGap)); y < canvas.height; y += dashHeight + dashGap) {
            ctx.fillRect(x, y, 6, dashHeight);
        }
    }

    // Боковые линии
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(3, 0, 4, canvas.height);
    ctx.fillRect(canvas.width - 7, 0, 4, canvas.height);
}

function drawCar(car, isPlayer = false) {
    // Тень
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(car.x + 4, car.y + 6, car.width, car.height);

    // Кузов
    ctx.fillStyle = car.color;
    ctx.fillRect(car.x, car.y, car.width, car.height);

    // Лобовое стекло
    ctx.fillStyle = '#1a1a1a';
    if (isPlayer) {
        ctx.fillRect(car.x + 8, car.y + 15, car.width - 16, 20);
    } else {
        // Встречка (стекло снизу)
        ctx.fillRect(car.x + 8, car.y + car.height - 35, car.width - 16, 20);
    }

    // Фары
    ctx.fillStyle = isPlayer ? '#ffff66' : '#ff3333';
    if (isPlayer) {
        ctx.fillRect(car.x + 5, car.y + 2, 10, 6);
        ctx.fillRect(car.x + car.width - 15, car.y + 2, 10, 6);
    } else {
        ctx.fillRect(car.x + 5, car.y + car.height - 8, 10, 6);
        ctx.fillRect(car.x + car.width - 15, car.y + car.height - 8, 10, 6);
    }

    // Колёса
    ctx.fillStyle = '#000';
    ctx.fillRect(car.x - 3, car.y + 10, 5, 20);
    ctx.fillRect(car.x + car.width - 2, car.y + 10, 5, 20);
    ctx.fillRect(car.x - 3, car.y + car.height - 30, 5, 20);
    ctx.fillRect(car.x + car.width - 2, car.y + car.height - 30, 5, 20);
}

// ---------- Столкновения ----------
function checkCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// ---------- Игровой цикл ----------
let lastSpawn = 0;
let spawnInterval = 1200; // мс

function gameLoop(timestamp) {
    if (!gameRunning || isPaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Двигаем дорогу
    roadOffset += speed * 5;

    // Рисуем
    drawRoad();

    // Обновляем врагов
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += speed * 4;

        // Удаляем уехавших
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
            score += 10;
            continue;
        }

        // Столкновение
        if (checkCollision(player, enemies[i])) {
            endGame();
            return;
        }

        drawCar(enemies[i]);
    }

    // Игрок
    updatePlayerX();
    drawCar(player, true);

    // Спавн врагов
    if (timestamp - lastSpawn > spawnInterval) {
        spawnEnemy();
        lastSpawn = timestamp;
        // Уменьшаем интервал со временем
        spawnInterval = Math.max(500, 1200 - score / 5);
    }

    // Увеличиваем скорость и счёт
    score += 0.1 * speed;
    speed += 0.0002;

    // HUD
    scoreEl.textContent = Math.floor(score);
    speedEl.textContent = speed.toFixed(1);

    animationId = requestAnimationFrame(gameLoop);
}

// ---------- Управление ----------
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') {
        togglePause();
        return;
    }
    if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
        restartGame();
        return;
    }

    if (isPaused) return;

    if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') && player.lane > 0) {
        player.lane--;
    }
    if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') && player.lane < LANES - 1) {
        player.lane++;
    }
});

// Мобильное управление — свайпы
let touchStartX = 0;
canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});
canvas.addEventListener('touchend', (e) => {
    if (!gameRunning || isPaused) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 30) {
        if (dx < 0 && player.lane > 0) player.lane--;
        if (dx > 0 && player.lane < LANES - 1) player.lane++;
    }
});

// ---------- Старт / Рестарт / Пауза ----------
function startGame() {
    player = createPlayer();
    enemies = [];
    roadOffset = 0;
    score = 0;
    speed = 1.0;
    lastSpawn = 0;
    spawnInterval = 1200;
    gameRunning = true;
    isPaused = false;
    gameOverEl.classList.add('hidden');
    startScreen.classList.add('hidden');
    animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    finalScoreEl.textContent = Math.floor(score);

    if (Math.floor(score) > highscore) {
        highscore = Math.floor(score);
        localStorage.setItem('carGameHighscore', highscore);
        highscoreEl.textContent = highscore;
    }

    gameOverEl.classList.remove('hidden');
}

function restartGame() {
    startGame();
}

function togglePause() {
    if (!gameRunning) return;
    isPaused = !isPaused;
    if (!isPaused) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

restartBtn.addEventListener('click', restartGame);
startBtn.addEventListener('click', startGame);

// Начальная отрисовка
player = createPlayer();
updatePlayerX();
drawRoad();
drawCar(player, true);