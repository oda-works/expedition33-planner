// Achievement Tracker module for Expedition 33 Planner
import { formatNumber, formatStat } from '../utils/formatters.js';

/**
 * Achievement Tracker class for monitoring player progress and unlocking achievements
 */
export class AchievementTracker {
  constructor(dataManager, storage) {
    this.dataManager = dataManager;
    this.storage = storage;
    this.achievements = {};
    this.userProgress = {};
    this.unlockedAchievements = new Set();
    this.categories = ['character', 'party', 'collection', 'combat', 'exploration', 'mastery', 'special'];
    this.currentFilter = 'all';
    this.currentSort = 'newest';
    this.currentView = 'grid';

    // Achievement definitions
    this.achievementDefinitions = this.initializeAchievements();

    // Bind methods
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleSortChange = this.handleSortChange.bind(this);
    this.handleViewChange = this.handleViewChange.bind(this);
    this.handleAchievementClick = this.handleAchievementClick.bind(this);
  }

  /**
   * Initialize the Achievement Tracker
   */
  async init() {
    try {
      this.loadUserProgress();
      this.setupEventListeners();
      this.registerProgressTrackers();
      this.renderTrackerInterface();
      this.checkAllAchievements();
    } catch (error) {
      console.error('Failed to initialize Achievement Tracker:', error);
    }
  }

