// minigame.js - Minigame System (Fruit Catch & Fly Challenge)

class Minigame {
  constructor(pet, renderer) {
    this.pet = pet;
    this.renderer = renderer;
    this.overlay = document.getElementById('minigame-overlay');
    this.canvas = document.getElementById('minigame-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.currentGame = null;
    this.running = false;
    this.score = 0;
    this.highScores = { fruit: 0, fly: 0 };
    this.animFrame = null;
    this.gameData = {};

    this.init();
  }

  init() {
    // Game selection buttons
    const fruitBtn = document.getElementById('game-fruit-btn');
    const flyBtn = document.getElementById('game-fly-btn');
    const closeBtn = document.getElementById('minigame-close');

    if (fruitBtn) fruitBtn.addEventListener('click', () => this.startGame('fruit'));
    if (flyBtn) flyBtn.addEventListener('click', () => this.startGame('fly'));
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!this.running) return;
      this.handleKey(e);
    });

    // Click/Touch for fly game
    if (this.canvas) {
      this.canvas.addEventListener('click', () => {
        if (this.currentGame === 'fly' && this.running) {
          this.gameData.flappyVel = -6;
        }
      });
    }
  }

  show() {
    this.overlay.style.display = 'flex';
    this.showMenu();

    // Resize window for game
    if (window.__TAURI__) {
      const { getCurrentWindow } = window.__TAURI__.window;
      const { LogicalSize } = window.__TAURI__.window;
      try {
        getCurrentWindow().setSize(new LogicalSize(600, 500));
      } catch (e) {}
    }
  }

  close() {
    this.running = false;
    this.overlay.style.display = 'none';
    this.currentGame = null;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);

    // Reset window size
    if (window.__TAURI__) {
      const { getCurrentWindow } = window.__TAURI__.window;
      const { LogicalSize } = window.__TAURI__.window;
      try {
        getCurrentWindow().setSize(new LogicalSize(200, 200));
      } catch (e) {}
    }
  }

  showMenu() {
    const menu = document.getElementById('minigame-menu');
    const playArea = document.getElementById('minigame-play');
    if (menu) menu.style.display = 'block';
    if (playArea) playArea.style.display = 'none';
  }

  showPlayArea() {
    const menu = document.getElementById('minigame-menu');
    const playArea = document.getElementById('minigame-play');
    if (menu) menu.style.display = 'none';
    if (playArea) playArea.style.display = 'block';
  }

  startGame(type) {
    this.currentGame = type;
    this.score = 0;
    this.running = true;
    this.showPlayArea();

    if (this.canvas) {
      this.canvas.width = 560;
      this.canvas.height = 380;
    }

    if (type === 'fruit') {
      this.initFruitGame();
    } else {
      this.initFlyGame();
    }

    this.gameLoop();
  }

  // === FRUIT CATCH GAME ===
  initFruitGame() {
    this.gameData = {
      playerX: 280,
      playerW: 60,
      playerSpeed: 0,
      fruits: [],
      spawnTimer: 0,
      spawnInterval: 800,
      timeLeft: 30000,
      combo: 0,
    };
  }

  updateFruitGame(dt) {
    const g = this.gameData;

    // Timer
    g.timeLeft -= dt;
    if (g.timeLeft <= 0) {
      this.endGame();
      return;
    }

    // Player movement
    if (this.keys && this.keys['ArrowLeft']) g.playerSpeed = -5;
    else if (this.keys && this.keys['ArrowRight']) g.playerSpeed = 5;
    else g.playerSpeed *= 0.8;

    g.playerX += g.playerSpeed;
    g.playerX = Math.max(g.playerW / 2, Math.min(560 - g.playerW / 2, g.playerX));

    // Spawn fruits
    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      g.spawnTimer = g.spawnInterval * (0.7 + Math.random() * 0.6);
      const isBomb = Math.random() < 0.2;
      g.fruits.push({
        x: 30 + Math.random() * 500,
        y: -20,
        speed: 2 + Math.random() * 2 + (30000 - g.timeLeft) / 10000,
        type: isBomb ? 'bomb' : 'fruit',
        fruitType: ['apple', 'orange', 'grape', 'cherry'][Math.floor(Math.random() * 4)],
        size: 16,
      });
    }

    // Update fruits
    for (let i = g.fruits.length - 1; i >= 0; i--) {
      const f = g.fruits[i];
      f.y += f.speed;

      // Catch detection
      if (f.y > 340 && f.y < 370 &&
          Math.abs(f.x - g.playerX) < g.playerW / 2 + f.size) {
        if (f.type === 'bomb') {
          g.combo = 0;
          this.score = Math.max(0, this.score - 5);
          this.pet.happiness = Math.max(0, this.pet.happiness - 2);
        } else {
          g.combo++;
          const bonus = Math.min(g.combo, 5);
          this.score += bonus;
        }
        g.fruits.splice(i, 1);
        continue;
      }

      // Remove if off screen
      if (f.y > 400) {
        g.fruits.splice(i, 1);
      }
    }
  }

  drawFruitGame() {
    const ctx = this.ctx;
    const g = this.gameData;
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#E3F2FD';
    ctx.fillRect(0, 0, 560, 380);

    // Ground
    ctx.fillStyle = '#81C784';
    ctx.fillRect(0, 350, 560, 30);

    // Draw dragon basket (simplified)
    const px = g.playerX;
    ctx.fillStyle = '#795548';
    ctx.fillRect(px - 30, 340, 60, 20);
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(px - 25, 330, 50, 15);

    // Eyes on basket dragon
    ctx.fillStyle = '#FFF';
    ctx.fillRect(px - 15, 333, 6, 6);
    ctx.fillRect(px + 9, 333, 6, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(px - 13, 335, 3, 3);
    ctx.fillRect(px + 11, 335, 3, 3);

    // Fruits
    for (const f of g.fruits) {
      if (f.type === 'bomb') {
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF5722';
        ctx.fillRect(f.x - 2, f.y - f.size - 6, 4, 6);
      } else {
        const colors = { apple: '#F44336', orange: '#FF9800', grape: '#9C27B0', cherry: '#E91E63' };
        ctx.fillStyle = colors[f.fruitType] || '#F44336';
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        // Stem
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(f.x - 1, f.y - f.size - 4, 2, 5);
      }
    }

    // HUD
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`分数: ${this.score}`, 15, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`时间: ${Math.ceil(g.timeLeft / 1000)}s`, 545, 30);
    if (g.combo > 1) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FF9800';
      ctx.fillText(`连击 x${g.combo}!`, 280, 30);
    }
  }

  // === FLY CHALLENGE (Flappy Bird style) ===
  initFlyGame() {
    this.gameData = {
      birdY: 190,
      birdVel: 0,
      gravity: 0.35,
      pipes: [],
      pipeTimer: 0,
      pipeInterval: 1800,
      distance: 0,
      flapStrength: -6,
    };
    this.keys = {};
  }

  updateFlyGame(dt) {
    const g = this.gameData;

    // Gravity
    g.birdVel += g.gravity;
    g.birdY += g.birdVel;

    // Floor/ceiling
    if (g.birdY > 350 || g.birdY < 10) {
      this.endGame();
      return;
    }

    // Pipes
    g.pipeTimer -= dt;
    if (g.pipeTimer <= 0) {
      g.pipeTimer = g.pipeInterval;
      const gapY = 80 + Math.random() * 200;
      const gapH = 100 - Math.min(30, this.score * 2); // Gets harder
      g.pipes.push({
        x: 580,
        gapY,
        gapH: Math.max(70, gapH),
        passed: false,
      });
    }

    for (let i = g.pipes.length - 1; i >= 0; i--) {
      const p = g.pipes[i];
      p.x -= 3;

      // Collision
      if (p.x < 50 && p.x > 10) {
        if (g.birdY < p.gapY - p.gapH / 2 || g.birdY > p.gapY + p.gapH / 2) {
          if (p.x < 35 && p.x > 15) {
            this.endGame();
            return;
          }
        }
      }

      // Score
      if (!p.passed && p.x < 15) {
        p.passed = true;
        this.score++;
      }

      // Remove off-screen
      if (p.x < -60) g.pipes.splice(i, 1);
    }

    g.distance += 3;
  }

  drawFlyGame() {
    const ctx = this.ctx;
    const g = this.gameData;
    if (!ctx) return;

    // Sky
    ctx.fillStyle = '#B3E5FC';
    ctx.fillRect(0, 0, 560, 380);

    // Clouds
    ctx.fillStyle = '#FFF';
    for (let i = 0; i < 3; i++) {
      const cx = ((g.distance * 0.3 + i * 200) % 700) - 70;
      ctx.beginPath();
      ctx.arc(cx, 60 + i * 30, 25, 0, Math.PI * 2);
      ctx.arc(cx + 20, 55 + i * 30, 20, 0, Math.PI * 2);
      ctx.arc(cx - 15, 58 + i * 30, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pipes
    ctx.fillStyle = '#4CAF50';
    for (const p of g.pipes) {
      // Top pipe
      ctx.fillRect(p.x, 0, 40, p.gapY - p.gapH / 2);
      ctx.fillStyle = '#388E3C';
      ctx.fillRect(p.x - 3, p.gapY - p.gapH / 2 - 15, 46, 15);
      ctx.fillStyle = '#4CAF50';
      // Bottom pipe
      ctx.fillRect(p.x, p.gapY + p.gapH / 2, 40, 380 - p.gapY - p.gapH / 2);
      ctx.fillStyle = '#388E3C';
      ctx.fillRect(p.x - 3, p.gapY + p.gapH / 2, 46, 15);
      ctx.fillStyle = '#4CAF50';
    }

    // Dragon (simplified)
    const by = g.birdY;
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.ellipse(30, by, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#FFF';
    ctx.fillRect(34, by - 5, 6, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(36, by - 3, 3, 3);
    // Wings
    const wingY = Math.sin(Date.now() * 0.01) * 5;
    ctx.fillStyle = '#81C784';
    ctx.beginPath();
    ctx.ellipse(22, by - 8 + wingY, 10, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // HUD
    ctx.fillStyle = '#333';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.score}`, 280, 40);
  }

  handleKey(e) {
    if (!this.keys) this.keys = {};
    this.keys[e.key] = e.type === 'keydown';

    if (e.key === ' ' && this.currentGame === 'fly') {
      e.preventDefault();
      this.gameData.birdVel = this.gameData.flapStrength;
    }
    if (e.key === 'Escape') {
      this.endGame();
    }
  }

  gameLoop() {
    if (!this.running) return;

    const now = performance.now();
    if (!this._lastFrame) this._lastFrame = now;
    const dt = now - this._lastFrame;
    this._lastFrame = now;

    if (this.currentGame === 'fruit') {
      this.updateFruitGame(dt);
      this.drawFruitGame();
    } else if (this.currentGame === 'fly') {
      this.updateFlyGame(dt);
      this.drawFlyGame();
    }

    this.animFrame = requestAnimationFrame(() => this.gameLoop());
  }

  endGame() {
    this.running = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this._lastFrame = null;

    // Update high score
    const key = this.currentGame;
    if (this.score > (this.highScores[key] || 0)) {
      this.highScores[key] = this.score;
    }

    // Reward pet
    const expReward = Math.floor(this.score * 2);
    const happinessReward = Math.min(30, this.score);
    this.pet.addExp(expReward);
    this.pet.happiness = Math.min(100, this.pet.happiness + happinessReward);

    // Show result
    const ctx = this.ctx;
    if (ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, 560, 380);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('游戏结束!', 280, 150);
      ctx.font = '20px monospace';
      ctx.fillText(`得分: ${this.score}`, 280, 200);
      ctx.fillText(`最高分: ${this.highScores[key] || 0}`, 280, 230);
      ctx.font = '16px monospace';
      ctx.fillText(`获得 ${expReward} 经验, +${happinessReward} 心情`, 280, 270);
      ctx.font = '14px monospace';
      ctx.fillText('点击关闭按钮返回', 280, 320);
    }

    // Achievement check
    if (window.achievements) {
      window.achievements.checkGameScore(key, this.score);
    }
  }
}
