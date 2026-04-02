// persistence.js - Save/Load System using LocalStorage

const SAVE_KEY = 'desktop_pet_save';
const SAVE_INTERVAL = 30000; // 30s auto-save

class Persistence {
  constructor() {
    this.lastSave = 0;
    this.loginDays = 0;
    this.lastLoginDate = null;
    this.highScores = { fruit: 0, fly: 0 };
  }

  save(pet, achievements, minigame) {
    const data = {
      version: 1,
      pet: pet.serialize(),
      achievements: achievements.serialize(),
      highScores: minigame ? minigame.highScores : this.highScores,
      loginDays: this.loginDays,
      lastLoginDate: this.lastLoginDate,
      lastSaveTime: Date.now(),
    };

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      this.lastSave = Date.now();
    } catch (e) {
      console.error('Failed to save:', e);
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load:', e);
      return null;
    }
  }

  shouldAutoSave() {
    return Date.now() - this.lastSave >= SAVE_INTERVAL;
  }

  trackLogin() {
    const today = new Date().toDateString();
    if (this.lastLoginDate !== today) {
      this.loginDays++;
      this.lastLoginDate = today;
    }
  }

  getLoginStats() {
    return {
      loginDays: this.loginDays,
      lastLoginDate: this.lastLoginDate,
    };
  }

  resetSave() {
    localStorage.removeItem(SAVE_KEY);
  }
}