  /**
   * Initialize achievement definitions
   */
  initializeAchievements() {
    return {
      // Character Achievements
      first_build: {
        id: 'first_build',
        category: 'character',
        name: 'Builder\'s First Step',
        description: 'Create your first character build',
        icon: '🔨',
        rarity: 'common',
        points: 10,
        hidden: false,
        condition: { type: 'build_created', target: 1 }
      },
      max_level_char: {
        id: 'max_level_char',
        category: 'character',
        name: 'Peak Performance',
        description: 'Reach maximum level with any character',
        icon: '⭐',
        rarity: 'epic',
        points: 50,
        hidden: false,
        condition: { type: 'character_max_level', target: 1 }
      },
      all_chars_built: {
        id: 'all_chars_built',
        category: 'character',
        name: 'Master Builder',
        description: 'Create builds for all available characters',
        icon: '🏗️',
        rarity: 'legendary',
        points: 100,
        hidden: false,
        condition: { type: 'builds_for_all_characters', target: 12 }
      },
      perfect_stats: {
        id: 'perfect_stats',
        category: 'character',
        name: 'Statistical Perfection',
        description: 'Achieve 99 in any stat',
        icon: '💯',
        rarity: 'rare',
        points: 30,
        hidden: false,
        condition: { type: 'stat_maxed', target: 99 }
      },

      // Party Achievements
      balanced_party: {
        id: 'balanced_party',
        category: 'party',
        name: 'Perfect Balance',
        description: 'Create a party with all four different roles',
        icon: '⚖️',
        rarity: 'rare',
        points: 25,
        hidden: false,
        condition: { type: 'party_role_diversity', target: 4 }
      },
      elemental_mastery: {
        id: 'elemental_mastery',
        category: 'party',
        name: 'Elemental Convergence',
        description: 'Create a party with 6 different elements',
        icon: '🌈',
        rarity: 'epic',
        points: 40,
        hidden: false,
        condition: { type: 'party_elemental_diversity', target: 6 }
      },
      synergy_master: {
        id: 'synergy_master',
        category: 'party',
        name: 'Synergy Master',
        description: 'Achieve 95+ synergy score with a party',
        icon: '🔗',
        rarity: 'legendary',
        points: 75,
        hidden: false,
        condition: { type: 'party_synergy_score', target: 95 }
      },

      // Collection Achievements
      first_picto: {
        id: 'first_picto',
        category: 'collection',
        name: 'Collector\'s Start',
        description: 'Equip your first Picto',
        icon: '🎴',
        rarity: 'common',
        points: 5,
        hidden: false,
        condition: { type: 'pictos_equipped', target: 1 }
      },
      legendary_collector: {
        id: 'legendary_collector',
        category: 'collection',
        name: 'Legendary Collector',
        description: 'Collect 10 legendary Pictos',
        icon: '🏆',
        rarity: 'epic',
        points: 60,
        hidden: false,
        condition: { type: 'legendary_pictos_collected', target: 10 }
      },
      completionist: {
        id: 'completionist',
        category: 'collection',
        name: 'The Completionist',
        description: 'Collect all available Pictos',
        icon: '📚',
        rarity: 'legendary',
        points: 150,
        hidden: false,
        condition: { type: 'all_pictos_collected', target: 193 }
      },
      journal_reader: {
        id: 'journal_reader',
        category: 'collection',
        name: 'Expedition Chronicler',
        description: 'Collect all expedition journals',
        icon: '📖',
        rarity: 'rare',
        points: 35,
        hidden: false,
        condition: { type: 'journals_collected', target: 49 }
      },
      music_lover: {
        id: 'music_lover',
        category: 'collection',
        name: 'Melody Master',
        description: 'Collect all music records',
        icon: '🎵',
        rarity: 'rare',
        points: 25,
        hidden: false,
        condition: { type: 'music_records_collected', target: 33 }
      },

      // Combat Achievements
      boss_slayer: {
        id: 'boss_slayer',
        category: 'combat',
        name: 'Boss Slayer',
        description: 'Defeat 10 different bosses',
        icon: '⚔️',
        rarity: 'rare',
        points: 40,
        hidden: false,
        condition: { type: 'bosses_defeated', target: 10 }
      },
      damage_dealer: {
        id: 'damage_dealer',
        category: 'combat',
        name: 'Damage Incarnate',
        description: 'Deal 100,000 damage in a single build calculation',
        icon: '💥',
        rarity: 'epic',
        points: 45,
        hidden: false,
        condition: { type: 'single_hit_damage', target: 100000 }
      },
      survivalist: {
        id: 'survivalist',
        category: 'combat',
        name: 'Unbreakable',
        description: 'Achieve 10,000 HP in a build',
        icon: '🛡️',
        rarity: 'rare',
        points: 30,
        hidden: false,
        condition: { type: 'max_hp_reached', target: 10000 }
      },

      // Exploration Achievements
      map_explorer: {
        id: 'map_explorer',
        category: 'exploration',
        name: 'Cartographer',
        description: 'Mark 50 locations on the map',
        icon: '🗺️',
        rarity: 'rare',
        points: 30,
        hidden: false,
        condition: { type: 'map_locations_marked', target: 50 }
      },
      treasure_hunter: {
        id: 'treasure_hunter',
        category: 'exploration',
        name: 'Treasure Hunter',
        description: 'Find all hidden collectibles',
        icon: '💎',
        rarity: 'legendary',
        points: 80,
        hidden: false,
        condition: { type: 'all_collectibles_found', target: 100 }
      },

      // Mastery Achievements
      build_optimizer: {
        id: 'build_optimizer',
        category: 'mastery',
        name: 'Optimization Expert',
        description: 'Use the build comparison tool 25 times',
        icon: '⚙️',
        rarity: 'uncommon',
        points: 20,
        hidden: false,
        condition: { type: 'build_comparisons_made', target: 25 }
      },
      team_strategist: {
        id: 'team_strategist',
        category: 'mastery',
        name: 'Master Strategist',
        description: 'Use the team optimizer 10 times',
        icon: '🧠',
        rarity: 'rare',
        points: 35,
        hidden: false,
        condition: { type: 'team_optimizations', target: 10 }
      },
      guide_reader: {
        id: 'guide_reader',
        category: 'mastery',
        name: 'Student of Strategy',
        description: 'View build guides for all characters',
        icon: '📋',
        rarity: 'uncommon',
        points: 25,
        hidden: false,
        condition: { type: 'guides_viewed', target: 12 }
      },
      calculator_expert: {
        id: 'calculator_expert',
        category: 'mastery',
        name: 'Number Cruncher',
        description: 'Use the damage calculator 100 times',
        icon: '🧮',
        rarity: 'uncommon',
        points: 15,
        hidden: false,
        condition: { type: 'damage_calculations', target: 100 }
      },

      // Special Achievements
      early_adopter: {
        id: 'early_adopter',
        category: 'special',
        name: 'Early Explorer',
        description: 'Use the planner in its first week',
        icon: '🚀',
        rarity: 'legendary',
        points: 200,
        hidden: true,
        condition: { type: 'early_usage', target: Date.now() + (7 * 24 * 60 * 60 * 1000) }
      },
      data_hoarder: {
        id: 'data_hoarder',
        category: 'special',
        name: 'Data Hoarder',
        description: 'Export data 50 times',
        icon: '💾',
        rarity: 'rare',
        points: 30,
        hidden: false,
        condition: { type: 'data_exports', target: 50 }
      },
      theme_switcher: {
        id: 'theme_switcher',
        category: 'special',
        name: 'Style Connoisseur',
        description: 'Switch themes 20 times',
        icon: '🎨',
        rarity: 'uncommon',
        points: 10,
        hidden: false,
        condition: { type: 'theme_switches', target: 20 }
      },
      perfectionist: {
        id: 'perfectionist',
        category: 'special',
        name: 'The Perfectionist',
        description: 'Unlock all other achievements',
        icon: '👑',
        rarity: 'legendary',
        points: 500,
        hidden: true,
        condition: { type: 'all_achievements', target: 'calculated' }
      }
    };
  }

