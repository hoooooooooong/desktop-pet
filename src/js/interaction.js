// interaction.js - Drag, Click, Context Menu, Bubbles

class InteractionManager {
  constructor(canvas, pet, renderer) {
    this.canvas = canvas;
    this.pet = pet;
    this.renderer = renderer;

    this.dragStartX = 0;
    this.dragStartY = 0;
    this.clickStartTime = 0;
    this.lastClickTime = 0;
    this.mouseDownFired = false;
    this.touchDownFired = false;

    this.contextMenu = document.getElementById('context-menu');

    this.init();
  }

  init() {
    const el = this.canvas;

    el.addEventListener('mousedown', (e) => this.onMouseDown(e));
    el.addEventListener('mouseup', (e) => this.onMouseUp(e));
    el.addEventListener('dblclick', (e) => {
      // Prevent the double-click from reaching the OS-level drag-region logic
      // This is a key trick to stop "maximize on double click"
      e.preventDefault();
      e.stopPropagation();
      this.onDoubleClick(e);
    }, true); // Use capture phase for maximum protection
    el.addEventListener('contextmenu', (e) => this.onContextMenu(e));

    el.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    el.addEventListener('touchend', (e) => this.onTouchEnd(e));

    // Close context menu on mousedown outside
    document.addEventListener('mousedown', (e) => {
      if (!this.contextMenu.contains(e.target)) {
        this.hideContextMenu();
      }
    });

    // Close context menu when window loses focus (e.g., clicking taskbar or other apps)
    window.addEventListener('blur', () => {
      this.hideContextMenu();
    });

    this.initMenuActions();

    // Initial resize to fit dragon and bubbles
    this.resizeWindow(200, 240);

    // Overlay close buttons
    const statsClose = document.getElementById('stats-close');
    if (statsClose) statsClose.addEventListener('click', () => {
      document.getElementById('stats-panel').style.display = 'none';
      this.resizeWindow(200, 240);
    });
  }

  resizeWindow(w, h) {
    if (window.__TAURI__) {
      const winAPI = window.__TAURI__.window;
      const LogicalSize = winAPI.LogicalSize;
      const win = (typeof winAPI.getCurrentWindow === 'function') ? winAPI.getCurrentWindow() : winAPI.appWindow;
      if (win) {
        try {
          win.setSize(new LogicalSize(w, h));
        } catch (e) {}
      }
    }
  }

