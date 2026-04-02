// status.js - Status Bar Display System

class StatusBar {
  constructor(container) {
    this.container = container;
    this.bars = {};
    this.lastStats = null;
    this.init();
  }

  init() {
    this.container.innerHTML = '';

    const barDefs = [
      { key: 'hunger', label: '饥饿', color: '#FF9800', icon: '🍖' },
      { key: 'happiness', label: '心情', color: '#E91E63', icon: '❤' },
      { key: 'energy', label: '体力', color: '#4CAF50', icon: '⚡' },
      { key: 'exp', label: '经验', color: '#9C27B0', icon: '★' },
    ];

    for (const def of barDefs) {
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `
        <span class="stat-icon">${def.icon}</span>
        <div class="stat-bar-bg">
          <div class="stat-bar-fill" data-key="${def.key}" style="background:${def.color};width:80%"></div>
        </div>
        <span class="stat-value" data-key="${def.key}">80</span>
      `;
      this.container.appendChild(row);
      this.bars[def.key] = {
        fill: row.querySelector(`.stat-bar-fill[data-key="${def.key}"]`),
        value: row.querySelector(`.stat-value[data-key="${def.key}"]`),
        color: def.color,
      };
    }

    // Level display
    const levelRow = document.createElement('div');
    levelRow.className = 'level-display';
    levelRow.innerHTML = `
      <span class="level-badge" id="level-badge">Lv.1</span>
      <span class="dragon-type" id="dragon-type-label">火龙</span>
    `;
    this.container.appendChild(levelRow);
  }

  update(stats) {
    if (!stats) return;

    // Avoid unnecessary DOM updates
    if (this.lastStats &&
        this.lastStats.hunger === stats.hunger &&
        this.lastStats.happiness === stats.happiness &&
        this.lastStats.energy === stats.energy &&
        this.lastStats.exp === stats.exp &&
        this.lastStats.level === stats.level) {
      return;
    }

    this.lastStats = { ...stats };

    // Update bars
    this.updateBar('hunger', stats.hunger, 100);
    this.updateBar('happiness', stats.happiness, 100);
    this.updateBar('energy', stats.energy, 100);
    this.updateBar('exp', stats.exp, stats.expToNext);

    // Update level
    const badge = document.getElementById('level-badge');
    if (badge) badge.textContent = `Lv.${stats.level}`;

    const typeLabel = document.getElementById('dragon-type-label');
    if (typeLabel) {
      const names = { fire: '火龙', ice: '冰龙', dark: '暗龙', gold: '金龙' };
      typeLabel.textContent = names[stats.dragonType] || '小龙';
    }

    // Color code low stats
    for (const key of ['hunger', 'happiness', 'energy']) {
      const bar = this.bars[key];
      if (!bar) continue;
      const val = stats[key];
      if (val < 20) {
        bar.fill.style.background = '#F44336';
        bar.fill.style.animation = 'pulse 1s infinite';
      } else if (val < 40) {
        bar.fill.style.background = '#FF9800';
        bar.fill.style.animation = '';
      } else {
        bar.fill.style.background = bar.color;
        bar.fill.style.animation = '';
      }
    }
  }

  updateBar(key, value, max) {
    const bar = this.bars[key];
    if (!bar) return;
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    bar.fill.style.width = pct + '%';
    bar.value.textContent = Math.round(value);
  }

  show() {
    this.container.style.display = 'flex';
  }

  hide() {
    this.container.style.display = 'none';
  }
}