  /**
   * Load user progress from storage
   */
  loadUserProgress() {
    const savedData = this.storage.loadData();
    this.userProgress = savedData.achievementProgress || this.initializeProgress();
    this.unlockedAchievements = new Set(savedData.unlockedAchievements || []);

    // Initialize progress tracking if not exists
    if (!this.userProgress.sessionStart) {
      this.userProgress.sessionStart = Date.now();
      this.saveProgress();
    }
  }

  /**
   * Initialize progress tracking structure
   */
  initializeProgress() {
    return {
      sessionStart: Date.now(),
      buildsCreated: 0,
      charactersBuilt: new Set(),
      maxLevelCharacters: 0,
      maxStatAchieved: 0,
      partiesCreated: 0,
      bestSynergyScore: 0,
      pictosEquipped: 0,
      legendaryPictosCollected: 0,
      allPictosCollected: 0,
      journalsCollected: 0,
      musicRecordsCollected: 0,
      bossesDefeated: new Set(),
      maxDamageDealt: 0,
      maxHPAchieved: 0,
      mapLocationsMarked: 0,
      collectiblesFound: 0,
      buildComparisons: 0,
      teamOptimizations: 0,
      guidesViewed: new Set(),
      damageCalculations: 0,
      dataExports: 0,
      themeSwitches: 0
    };
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    const container = document.getElementById('achievement-tracker');
    if (!container) return;

    container.addEventListener('change', (e) => {
      if (e.target.matches('#achievement-filter')) {
        this.handleFilterChange(e.target.value);
      } else if (e.target.matches('#achievement-sort')) {
        this.handleSortChange(e.target.value);
      } else if (e.target.matches('#achievement-view')) {
        this.handleViewChange(e.target.value);
      }
    });

    container.addEventListener('click', (e) => {
      if (e.target.matches('.achievement-card') || e.target.closest('.achievement-card')) {
        const card = e.target.closest('.achievement-card');
        this.handleAchievementClick(card.dataset.achievementId);
      } else if (e.target.matches('#export-achievements')) {
        this.exportAchievements();
      } else if (e.target.matches('#reset-achievements')) {
        this.resetAchievements();
      }
    });
  }

  /**
   * Register progress trackers for various app events
   */
  registerProgressTrackers() {
    // Listen for various app events to track progress
    window.addEventListener('buildCreated', (e) => {
      this.trackProgress('build_created', { characterId: e.detail.characterId });
    });

    window.addEventListener('partyUpdated', (e) => {
      this.trackProgress('party_updated', e.detail);
    });

    window.addEventListener('pictoEquipped', (e) => {
      this.trackProgress('picto_equipped', e.detail);
    });

    window.addEventListener('bossDefeated', (e) => {
      this.trackProgress('boss_defeated', { bossId: e.detail.bossId });
    });

    window.addEventListener('damageCalculated', (e) => {
      this.trackProgress('damage_calculated', { damage: e.detail.damage, hp: e.detail.hp });
    });

    window.addEventListener('buildComparison', () => {
      this.trackProgress('build_comparison_used');
    });

    window.addEventListener('teamOptimization', () => {
      this.trackProgress('team_optimization_used');
    });

    window.addEventListener('guideViewed', (e) => {
      this.trackProgress('guide_viewed', { characterId: e.detail.characterId });
    });

    window.addEventListener('dataExported', () => {
      this.trackProgress('data_exported');
    });

    window.addEventListener('themeChanged', () => {
      this.trackProgress('theme_changed');
    });

    window.addEventListener('collectibleFound', (e) => {
      this.trackProgress('collectible_found', e.detail);
    });

    window.addEventListener('mapLocationMarked', () => {
      this.trackProgress('map_location_marked');
    });
  }