  initMenuActions() {
    const actions = {
      'menu-feed': () => this.actionFeed(),
      'menu-play': () => this.actionPlay(),
      'menu-sleep': () => this.actionSleep(),
      'menu-fire': () => this.actionFire(),
      'menu-fly': () => this.actionFly(),
      'menu-stats': () => this.actionStats(),
    };

    for (const [id, fn] of Object.entries(actions)) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.hideContextMenu();
          fn();
        });
      }
    }
  }

  onMouseDown(e) {
    if (e.button === 0) {
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.clickStartTime = Date.now();
      this.mouseDownFired = true;
    }
  }

  onMouseUp(e) {
    if (e.button === 0 && this.mouseDownFired) {
      this.mouseDownFired = false;
      const elapsed = Date.now() - this.clickStartTime;
      const moved = Math.abs(e.clientX - this.dragStartX) + Math.abs(e.clientY - this.dragStartY);

      if (elapsed < 350 && moved < 6) {
        this.onPetClick(e);
      }
    }
  }

  onPetClick(e) {
    this.pet.pet();
    this.renderer.addParticle('heart');
    this.renderer.showEmote('❤️', 2000);
    this.renderer.showBubble(this.getRandomHappyText(), 2000);
  }

  onDoubleClick(e) {
    if (this.pet.breatheFire()) {
      this.renderer.addParticle('sparkle');
      this.renderer.showEmote('🔥', 2000);
      this.renderer.showBubble('看我的!', 2000);
    }
  }

  onContextMenu(e) {
    e.preventDefault();
    this.showContextMenu(e.clientX, e.clientY);
  }

  onTouchStart(e) {
    const touch = e.touches[0];
    this.dragStartX = touch.clientX;
    this.dragStartY = touch.clientY;
    this.clickStartTime = Date.now();
    this.touchDownFired = true;
  }

  onTouchEnd(e) {
    if (this.touchDownFired) {
      this.touchDownFired = false;
      const elapsed = Date.now() - this.clickStartTime;
      if (elapsed < 300) {
        this.onPetClick(e);
      }
    }
  }

  showContextMenu(x, y) {
    // With the new grid layout, the menu is much shorter and fits in the 200x200 window
    this.contextMenu.style.display = 'grid';
    const menuW = this.contextMenu.offsetWidth;
    const menuH = this.contextMenu.offsetHeight;
    
    // Position within the 200x200 window boundaries with a 5px safe margin
    const safeX = Math.max(5, Math.min(x, 200 - menuW - 10));
    const safeY = Math.max(5, Math.min(y, 200 - menuH - 10));
    
    this.contextMenu.style.left = safeX + 'px';
    this.contextMenu.style.top = safeY + 'px';
  }

  hideContextMenu() {
    this.contextMenu.style.display = 'none';
  }

  // === Menu Actions ===

  actionFeed() {
    if (this.pet.feed()) {
      this.renderer.addParticle('food');
      this.renderer.showEmote('🍖', 2500);
      this.renderer.showBubble('嗷呜! 好吃~', 2000);
    }
  }

  actionPlay() {
    if (this.pet.play()) {
      this.renderer.addParticle('sparkle');
      this.renderer.showEmote('🎮', 2500);
      this.renderer.showBubble('太棒了!', 2000);
    }
  }

  actionSleep() {
    this.pet.sleep();
    this.renderer.showEmote('💤', 3000);
    this.renderer.showBubble('晚安...', 2500);
  }

  actionFire() {
    if (this.pet.breatheFire()) {
      this.renderer.addParticle('sparkle');
      this.renderer.showEmote('🔥', 2500);
      this.renderer.showBubble('呼~~!', 2000);
    } else {
      this.renderer.showEmote('💦', 2000);
      this.renderer.showBubble('没火了...', 2000);
    }
  }

  actionFly() {
    if (this.pet.fly()) {
      this.renderer.showEmote('🦋', 2500);
      this.renderer.showBubble('飞喽!', 2000);
    } else {
      this.renderer.showEmote('💧', 2000);
      this.renderer.showBubble('飞不动了...', 2000);
    }
  }

  actionStats() {
    const panel = document.getElementById('stats-panel');
    const container = document.getElementById('stats-content');
    if (!panel || !container) return;

    this.resizeWindow(320, 350);
    const s = this.pet.getStats();
    const names = { fire: '火龙', ice: '冰龙', dark: '暗龙', gold: '金龙' };

    const bars = [
      { label: '🍖 饱食', value: s.hunger, color: '#FF9800' },
      { label: '❤ 心情', value: s.happiness, color: '#E91E63' },
      { label: '⚡ 体力', value: s.energy, color: '#4CAF50' },
      { label: '★ 经验', value: s.exp, color: '#9C27B0', max: s.expToNext },
    ];

    let html = `<div class="sp-info"><span class="sp-level">Lv.${s.level}</span><span class="sp-name">${this.pet.name}</span></div>`;
    for (const b of bars) {
      const max = b.max || 100;
      const pct = Math.min(100, (b.value / max) * 100);
      const clr = b.value < 20 ? '#F44336' : b.color;
      html += `<div class="sp-row">
        <span class="sp-label">${b.label}</span>
        <div class="sp-bar-bg"><div class="sp-bar-fill" style="background:${clr};width:${pct}%"></div></div>
        <span class="sp-val">${Math.round(b.value)}</span>
      </div>`;
    }
    container.innerHTML = html;
    panel.style.display = 'flex';
  }

  // === Bubble Texts ===

  getRandomHappyText() {
    const texts = ['好舒服~', '嘻嘻!', '最喜欢你啦!', '嘿嘿!', '❤'];
    return texts[Math.floor(Math.random() * texts.length)];
  }

  getHungryText() {
    const texts = ['肚子扁扁的...', '想吃好吃的!', '饿坏啦!', '咕~~'];
    return texts[Math.floor(Math.random() * texts.length)];
  }

  getSleepyText() {
    const texts = ['困困...', '呼噜...', '打个哈欠~', '想碎觉...'];
    return texts[Math.floor(Math.random() * texts.length)];
  }

  moveWindow(x, y) {
    if (window.__TAURI__) {
      // Use the Rust command via invoke - now with correct permissions in default.json
      window.__TAURI__.core.invoke('move_window', { x: Math.round(x), y: Math.round(y) })
        .catch(err => console.error('Tauri move_window failed:', err));
    }
  }

  handleStateEvent(newState, oldStateOrEvent) {
    if (oldStateOrEvent === 'hungry') {
      this.renderer.showEmote('🍕', 3000);
      this.renderer.showBubble(this.getHungryText(), 3000);
    } else if (newState === 'sleeping' && oldStateOrEvent !== 'sleeping') {
      this.renderer.showEmote('💤', 3000);
      this.renderer.showBubble('晚安安~', 2000);
    }

    // Random flight movement
    if (newState === 'flying' && oldStateOrEvent !== 'flying') {
      // Small delay to let the animation start
      setTimeout(() => {
        // Fallback to 1280x720 if availWidth/Height are not populated
        const screenW = window.screen.availWidth || 1280;
        const screenH = window.screen.availHeight || 720;
        
        // Calculate target coordinates
        // We leave 250px margin to keep the pet fully on screen
        const targetX = Math.floor(Math.random() * (screenW - 250));
        const targetY = Math.floor(Math.random() * (screenH - 250));
        
        this.moveWindow(targetX, targetY);
      }, 50);
    }
  }
}
