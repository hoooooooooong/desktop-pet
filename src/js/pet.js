// pet.js - Pet State Machine & AI Behavior

const PetState = {
  IDLE: 'idle',
  WALKING: 'walking',
  SLEEPING: 'sleeping',
  EATING: 'eating',
  PLAYING: 'playing',
  FLYING: 'flying',
  FIRE_BREATHING: 'fire_breathing',
  HAPPY: 'happy',
};

const DRAGON_TYPES = {
  fire: { name: '火龙', bodyColor: '#4CAF50', unlockLevel: 1, special: 'fire', expBonus: 1.0 },
  ice: { name: '冰龙', bodyColor: '#42A5F5', unlockLevel: 2, special: 'ice', expBonus: 1.1 },
  dark: { name: '暗龙', bodyColor: '#7E57C2', unlockLevel: 3, special: 'dark', expBonus: 1.2 },
  gold: { name: '金龙', bodyColor: '#FFA000', unlockLevel: 4, special: 'gold', expBonus: 1.5 },
};

class Pet {
  constructor() {
    // Core stats
    this.hunger = 80;       // 0-100, higher = less hungry
    this.happiness = 80;    // 0-100
    this.energy = 100;      // 0-100
    this.exp = 0;           // experience points
    this.level = 1;         // current level

    // State
    this.state = PetState.IDLE;
    this.stateTimer = 0;    // ms remaining in current state
    this.stateStartTime = 0;

    // Pet info
    this.name = '小龙';
    this.dragonType = 'fire';
    this.unlockedTypes = ['fire'];

    // Equipment
    this.equippedAccessories = [];
    this.unlockedAccessories = [];

    // Walking direction
    this.walkDirection = 1; // 1 = right, -1 = left
    this.walkSpeed = 0.5;

    // AI
    this.aiInterval = 5000; // evaluate every 5s
    this.lastAiEval = 0;

    // Day/night
    this.timeOfDay = 'day';

    // Stats decay rates (per minute)
    this.hungerDecay = 1;
    this.happinessDecay = 0.5;
    this.energyDecay = 0.3;
    this.energyRecovery = 60; // 1 point per second (60 per minute) while sleeping

    // Interaction counters
    this.totalFeeds = 0;
    this.totalPlays = 0;
    this.totalPets = 0;
    this.totalFireBreaths = 0;

    // Level thresholds
    this.expTable = this.buildExpTable();

    // Callbacks
    this.onStateChange = null;
    this.onLevelUp = null;
    this.onAction = null;
  }

  buildExpTable() {
    const table = [];
    for (let i = 1; i <= 50; i++) {
      table.push(Math.floor(100 * Math.pow(1.5, i - 1)));
    }
    return table;
  }

  get expToNextLevel() {
    return this.expTable[Math.min(this.level - 1, this.expTable.length - 1)];
  }

  update(dt, now) {
    // Decay stats (dt in ms)
    const minutes = dt / 60000;

    if (this.state !== PetState.SLEEPING) {
      this.hunger = Math.max(0, this.hunger - this.hungerDecay * minutes);
      this.happiness = Math.max(0, this.happiness - this.happinessDecay * minutes);
      this.energy = Math.max(0, this.energy - this.energyDecay * minutes);
    } else {
      this.energy = Math.min(100, this.energy + this.energyRecovery * minutes);
      this.hunger = Math.max(0, this.hunger - this.hungerDecay * 0.5 * minutes);
    }

    // Update time of day
    this.updateTimeOfDay();

    // State timer
    this.stateTimer -= dt;
    if (this.stateTimer <= 0 && this.state !== PetState.SLEEPING) {
      // Return to idle after state expires
      if (this.state !== PetState.IDLE) {
        this.setState(PetState.IDLE);
      }
    }

    // Sleeping wake-up
    if (this.state === PetState.SLEEPING && this.energy >= 100) {
      this.setState(PetState.IDLE);
    }

    // AI evaluation
    if (now - this.lastAiEval >= this.aiInterval) {
      this.lastAiEval = now;
      this.evaluateAI();
    }

    // Notify stat change
    if (this.onStatChange) {
      this.onStatChange(this.getStats());
    }
  }

  updateTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 9) this.timeOfDay = 'morning';
    else if (hour >= 9 && hour < 18) this.timeOfDay = 'day';
    else if (hour >= 18 && hour < 20) this.timeOfDay = 'evening';
    else this.timeOfDay = 'night';
  }

  evaluateAI() {
    // Only AI-decide if in IDLE or WALKING (not user-triggered states)
    if (this.state !== PetState.IDLE && this.state !== PetState.WALKING) return;

    // Priority 1: Critical needs
    if (this.energy < 20) {
      this.setState(PetState.SLEEPING, 15000);
      return;
    }

    if (this.hunger < 20 && this.state !== PetState.EATING) {
      // Show hungry bubble but don't force eat (user should feed)
      if (this.onStateChange) {
        this.onStateChange(this.state, 'hungry');
      }
    }

    if (this.happiness < 30 && this.state !== PetState.PLAYING) {
      // Auto-play to recover
      const roll = Math.random();
      if (roll < 0.5) {
        this.setState(PetState.PLAYING, 4000);
        return;
      } else {
        this.setState(PetState.FLYING, 5000);
        return;
      }
    }

    // Priority 2: Night behavior
    if (this.timeOfDay === 'night' && this.energy < 60) {
      if (Math.random() < 0.6) {
        this.setState(PetState.SLEEPING, 20000);
        return;
      }
    }

    // Priority 3: Random behaviors
    const roll = Math.random();
    if (roll < 0.45) {
      this.setState(PetState.IDLE);
    } else if (roll < 0.75) {
      this.walkDirection = Math.random() < 0.5 ? 1 : -1;
      this.setState(PetState.WALKING, 3000 + Math.random() * 4000);
    } else if (roll < 0.85) {
      this.setState(PetState.FIRE_BREATHING, 3000);
    } else {
      this.setState(PetState.FLYING, 4000);
    }
  }

  setState(state, duration = 0) {
    const oldState = this.state;
    this.state = state;
    this.stateTimer = duration || this.getDefaultDuration(state);
    this.stateStartTime = Date.now();

    if (this.onStateChange) {
      this.onStateChange(state, oldState);
    }
  }

  getDefaultDuration(state) {
    const durations = {
      [PetState.IDLE]: 0,
      [PetState.WALKING]: 5000,
      [PetState.SLEEPING]: 0, // indefinite until energy full
      [PetState.EATING]: 3000,
      [PetState.PLAYING]: 4000,
      [PetState.FLYING]: 5000,
      [PetState.FIRE_BREATHING]: 3000,
      [PetState.HAPPY]: 3000,
    };
    return durations[state] || 0;
  }

  // User interactions
  feed() {
    if (this.state === PetState.SLEEPING) return false;
    this.hunger = Math.min(100, this.hunger + 25);
    this.addExp(10);
    this.totalFeeds++;
    this.setState(PetState.EATING, 3000);
    this.onAction?.('feed');
    return true;
  }

  play() {
    if (this.state === PetState.SLEEPING) {
      this.setState(PetState.IDLE); // wake up
    }
    this.happiness = Math.min(100, this.happiness + 20);
    this.energy = Math.max(0, this.energy - 10);
    this.addExp(15);
    this.totalPlays++;
    this.setState(PetState.PLAYING, 4000);
    this.onAction?.('play');
    return true;
  }

  pet() {
    if (this.state === PetState.SLEEPING) {
      // Gentle wake
      this.setState(PetState.IDLE);
    }
    this.happiness = Math.min(100, this.happiness + 5);
    this.addExp(5);
    this.totalPets++;
    this.setState(PetState.HAPPY, 2000);
    this.onAction?.('pet');
    return true;
  }

  sleep() {
    this.setState(PetState.SLEEPING, 0);
    this.onAction?.('sleep');
    return true;
  }

  breatheFire() {
    if (this.state === PetState.SLEEPING) return false;
    this.energy = Math.max(0, this.energy - 5);
    this.addExp(8);
    this.totalFireBreaths++;
    this.setState(PetState.FIRE_BREATHING, 3000);
    this.onAction?.('fire');
    return true;
  }

  fly() {
    if (this.state === PetState.SLEEPING) return false;
    if (this.energy < 15) return false;
    
    // Duration depends on energy: higher energy = flies more often/longer
    const duration = 4000 + (this.energy * 60); 
    
    this.energy = Math.max(0, this.energy - 15);
    this.happiness = Math.min(100, this.happiness + 15);
    this.addExp(12);
    this.setState(PetState.FLYING, duration);
    this.onAction?.('fly');
    return true;
  }

  addExp(amount) {
    const bonus = DRAGON_TYPES[this.dragonType]?.expBonus || 1.0;
    this.exp += Math.floor(amount * bonus);

    while (this.exp >= this.expToNextLevel && this.level < 50) {
      this.exp -= this.expToNextLevel;
      this.level++;
      this.onLevelUp?.(this.level);
    }
  }

  getActionForState() {
    const map = {
      [PetState.IDLE]: 'idle',
      [PetState.WALKING]: 'walk',
      [PetState.SLEEPING]: 'sleep',
      [PetState.EATING]: 'eat',
      [PetState.PLAYING]: 'play',
      [PetState.FLYING]: 'fly',
      [PetState.FIRE_BREATHING]: 'fire',
      [PetState.HAPPY]: 'happy',
    };
    return map[this.state] || 'idle';
  }

  getStats() {
    return {
      hunger: this.hunger,
      happiness: this.happiness,
      energy: this.energy,
      exp: this.exp,
      expToNext: this.expToNextLevel,
      level: this.level,
      state: this.state,
      dragonType: this.dragonType,
      timeOfDay: this.timeOfDay,
    };
  }

  serialize() {
    return {
      hunger: this.hunger,
      happiness: this.happiness,
      energy: this.energy,
      exp: this.exp,
      level: this.level,
      name: this.name,
      dragonType: this.dragonType,
      unlockedTypes: this.unlockedTypes,
      equippedAccessories: this.equippedAccessories,
      unlockedAccessories: this.unlockedAccessories,
      totalFeeds: this.totalFeeds,
      totalPlays: this.totalPlays,
      totalPets: this.totalPets,
      totalFireBreaths: this.totalFireBreaths,
      lastSaveTime: Date.now(),
    };
  }

  deserialize(data) {
    if (!data) return;

    this.hunger = data.hunger ?? 80;
    this.happiness = data.happiness ?? 80;
    this.energy = data.energy ?? 100;
    this.exp = data.exp ?? 0;
    this.level = data.level ?? 1;
    this.name = data.name ?? '小龙';
    this.dragonType = data.dragonType ?? 'fire';
    this.unlockedTypes = data.unlockedTypes ?? ['fire'];
    this.equippedAccessories = data.equippedAccessories ?? [];
    this.unlockedAccessories = data.unlockedAccessories ?? [];
    this.totalFeeds = data.totalFeeds ?? 0;
    this.totalPlays = data.totalPlays ?? 0;
    this.totalPets = data.totalPets ?? 0;
    this.totalFireBreaths = data.totalFireBreaths ?? 0;

    // Apply offline decay
    if (data.lastSaveTime) {
      const offlineMinutes = (Date.now() - data.lastSaveTime) / 60000;
      if (offlineMinutes > 1) {
        this.hunger = Math.max(0, this.hunger - this.hungerDecay * offlineMinutes);
        this.happiness = Math.max(0, this.happiness - this.happinessDecay * offlineMinutes);
        this.energy = Math.max(0, this.energy - this.energyDecay * offlineMinutes);
      }
    }
  }
}