  /**
   * Track progress for specific events
   */
  trackProgress(eventType, data = {}) {
    let progressUpdated = false;

    switch (eventType) {
      case 'build_created':
        this.userProgress.buildsCreated++;
        this.userProgress.charactersBuilt.add(data.characterId);
        progressUpdated = true;
        break;

      case 'party_updated':
        this.userProgress.partiesCreated++;
        if (data.synergyScore > this.userProgress.bestSynergyScore) {
          this.userProgress.bestSynergyScore = data.synergyScore;
        }
        progressUpdated = true;
        break;

      case 'picto_equipped':
        this.userProgress.pictosEquipped++;
        if (data.rarity === 'legendary') {
          this.userProgress.legendaryPictosCollected++;
        }
        progressUpdated = true;
        break;

      case 'boss_defeated':
        this.userProgress.bossesDefeated.add(data.bossId);
        progressUpdated = true;
        break;

      case 'damage_calculated':
        if (data.damage > this.userProgress.maxDamageDealt) {
          this.userProgress.maxDamageDealt = data.damage;
        }
        if (data.hp > this.userProgress.maxHPAchieved) {
          this.userProgress.maxHPAchieved = data.hp;
        }
        this.userProgress.damageCalculations++;
        progressUpdated = true;
        break;

      case 'build_comparison_used':
        this.userProgress.buildComparisons++;
        progressUpdated = true;
        break;

      case 'team_optimization_used':
        this.userProgress.teamOptimizations++;
        progressUpdated = true;
        break;

      case 'guide_viewed':
        this.userProgress.guidesViewed.add(data.characterId);
        progressUpdated = true;
        break;

      case 'data_exported':
        this.userProgress.dataExports++;
        progressUpdated = true;
        break;

      case 'theme_changed':
        this.userProgress.themeSwitches++;
        progressUpdated = true;
        break;

      case 'collectible_found':
        this.userProgress.collectiblesFound++;
        if (data.type === 'journal') {
          this.userProgress.journalsCollected++;
        } else if (data.type === 'music') {
          this.userProgress.musicRecordsCollected++;
        }
        progressUpdated = true;
        break;

      case 'map_location_marked':
        this.userProgress.mapLocationsMarked++;
        progressUpdated = true;
        break;
    }

    if (progressUpdated) {
      this.saveProgress();
      this.checkAllAchievements();
    }
  }

  /**
   * Check all achievements for completion
   */
  checkAllAchievements() {
    let newlyUnlocked = [];

    Object.values(this.achievementDefinitions).forEach(achievement => {
      if (!this.unlockedAchievements.has(achievement.id)) {
        if (this.isAchievementUnlocked(achievement)) {
          this.unlockAchievement(achievement);
          newlyUnlocked.push(achievement);
        }
      }
    });

    if (newlyUnlocked.length > 0) {
      this.showAchievementNotifications(newlyUnlocked);
      this.updateDisplay();
    }
  }

  /**
   * Check if specific achievement is unlocked
   */
  isAchievementUnlocked(achievement) {
    const condition = achievement.condition;

    switch (condition.type) {
      case 'build_created':
        return this.userProgress.buildsCreated >= condition.target;

      case 'character_max_level':
        return this.userProgress.maxLevelCharacters >= condition.target;

      case 'builds_for_all_characters':
        return this.userProgress.charactersBuilt.size >= condition.target;

      case 'stat_maxed':
        return this.userProgress.maxStatAchieved >= condition.target;

      case 'party_role_diversity':
      case 'party_elemental_diversity':
        return this.checkPartyDiversity(condition);

      case 'party_synergy_score':
        return this.userProgress.bestSynergyScore >= condition.target;

      case 'pictos_equipped':
        return this.userProgress.pictosEquipped >= condition.target;

      case 'legendary_pictos_collected':
        return this.userProgress.legendaryPictosCollected >= condition.target;

      case 'all_pictos_collected':
        return this.userProgress.allPictosCollected >= condition.target;

      case 'journals_collected':
        return this.userProgress.journalsCollected >= condition.target;

      case 'music_records_collected':
        return this.userProgress.musicRecordsCollected >= condition.target;

      case 'bosses_defeated':
        return this.userProgress.bossesDefeated.size >= condition.target;

      case 'single_hit_damage':
        return this.userProgress.maxDamageDealt >= condition.target;

      case 'max_hp_reached':
        return this.userProgress.maxHPAchieved >= condition.target;

      case 'map_locations_marked':
        return this.userProgress.mapLocationsMarked >= condition.target;

      case 'all_collectibles_found':
        return this.userProgress.collectiblesFound >= condition.target;

      case 'build_comparisons_made':
        return this.userProgress.buildComparisons >= condition.target;

      case 'team_optimizations':
        return this.userProgress.teamOptimizations >= condition.target;

      case 'guides_viewed':
        return this.userProgress.guidesViewed.size >= condition.target;

      case 'damage_calculations':
        return this.userProgress.damageCalculations >= condition.target;

      case 'early_usage':
        return this.userProgress.sessionStart < condition.target;

      case 'data_exports':
        return this.userProgress.dataExports >= condition.target;

      case 'theme_switches':
        return this.userProgress.themeSwitches >= condition.target;

      case 'all_achievements':
        return this.unlockedAchievements.size >= (Object.keys(this.achievementDefinitions).length - 1);

      default:
        return false;
    }
  }

