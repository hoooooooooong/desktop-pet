// main.js - Application Entry Point

let pet, renderer, interaction, minigame, dressroom, achievements, persistence;

function showConfirm(msg, onConfirm) {
  const overlay = document.getElementById('confirm-dialog');
  const msgEl = document.getElementById('confirm-msg');
  const okBtn = document.getElementById('confirm-ok');
  const cancelBtn = document.getElementById('confirm-cancel');

  msgEl.textContent = msg;
  overlay.style.display = 'flex';

  const cleanup = () => {
    overlay.style.display = 'none';
    okBtn.replaceWith(okBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
  };

  document.getElementById('confirm-ok').addEventListener('click', () => {
    cleanup();
    onConfirm();
  });
  document.getElementById('confirm-cancel').addEventListener('click', () => {
    cleanup();
  });
}

async function init() {
  persistence = new Persistence();
  persistence.trackLogin();

  pet = new Pet();

  const canvas = document.getElementById('pet-canvas');
  renderer = new Renderer(canvas);

  // Load save data
  const saveData = persistence.load();
  if (saveData) {
    pet.deserialize(saveData.pet);
    if (saveData.highScores) {
      window._savedHighScores = saveData.highScores;
    }
  }

  renderer.loadSprites(pet.dragonType);
  renderer.setAccessories(pet.equippedAccessories);

  // Achievements
  achievements = new AchievementSystem(pet);
  if (saveData && saveData.achievements) {
    achievements.deserialize(saveData.achievements);
  }
  window.achievements = achievements;

  // Interaction
  interaction = new InteractionManager(canvas, pet, renderer);

  // Pet callbacks
  pet.onStateChange = (newState, oldState) => {
    const action = pet.getActionForState();
    renderer.setAction(action);
    if (newState === 'walking') {
      renderer.setFacing(pet.walkDirection === 1);
    }
    interaction.handleStateEvent(newState, oldState);
  };

  pet.onAction = () => {
    achievements.checkAll(persistence.getLoginStats());
  };

  pet.onLevelUp = (level) => {
    renderer.showBubble('升级了! Lv.' + level, 3000);
    renderer.addParticle('sparkle');
    achievements.checkAll(persistence.getLoginStats());
  };

  pet.onStatChange = () => {
    // Stats now shown via right-click menu, no inline display
  };

  // Minigame
  minigame = new Minigame(pet, renderer);
  if (window._savedHighScores) {
    minigame.highScores = window._savedHighScores;
    delete window._savedHighScores;
  }
  window.minigame = minigame;

  // Dressroom
  dressroom = new DressRoom(pet, renderer);
  window.dressroom = dressroom;

  // Settings
  initSettings();

  // Initial state
  renderer.setAction(pet.getActionForState());
  achievements.checkAll(persistence.getLoginStats());

  // Game loop
  let lastTime = performance.now();
  function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    pet.update(dt, timestamp);
    renderer.render(timestamp);
    if (persistence.shouldAutoSave()) {
      persistence.save(pet, achievements, minigame);
    }
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);
}

function initSettings() {
  const typeSelect = document.getElementById('dragon-type-select');
  if (typeSelect) {
    const types = { fire: '火龙', ice: '冰龙', dark: '暗龙', gold: '金龙' };
    for (const [key, name] of Object.entries(types)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = name;
      if (key === pet.dragonType) opt.selected = true;
      if (!pet.unlockedTypes.includes(key)) {
        opt.disabled = true;
        opt.textContent += ' (Lv.' + DRAGON_TYPES[key].unlockLevel + '解锁)';
      }
      typeSelect.appendChild(opt);
    }
    typeSelect.addEventListener('change', (e) => {
      const type = e.target.value;
      if (pet.unlockedTypes.includes(type)) {
        pet.dragonType = type;
        renderer.loadSprites(type);
      }
    });
  }

  const nameInput = document.getElementById('pet-name-input');
  if (nameInput) {
    nameInput.value = pet.name;
    nameInput.addEventListener('change', (e) => {
      pet.name = e.target.value || '小龙';
    });
  }

  const resetBtn = document.getElementById('reset-save-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      showConfirm('确定要重置存档吗？\n所有数据将丢失！', () => {
        persistence.resetSave();
        location.reload();
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
