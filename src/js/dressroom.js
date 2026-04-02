// dressroom.js - Dress-up / Accessory System

class DressRoom {
  constructor(pet, renderer) {
    this.pet = pet;
    this.renderer = renderer;
    this.overlay = document.getElementById('dressroom-overlay');
    this.grid = document.getElementById('accessory-grid');
    this.equippedList = document.getElementById('equipped-list');
    this.preview = document.getElementById('dressroom-preview');

    this.init();
  }

  init() {
    const closeBtn = document.getElementById('dressroom-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    this.renderGrid();
    this.renderEquipped();
  }

  show() {
    this.overlay.style.display = 'flex';
    this.renderGrid();
    this.renderEquipped();

    // Resize window
    if (window.__TAURI__) {
      const { getCurrentWindow } = window.__TAURI__.window;
      const { LogicalSize } = window.__TAURI__.window;
      try {
        getCurrentWindow().setSize(new LogicalSize(600, 500));
      } catch (e) {}
    }
  }

  close() {
    this.overlay.style.display = 'none';

    // Reset window
    if (window.__TAURI__) {
      const { getCurrentWindow } = window.__TAURI__.window;
      const { LogicalSize } = window.__TAURI__.window;
      try {
        getCurrentWindow().setSize(new LogicalSize(200, 200));
      } catch (e) {}
    }
  }

  renderGrid() {
    if (!this.grid) return;
    this.grid.innerHTML = '';

    const categories = {
      '帽子': ['crown', 'wizard_hat', 'cowboy_hat', 'flower_crown'],
      '围巾': ['red_scarf', 'rainbow_scarf'],
      '背饰': ['butterfly_wings', 'rocket_pack', 'cape'],
    };

    for (const [cat, items] of Object.entries(categories)) {
      const header = document.createElement('div');
      header.className = 'category-header';
      header.textContent = cat;
      this.grid.appendChild(header);

      for (const id of items) {
        const acc = ACCESSORIES[id];
        if (!acc) continue;

        const unlocked = this.pet.unlockedAccessories.includes(id);
        const equipped = this.pet.equippedAccessories.includes(id);

        const card = document.createElement('div');
        card.className = `accessory-card ${unlocked ? 'unlocked' : 'locked'} ${equipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="acc-preview">${unlocked ? this.getAccEmoji(id) : '🔒'}</div>
          <div class="acc-name">${unlocked ? acc.name : '???'}</div>
          ${equipped ? '<div class="acc-badge">已装备</div>' : ''}
        `;

        if (unlocked) {
          card.addEventListener('click', () => this.toggleEquip(id));
        }

        this.grid.appendChild(card);
      }
    }
  }

  getAccEmoji(id) {
    const emojis = {
      crown: '👑', wizard_hat: '🧙', cowboy_hat: '🤠', flower_crown: '🌸',
      red_scarf: '🧣', rainbow_scarf: '🌈',
      butterfly_wings: '🦋', rocket_pack: '🚀', cape: '🦸',
    };
    return emojis[id] || '✨';
  }

  renderEquipped() {
    if (!this.equippedList) return;
    this.equippedList.innerHTML = '';

    if (this.pet.equippedAccessories.length === 0) {
      this.equippedList.innerHTML = '<div class="empty-equipped">暂未装备任何配件</div>';
      return;
    }

    for (const id of this.pet.equippedAccessories) {
      const acc = ACCESSORIES[id];
      if (!acc) continue;

      const item = document.createElement('div');
      item.className = 'equipped-item';
      item.innerHTML = `
        <span>${this.getAccEmoji(id)} ${acc.name}</span>
        <button class="unequip-btn" data-id="${id}">卸下</button>
      `;
      item.querySelector('.unequip-btn').addEventListener('click', () => {
        this.unequip(id);
      });
      this.equippedList.appendChild(item);
    }
  }

  toggleEquip(id) {
    const idx = this.pet.equippedAccessories.indexOf(id);
    if (idx >= 0) {
      this.pet.equippedAccessories.splice(idx, 1);
    } else {
      // Limit to 2 accessories
      if (this.pet.equippedAccessories.length >= 2) {
        this.pet.equippedAccessories.shift();
      }
      this.pet.equippedAccessories.push(id);
    }

    // Update renderer
    this.renderer.setAccessories(this.pet.equippedAccessories);

    // Re-render UI
    this.renderGrid();
    this.renderEquipped();
  }

  unequip(id) {
    const idx = this.pet.equippedAccessories.indexOf(id);
    if (idx >= 0) {
      this.pet.equippedAccessories.splice(idx, 1);
    }
    this.renderer.setAccessories(this.pet.equippedAccessories);
    this.renderGrid();
    this.renderEquipped();
  }

  unlockAccessory(id) {
    if (!this.pet.unlockedAccessories.includes(id)) {
      this.pet.unlockedAccessories.push(id);
    }
  }
}