  /**
   * Check party diversity achievements
   */
  checkPartyDiversity(condition) {
    // This would need integration with party data
    // For now, return based on simple progress tracking
    return this.userProgress.partiesCreated >= Math.floor(condition.target / 2);
  }

  /**
   * Unlock achievement
   */
  unlockAchievement(achievement) {
    this.unlockedAchievements.add(achievement.id);

    // Add unlock timestamp
    if (!this.userProgress.unlockTimestamps) {
      this.userProgress.unlockTimestamps = {};
    }
    this.userProgress.unlockTimestamps[achievement.id] = Date.now();

    this.saveProgress();
  }

  /**
   * Show achievement notifications
   */
  showAchievementNotifications(achievements) {
    achievements.forEach(achievement => {
      this.showAchievementNotification(achievement);
    });
  }

  /**
   * Show single achievement notification
   */
  showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = `achievement-notification ${achievement.rarity}`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">${achievement.icon}</div>
        <div class="notification-text">
          <div class="notification-title">Achievement Unlocked!</div>
          <div class="notification-name">${achievement.name}</div>
          <div class="notification-points">+${achievement.points} points</div>
        </div>
      </div>
    `;

    // Add to notification container or body
    const container = document.getElementById('achievement-notifications') || document.body;
    container.appendChild(notification);

    // Auto-remove after delay
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);

    // Play sound effect (if available)
    this.playAchievementSound(achievement.rarity);

    // Show toast message
    if (window.app && window.app.showToast) {
      window.app.showToast(`🏆 Achievement Unlocked: ${achievement.name}`, 'achievement');
    }
  }

  /**
   * Play achievement sound
   */
  playAchievementSound(rarity) {
    // Audio implementation would go here
    // Different sounds for different rarities
  }

  /**
   * Handle filter changes
   */
  handleFilterChange(newFilter) {
    this.currentFilter = newFilter;
    this.renderAchievementsList();
  }

  /**
   * Handle sort changes
   */
  handleSortChange(newSort) {
    this.currentSort = newSort;
    this.renderAchievementsList();
  }

  /**
   * Handle view changes
   */
  handleViewChange(newView) {
    this.currentView = newView;
    this.renderAchievementsList();
  }

  /**
   * Handle achievement click
   */
  handleAchievementClick(achievementId) {
    const achievement = this.achievementDefinitions[achievementId];
    if (achievement) {
      this.showAchievementDetails(achievement);
    }
  }

  /**
   * Show achievement details modal
   */
  showAchievementDetails(achievement) {
    const isUnlocked = this.unlockedAchievements.has(achievement.id);
    const progress = this.getAchievementProgress(achievement);
    const unlockDate = this.userProgress.unlockTimestamps?.[achievement.id];

    const modalContent = document.createElement('div');
    modalContent.className = 'achievement-details-modal';

    modalContent.innerHTML = `
      <div class="achievement-detail-header">
        <div class="achievement-icon-large ${achievement.rarity} ${isUnlocked ? 'unlocked' : 'locked'}">
          ${achievement.icon}
        </div>
        <div class="achievement-info">
          <h3>${achievement.name}</h3>
          <p class="achievement-description">${achievement.description}</p>
          <div class="achievement-meta">
            <span class="achievement-rarity ${achievement.rarity}">${this.formatRarity(achievement.rarity)}</span>
            <span class="achievement-points">${achievement.points} points</span>
            <span class="achievement-category">${this.formatCategory(achievement.category)}</span>
          </div>
        </div>
      </div>

