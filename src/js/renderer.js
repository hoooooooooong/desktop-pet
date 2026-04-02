// renderer.js - Enhanced Pixel Rendering Engine

const PIXEL_SIZE = 6;
const SPRITE_W = 16;
const SPRITE_H = 16;

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sprites = null;
    this.currentAction = 'idle';
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.frameDuration = 150;
    this.lastTime = 0;
    this.facingRight = true;
    this.accessories = [];
    this.particles = [];
    
    // Bubble & Emotes
    this.bubbleText = null;
    this.bubbleTimer = 0;
    this.bubbleOpacity = 0;
    this.emoteIcon = null;
    this.emoteTimer = 0;
    this.emoteOpacity = 0;
    
    // Animations
    this.floatOffset = 0;
    this.floatDir = 1;
    this.zzzPhase = 0;
    
    this.init();
  }

  init() {
    this.ctx.imageSmoothingEnabled = false;
  }

  loadSprites(dragonType) {
    this.sprites = getSprites(dragonType);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.clear();

    // 1. Update Animations
    this.updateAnimations(dt);

    // 2. Draw Shadow (Scale with floatOffset)
    this.drawShadow();

    // 3. Draw Sprite & Accessories
    if (this.sprites && this.sprites[this.currentAction]) {
      const frames = this.sprites[this.currentAction];
      this.frameTimer += dt;

      if (this.frameTimer >= this.frameDuration) {
        this.frameTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % frames.length;
      }

      const frame = frames[this.currentFrame];
      if (frame) {
        this.drawPixelFrame(frame, this.facingRight, this.floatOffset);
      }

      // Accessories
      for (const accId of this.accessories) {
        const accFrames = getAccessorySprite(accId);
        if (accFrames && accFrames[0]) {
          this.drawPixelFrame(accFrames[0], this.facingRight, this.floatOffset);
        }
      }
    }

    // 4. Particles
    this.updateAndDrawParticles(dt);

    // 5. Bubble & Emote
    this.updateAndDrawOverlays(dt);

    // 6. Zzz
    if (this.currentAction === 'sleep') {
      this.drawZzz(dt);
    }
  }

  updateAnimations(dt) {
    // Breathing/Floating animation
    const floatSpeed = 0.002;
    this.floatOffset = Math.sin(Date.now() * floatSpeed) * 3;
    
    // Fade bubble
    if (this.bubbleTimer > 0) {
      this.bubbleTimer -= dt;
      this.bubbleOpacity = Math.min(1, this.bubbleOpacity + dt / 300);
    } else {
      this.bubbleOpacity = Math.max(0, this.bubbleOpacity - dt / 300);
    }

    // Fade emote
    if (this.emoteTimer > 0) {
      this.emoteTimer -= dt;
      this.emoteOpacity = Math.min(1, this.emoteOpacity + dt / 300);
    } else {
      this.emoteOpacity = Math.max(0, this.emoteOpacity - dt / 300);
    }
  }

  drawShadow() {
    const cx = this.canvas.width / 2;
    const cy = (this.canvas.height + SPRITE_H * PIXEL_SIZE) / 2 + 10; // Moved lower
    const baseW = 40;
    const scale = 1 - (this.floatOffset / 20); // Shadow shrinks as pet floats up
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy, baseW * scale, 8 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawPixelFrame(frame, flip, yOffset = 0) {
    const offsetX = (this.canvas.width - SPRITE_W * PIXEL_SIZE) / 2;
    const offsetY = (this.canvas.height - SPRITE_H * PIXEL_SIZE) / 2 + 15 + yOffset; // Moved lower to 15 from 0

    for (let y = 0; y < frame.length; y++) {
      for (let x = 0; x < frame[y].length; x++) {
        const color = frame[y][x];
        if (!color) continue;

        const px = flip ? frame[y].length - 1 - x : x;

        this.ctx.fillStyle = color;
        this.ctx.fillRect(
          Math.floor(offsetX + px * PIXEL_SIZE),
          Math.floor(offsetY + y * PIXEL_SIZE),
          PIXEL_SIZE,
          PIXEL_SIZE
        );
      }
    }
  }

  // --- Overlays ---
  showBubble(text, duration = 3500) {
    this.bubbleText = text;
    this.bubbleTimer = duration;
  }

  showEmote(icon, duration = 2500) {
    this.emoteIcon = icon;
    this.emoteTimer = duration;
  }

  updateAndDrawOverlays(dt) {
    const dragonTop = (this.canvas.height - SPRITE_H * PIXEL_SIZE) / 2 + 15 + this.floatOffset;

    // Draw Emote Icon
    if (this.emoteOpacity > 0) {
      this.ctx.globalAlpha = this.emoteOpacity;
      this.ctx.font = '24px serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.emoteIcon, this.canvas.width / 2, dragonTop - 15);
      this.ctx.globalAlpha = 1;
    }

    // Draw Speech Bubble
    if (this.bubbleOpacity > 0 && this.bubbleText) {
      this.ctx.globalAlpha = this.bubbleOpacity;
      this.ctx.font = '13px "Segoe UI", Roboto, sans-serif';
      
      const text = this.bubbleText;
      const metrics = this.ctx.measureText(text);
      const padding = 12;
      const bw = Math.max(60, metrics.width + padding * 2);
      const bh = 32;
      const bx = this.canvas.width / 2 - bw / 2;
      const by = dragonTop - bh - (this.emoteOpacity > 0 ? 45 : 20);

      // Pixelated Bubble Body
      this.ctx.fillStyle = 'white';
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 2;
      
      this.drawPixelBox(bx, by, bw, bh, 6);
      
      // Bubble Tail
      this.ctx.beginPath();
      this.ctx.moveTo(this.canvas.width / 2 - 6, by + bh);
      this.ctx.lineTo(this.canvas.width / 2, by + bh + 8);
      this.ctx.lineTo(this.canvas.width / 2 + 6, by + bh);
      this.ctx.fill();
      this.ctx.stroke();

      // Text
      this.ctx.fillStyle = '#333';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(text, this.canvas.width / 2, by + bh / 2 + 1);
      this.ctx.globalAlpha = 1;
    }
  }

  drawPixelBox(x, y, w, h, radius) {
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, w, h, radius);
    this.ctx.fill();
    this.ctx.stroke();
  }

  // --- Particles ---
  addParticle(type, x, y) {
    const count = type === 'heart' ? 6 : type === 'sparkle' ? 10 : 4;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        type,
        x: x || this.canvas.width / 2,
        y: y || this.canvas.height / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 4 - 2,
        life: 1200,
        maxLife: 1200,
        size: type === 'heart' ? 10 : type === 'sparkle' ? 4 : 6,
        color: type === 'heart' ? '#ff5252' : type === 'sparkle' ? '#ffd700' : '#4caf50'
      });
    }
  }

  updateAndDrawParticles(dt) {
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      if (p.life <= 0) return false;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // Gravity
      
      const alpha = p.life / p.maxLife;
      this.ctx.globalAlpha = alpha;

      if (p.type === 'heart') {
        this.drawHeart(p.x, p.y, p.size);
      } else {
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }

      this.ctx.globalAlpha = 1;
      return true;
    });
  }

  drawHeart(x, y, size) {
    this.ctx.fillStyle = '#ff5252';
    const s = size / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + s);
    this.ctx.bezierCurveTo(x - s, y, x - s, y - s, x, y - s / 2);
    this.ctx.bezierCurveTo(x + s, y - s, x + s, y, x, y + s);
    this.ctx.fill();
  }

  // --- Zzz ---
  drawZzz(dt) {
    this.zzzPhase += dt * 0.002;
    const baseX = this.canvas.width / 2 + 35;
    const baseY = this.canvas.height / 2 - 35 + this.floatOffset;
    
    this.ctx.font = 'bold 16px "Courier New", monospace';
    this.ctx.fillStyle = '#42a5f5';
    for (let i = 0; i < 3; i++) {
      const phase = (this.zzzPhase + i * 0.8) % 3;
      const alpha = Math.max(0, 1 - phase / 3);
      const scale = 0.5 + phase / 2;
      
      this.ctx.globalAlpha = alpha;
      this.ctx.save();
      this.ctx.translate(baseX + i * 15, baseY - phase * 25);
      this.ctx.scale(scale, scale);
      this.ctx.fillText('Z', 0, 0);
      this.ctx.restore();
    }
    this.ctx.globalAlpha = 1;
  }

  setAction(action) {
    if (this.currentAction !== action) {
      this.currentAction = action;
      this.currentFrame = 0;
      this.frameTimer = 0;
    }
  }

  setFacing(right) {
    this.facingRight = right;
  }

  setAccessories(ids) {
    this.accessories = ids;
  }
}
