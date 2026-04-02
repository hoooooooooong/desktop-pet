// achievement.js - Achievement System

const ACHIEVEMENT_DEFS = [
  { id: 'first_pet', name: '初次相遇', desc: '第一次抚摸小龙', icon: '🤝', check: (p) => p.totalPets >= 1 },
  { id: 'first_feed', name: '开饭啦', desc: '第一次喂食', icon: '🍖', check: (p) => p.totalFeeds >= 1 },
  { id: 'first_play', name: '一起玩耍', desc: '第一次和小龙玩耍', icon: '🎮', check: (p) => p.totalPlays >= 1 },
  { id: 'level5', name: '成长中', desc: '小龙达到 5 级', icon: '⭐', check: (p) => p.level >= 5, reward: { unlock: 'ice', accessory: 'crown' } },
  { id: 'level10', name: '少年龙', desc: '小龙达到 10 级', icon: '🌟', check: (p) => p.level >= 10, reward: { unlock: 'dark', accessory: 'wizard_hat' } },
  { id: 'level20', name: '龙之大师', desc: '小龙达到 20 级', icon: '👑', check: (p) => p.level >= 20, reward: { unlock: 'gold', accessory: 'cape' } },
  { id: 'feed10', name: '美食家', desc: '累计喂食 10 次', icon: '🍗', check: (p) => p.totalFeeds >= 10, reward: { accessory: 'red_scarf' } },
  { id: 'feed50', name: '大胃王', desc: '累计喂食 50 次', icon: '🍔', check: (p) => p.totalFeeds >= 50, reward: { accessory: 'rainbow_scarf' } },
  { id: 'feed100', name: '饕餮盛宴', desc: '累计喂食 100 次', icon: '🎂', check: (p) => p.totalFeeds >= 100, reward: { accessory: 'cowboy_hat' } },
  { id: 'fire10', name: '烈焰吐息', desc: '喷火 10 次', icon: '🔥', check: (p) => p.totalFireBreaths >= 10, reward: { accessory: 'rocket_pack' } },
  { id: 'pet100', name: '亲密伙伴', desc: '抚摸 100 次', icon: '💕', check: (p) => p.totalPets >= 100, reward: { accessory: 'flower_crown' } },
  { id: 'play50', name: '游乐达人', desc: '玩耍 50 次', icon: '🎪', check: (p) => p.totalPlays >= 50, reward: { accessory: 'butterfly_wings' } },
  { id: 'fruit30', name: '水果达人', desc: '接水果游戏得分达到 30', icon: '🍎', check: (p, s) => (s.fruitHighScore || 0) >= 30 },
  { id: 'fly20', name: '空中飞龙', desc: '飞翔挑战得分达到 20', icon: '🦅', check: (p, s) => (s.flyHighScore || 0) >= 20 },
  { id: 'login7', name: '忠实伙伴', desc: '累计登录 7 天', icon: '📅', check: (p, s) => (s.loginDays || 0) >= 7 },
  { id: 'login30', name: '不离不弃', desc: '累计登录 30 天', icon: '🏆', check: (p, s) => (s.loginDays || 0) >= 30 },
];

class AchievementSystem {
  constructor(pet) {
    this.pet = pet;
    this.unlocked = []; // array of achievement IDs
    this.notifications = []; // pending notification queue
    this.notificationEl = document.getElementById('achievement-notification');
    this.displaying = false;
  }

  checkAll(stats) {
    for (const def of ACHIEVEMENT_DEFS) {
      if (this.unlocked.includes(def.id)) continue;
      if (def.check(this.pet, stats)) {
        this.unlock(def);
      }
    }
  }

  unlock(def) {
    this.unlocked.push(def.id);

    // Process rewards
    if (def.reward) {
      if (def.reward.unlock && !this.pet.unlockedTypes.includes(def.reward.unlock)) {
        this.pet.unlockedTypes.push(def.reward.unlock);
      }
      if (def.reward.accessory && window.dressroom) {
        window.dressroom.unlockAccessory(def.reward.accessory);
      }
    }

    // Queue notification
    this.notifications.push(def);
    if (!this.displaying) {
      this.showNextNotification();
    }
  }

  showNextNotification() {
    if (this.notifications.length === 0) {
      this.displaying = false;
      return;
    }

    this.displaying = true;
    const def = this.notifications.shift();
    const el = this.notificationEl;
    if (!el) { this.displaying = false; return; }

    el.innerHTML = `
      <div class="ach-icon">${def.icon}</div>
      <div class="ach-info">
        <div class="ach-title">🏆 成就解锁!</div>
        <div class="ach-name">${def.name}</div>
        <div class="ach-desc">${def.desc}</div>
      </div>
    `;
    el.classList.add('show');

    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => this.showNextNotification(), 300);
    }, 3000);
  }

  checkGameScore(gameType, score) {
    this.checkAll({
      fruitHighScore: gameType === 'fruit' ? score : undefined,
      flyHighScore: gameType === 'fly' ? score : undefined,
    });
  }

  serialize() {
    return { unlocked: this.unlocked };
  }

  deserialize(data) {
    if (data && data.unlocked) {
      this.unlocked = data.unlocked;
    }
  }
}