      <div class="achievement-progress-detail">
        <h4>Progress</h4>
        <div class="progress-info">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min(100, (progress.current / progress.target) * 100)}%"></div>
          </div>
          <div class="progress-text">
            ${progress.current} / ${progress.target}
          </div>
        </div>
        ${progress.description ? `<p class="progress-description">${progress.description}</p>` : ''}
      </div>

      ${isUnlocked ? `
        <div class="achievement-unlock-info">
          <h4>Unlocked</h4>
          <p class="unlock-date">${new Date(unlockDate).toLocaleDateString()}</p>
        </div>
      ` : ''}

      ${this.getAchievementTips(achievement)}
    `;

    if (window.app && window.app.showModal) {
      window.app.showModal('Achievement Details', modalContent);
    }
  }

  /**
   * Get achievement progress
   */
  getAchievementProgress(achievement) {
    const condition = achievement.condition;
    let current = 0;
    let target = condition.target;
    let description = '';

    switch (condition.type) {
      case 'build_created':
        current = this.userProgress.buildsCreated;
        description = 'Character builds created';
        break;

      case 'builds_for_all_characters':
        current = this.userProgress.charactersBuilt.size;
        description = 'Different characters with builds';
        break;

      case 'party_synergy_score':
        current = this.userProgress.bestSynergyScore;
        description = 'Highest synergy score achieved';
        break;

      case 'pictos_equipped':
        current = this.userProgress.pictosEquipped;
        description = 'Pictos equipped total';
        break;

      case 'legendary_pictos_collected':
        current = this.userProgress.legendaryPictosCollected;
        description = 'Legendary Pictos collected';
        break;

      case 'bosses_defeated':
        current = this.userProgress.bossesDefeated.size;
        description = 'Different bosses defeated';
        break;

      case 'build_comparisons_made':
        current = this.userProgress.buildComparisons;
        description = 'Build comparisons performed';
        break;

      case 'guides_viewed':
        current = this.userProgress.guidesViewed.size;
        description = 'Character guides viewed';
        break;

      default:
        current = 0;
        description = 'Progress towards achievement';
    }

    if (condition.type === 'all_achievements') {
      target = Object.keys(this.achievementDefinitions).length - 1;
      current = this.unlockedAchievements.size;
      description = 'Other achievements unlocked';
    }

    return { current, target, description };
  }

  /**
   * Get achievement tips
   */
  getAchievementTips(achievement) {
    const tips = {
      first_build: 'Go to the Characters tab and create a build for any character.',
      max_level_char: 'Level a character to 99 using the character builder.',
      all_chars_built: 'Create builds for all 12 available characters.',
      balanced_party: 'Create a party with Attacker, Tank, Support, and Hybrid roles.',
      elemental_mastery: 'Include characters with different elements in your party.',
      synergy_master: 'Use the Party Synergy analyzer to optimize team composition.',
      legendary_collector: 'Equip legendary Pictos to characters in your builds.',
      completionist: 'Mark all collectibles as found using the collectibles tracker.',
      boss_slayer: 'Mark bosses as defeated in the Boss Tracker.',
      build_optimizer: 'Use the Build Comparison tool to analyze different builds.',
      team_strategist: 'Use the Team Optimizer to generate optimal party compositions.',
      calculator_expert: 'Use the Damage Calculator to test different scenarios.'
    };

    const tip = tips[achievement.id];
    if (!tip) return '';

    return `
      <div class="achievement-tips">
        <h4>How to unlock</h4>
        <p class="tip-text">${tip}</p>
      </div>
    `;
  }

  /**
   * Render tracker interface
   */
  renderTrackerInterface() {
    const container = document.getElementById('achievement-tracker');
    if (!container) return;

    const totalAchievements = Object.keys(this.achievementDefinitions).length;
    const unlockedCount = this.unlockedAchievements.size;
    const totalPoints = this.calculateTotalPoints();
    const earnedPoints = this.calculateEarnedPoints();

    container.innerHTML = `
      <div class="tracker-container">
        <div class="tracker-header">
          <h3>Achievement Tracker</h3>
          <div class="tracker-stats">
            <div class="stat-item">
              <span class="stat-value">${unlockedCount}</span>
              <span class="stat-label">Unlocked</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${totalAchievements}</span>
              <span class="stat-label">Total</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${earnedPoints}</span>
              <span class="stat-label">Points</span>
            </div>
          </div>
        </div>

        <div class="tracker-progress">
          <div class="progress-bar-container">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${(unlockedCount / totalAchievements) * 100}%"></div>
            </div>
            <div class="progress-percentage">${Math.round((unlockedCount / totalAchievements) * 100)}%</div>
          </div>
        </div>

        <div class="tracker-controls">
          <div class="control-group">
            <label for="achievement-filter">Category:</label>
            <select id="achievement-filter" class="tracker-select">
              <option value="all">All Categories</option>
              <option value="character">Character</option>
              <option value="party">Party</option>
              <option value="collection">Collection</option>
              <option value="combat">Combat</option>
              <option value="exploration">Exploration</option>
              <option value="mastery">Mastery</option>
              <option value="special">Special</option>
            </select>
          </div>

          <div class="control-group">
            <label for="achievement-sort">Sort by:</label>
            <select id="achievement-sort" class="tracker-select">
              <option value="newest">Recently Unlocked</option>
              <option value="rarity">Rarity</option>
              <option value="points">Points</option>
              <option value="category">Category</option>
              <option value="progress">Progress</option>
            </select>
          </div>

          <div class="control-group">
            <label for="achievement-view">View:</label>
            <select id="achievement-view" class="tracker-select">
              <option value="grid">Grid</option>
              <option value="list">List</option>
              <option value="compact">Compact</option>
            </select>
          </div>

          <div class="control-actions">
            <button id="export-achievements" class="btn-secondary">Export</button>
            <button id="reset-achievements" class="btn-danger">Reset</button>
          </div>
        </div>

        <div id="achievements-list" class="achievements-list">
          <!-- Achievements will be rendered here -->
        </div>
      </div>

      <!-- Notification container -->
      <div id="achievement-notifications" class="achievement-notifications"></div>
    `;

    this.renderAchievementsList();
  }

  /**
   * Render achievements list
   */
  renderAchievementsList() {
    const container = document.getElementById('achievements-list');
    if (!container) return;

    let achievements = Object.values(this.achievementDefinitions);

    // Filter achievements
    if (this.currentFilter !== 'all') {
      achievements = achievements.filter(achievement =>
        achievement.category === this.currentFilter
      );
    }

    // Filter out hidden achievements that aren't unlocked
    achievements = achievements.filter(achievement =>
      !achievement.hidden || this.unlockedAchievements.has(achievement.id)
    );

    // Sort achievements
    achievements = this.sortAchievements(achievements);

    // Render based on view mode
    container.className = `achievements-list ${this.currentView}-view`;
    container.innerHTML = achievements.map(achievement =>
      this.renderAchievementCard(achievement)
    ).join('');
  }

  /**
   * Sort achievements
   */
  sortAchievements(achievements) {
    return achievements.sort((a, b) => {
      const aUnlocked = this.unlockedAchievements.has(a.id);
      const bUnlocked = this.unlockedAchievements.has(b.id);

      // Always show unlocked achievements first
      if (aUnlocked && !bUnlocked) return -1;
      if (bUnlocked && !aUnlocked) return 1;

      switch (this.currentSort) {
        case 'newest':
          if (aUnlocked && bUnlocked) {
            const aTime = this.userProgress.unlockTimestamps?.[a.id] || 0;
            const bTime = this.userProgress.unlockTimestamps?.[b.id] || 0;
            return bTime - aTime;
          }
          return 0;

        case 'rarity':
          const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];

        case 'points':
          return b.points - a.points;

        case 'category':
          return a.category.localeCompare(b.category);

        case 'progress':
          const aProgress = this.getAchievementProgress(a);
          const bProgress = this.getAchievementProgress(b);
          const aPercent = aProgress.current / aProgress.target;
          const bPercent = bProgress.current / bProgress.target;
          return bPercent - aPercent;

        default:
          return 0;
      }
    });
  }

  /**
   * Render achievement card
   */
  renderAchievementCard(achievement) {
    const isUnlocked = this.unlockedAchievements.has(achievement.id);
    const progress = this.getAchievementProgress(achievement);
    const progressPercent = Math.min(100, (progress.current / progress.target) * 100);

    return `
      <div class="achievement-card ${achievement.rarity} ${isUnlocked ? 'unlocked' : 'locked'}"
           data-achievement-id="${achievement.id}">
        <div class="achievement-icon">
          ${achievement.icon}
        </div>
        <div class="achievement-content">
          <div class="achievement-header">
            <h4 class="achievement-name">${achievement.name}</h4>
            <div class="achievement-meta">
              <span class="achievement-rarity">${this.formatRarity(achievement.rarity)}</span>
              <span class="achievement-points">${achievement.points}pt</span>
            </div>
          </div>
          <p class="achievement-description">${achievement.description}</p>

          ${!isUnlocked ? `
            <div class="achievement-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
              </div>
              <div class="progress-text">${progress.current}/${progress.target}</div>
            </div>
          ` : `
            <div class="achievement-unlocked">
              <span class="unlock-checkmark">✓</span>
              <span class="unlock-text">Unlocked</span>
            </div>
          `}
        </div>
      </div>
    `;
  }

  /**
   * Calculate total points available
   */
  calculateTotalPoints() {
    return Object.values(this.achievementDefinitions)
      .reduce((total, achievement) => total + achievement.points, 0);
  }

  /**
   * Calculate earned points
   */
  calculateEarnedPoints() {
    return Array.from(this.unlockedAchievements)
      .reduce((total, achievementId) => {
        const achievement = this.achievementDefinitions[achievementId];
        return total + (achievement ? achievement.points : 0);
      }, 0);
  }

  /**
   * Format rarity for display
   */
  formatRarity(rarity) {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  }

  /**
   * Format category for display
   */
  formatCategory(category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Update display
   */
  updateDisplay() {
    this.renderAchievementsList();
    this.updateTrackerStats();
  }

  /**
   * Update tracker stats
   */
  updateTrackerStats() {
    const container = document.querySelector('.tracker-stats');
    if (!container) return;

    const totalAchievements = Object.keys(this.achievementDefinitions).length;
    const unlockedCount = this.unlockedAchievements.size;
    const earnedPoints = this.calculateEarnedPoints();

    const statItems = container.querySelectorAll('.stat-value');
    if (statItems.length >= 3) {
      statItems[0].textContent = unlockedCount;
      statItems[1].textContent = totalAchievements;
      statItems[2].textContent = earnedPoints;
    }

    const progressFill = document.querySelector('.progress-bar-fill');
    const progressPercent = document.querySelector('.progress-percentage');
    if (progressFill && progressPercent) {
      const percentage = (unlockedCount / totalAchievements) * 100;
      progressFill.style.width = `${percentage}%`;
      progressPercent.textContent = `${Math.round(percentage)}%`;
    }
  }

  /**
   * Export achievements
   */
  exportAchievements() {
    const exportData = {
      achievements: Array.from(this.unlockedAchievements),
      progress: this.userProgress,
      exportDate: new Date().toISOString(),
      totalPoints: this.calculateEarnedPoints(),
      completionRate: (this.unlockedAchievements.size / Object.keys(this.achievementDefinitions).length) * 100
    };

    const dataStr = JSON.stringify(exportData, (key, value) => {
      // Convert Sets to arrays for JSON serialization
      if (value instanceof Set) {
        return Array.from(value);
      }
      return value;
    }, 2);

    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `expedition33_achievements_${Date.now()}.json`;
    link.click();

    this.trackProgress('data_exported');
    this.showToast('Achievements exported successfully!', 'success');
  }

  /**
   * Reset achievements
   */
  resetAchievements() {
    if (confirm('Are you sure you want to reset all achievement progress? This cannot be undone.')) {
      this.unlockedAchievements.clear();
      this.userProgress = this.initializeProgress();
      this.saveProgress();
      this.updateDisplay();
      this.showToast('All achievements have been reset.', 'info');
    }
  }

  /**
   * Save progress to storage
   */
  saveProgress() {
    const data = this.storage.loadData();

    // Convert Sets to arrays for storage
    const progressToSave = { ...this.userProgress };
    Object.keys(progressToSave).forEach(key => {
      if (progressToSave[key] instanceof Set) {
        progressToSave[key] = Array.from(progressToSave[key]);
      }
    });

    data.achievementProgress = progressToSave;
    data.unlockedAchievements = Array.from(this.unlockedAchievements);
    this.storage.saveData(data);
  }

  /**
   * Show toast message
   */
  showToast(message, type = 'info') {
    if (window.app && window.app.showToast) {
      window.app.showToast(message, type);
    }
  }

  /**
   * Public methods for integration
   */
  refresh() {
    this.loadUserProgress();
    this.checkAllAchievements();
    this.updateDisplay();
  }

  onActivate() {
    this.refresh();
  }

  hasUnsavedChanges() {
    return false; // Progress is auto-saved
  }

  /**
   * Manual achievement unlock (for testing)
   */
  debugUnlockAchievement(achievementId) {
    if (this.achievementDefinitions[achievementId]) {
      this.unlockAchievement(this.achievementDefinitions[achievementId]);
      this.showAchievementNotification(this.achievementDefinitions[achievementId]);
      this.updateDisplay();
    }
  }

  /**
   * Get achievement statistics
   */
  getStatistics() {
    const total = Object.keys(this.achievementDefinitions).length;
    const unlocked = this.unlockedAchievements.size;
    const points = this.calculateEarnedPoints();

    const rarityStats = {};
    const categoryStats = {};

    Object.values(this.achievementDefinitions).forEach(achievement => {
      const isUnlocked = this.unlockedAchievements.has(achievement.id);

      rarityStats[achievement.rarity] = rarityStats[achievement.rarity] || { total: 0, unlocked: 0 };
      rarityStats[achievement.rarity].total++;
      if (isUnlocked) rarityStats[achievement.rarity].unlocked++;

      categoryStats[achievement.category] = categoryStats[achievement.category] || { total: 0, unlocked: 0 };
      categoryStats[achievement.category].total++;
      if (isUnlocked) categoryStats[achievement.category].unlocked++;
    });

    return {
      total,
      unlocked,
      points,
      completionRate: (unlocked / total) * 100,
      rarityBreakdown: rarityStats,
      categoryBreakdown: categoryStats,
      recentUnlocks: this.getRecentUnlocks(5)
    };
  }

  /**
   * Get recent unlocks
   */
  getRecentUnlocks(limit = 5) {
    if (!this.userProgress.unlockTimestamps) return [];

    return Object.entries(this.userProgress.unlockTimestamps)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id, timestamp]) => ({
        achievement: this.achievementDefinitions[id],
        timestamp
      }));
  }
}