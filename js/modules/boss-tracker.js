// Boss Tracker module for Expedition 33 Planner
import { formatNumber } from '../utils/formatters.js';

/**
 * Boss Tracker class for managing boss encounters and strategies
 */
export class BossTracker {
  constructor(dataManager, storage) {
    this.dataManager = dataManager;
    this.storage = storage;
    this.currentFilter = 'all';
    this.currentSort = 'story_order';
    this.showDefeated = true;
    this.defeatedBosses = {};
    this.bossesData = null;

    // Bind methods
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleSortChange = this.handleSortChange.bind(this);
    this.handleBossToggle = this.handleBossToggle.bind(this);
    this.handleBossInfo = this.handleBossInfo.bind(this);
  }

  /**
   * Initialize the Boss Tracker
   */
  async init() {
    try {
      this.loadBossesData();
      this.loadUserProgress();
      this.setupEventListeners();
      this.renderBossTracker();
    } catch (error) {
      console.error('Failed to initialize Boss Tracker:', error);
    }
  }

  /**
   * Load bosses data
   */
  loadBossesData() {
    this.bossesData = this.dataManager.getAllBosses();
    if (!this.bossesData) {
      console.warn('Bosses data not available');
    }
  }

  /**
   * Load user progress from storage
   */
  loadUserProgress() {
    const savedData = this.storage.loadData();
    this.defeatedBosses = savedData.defeatedBosses || {};
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    const container = document.getElementById('boss-tracker');
    if (!container) return;

    container.addEventListener('change', this.handleFilterChange);
    container.addEventListener('click', this.handleBossToggle);
    container.addEventListener('click', this.handleBossInfo);
  }

  /**
   * Handle filter changes
   */
  handleFilterChange(event) {
    if (event.target.matches('#boss-filter')) {
      this.currentFilter = event.target.value;
      this.renderBossList();
    } else if (event.target.matches('#boss-sort')) {
      this.currentSort = event.target.value;
      this.renderBossList();
    }
  }

  /**
   * Handle boss defeat toggle
   */
  handleBossToggle(event) {
    if (event.target.matches('.boss-toggle')) {
      const bossId = event.target.dataset.bossId;
      this.toggleBossDefeated(bossId);
    }
  }

  /**
   * Handle boss info display
   */
  handleBossInfo(event) {
    if (event.target.matches('.boss-info-btn')) {
      const bossId = event.target.dataset.bossId;
      this.showBossInfo(bossId);
    }
  }

  /**
   * Toggle boss defeated status
   */
  toggleBossDefeated(bossId) {
    this.defeatedBosses[bossId] = !this.defeatedBosses[bossId];
    this.saveUserProgress();
    this.renderBossList();

    const boss = this.bossesData[bossId];
    const status = this.defeatedBosses[bossId] ? 'defeated' : 'not defeated';
    this.showToast(`${boss.name} marked as ${status}`, 'success');
  }

  /**
   * Render the boss tracker interface
   */
  renderBossTracker() {
    const container = document.getElementById('boss-tracker');
    if (!container) return;

    const bossTypes = this.bossesData ? Object.keys(this.dataManager.gameData.bosses.bossTypes) : [];

    container.innerHTML = `
      <div class="boss-tracker-container">
        <div class="boss-header">
          <h3>Boss Encounter Tracker</h3>
          <div class="boss-stats">
            <span id="boss-progress">0/0 Defeated</span>
          </div>
        </div>

        <div class="boss-controls">
          <div class="filter-group">
            <label for="boss-filter">Filter by Type:</label>
            <select id="boss-filter" class="boss-control">
              <option value="all">All Bosses</option>
              ${bossTypes.map(type => `
                <option value="${type}">${this.dataManager.gameData.bosses.bossTypes[type].name}</option>
              `).join('')}
            </select>
          </div>

          <div class="filter-group">
            <label for="boss-sort">Sort by:</label>
            <select id="boss-sort" class="boss-control">
              <option value="story_order">Story Order</option>
              <option value="difficulty">Difficulty</option>
              <option value="name">Name</option>
              <option value="element">Element</option>
            </select>
          </div>
        </div>

        <div id="boss-list" class="boss-list">
          <!-- Boss list will be rendered here -->
        </div>
      </div>
    `;

    this.renderBossList();
    this.updateProgressCounter();
  }

  /**
   * Render the list of bosses
   */
  renderBossList() {
    const listContainer = document.getElementById('boss-list');
    if (!listContainer || !this.bossesData) return;

    const filteredBosses = this.getFilteredBosses();
    const sortedBosses = this.sortBosses(filteredBosses);

    listContainer.innerHTML = sortedBosses.map(boss => this.createBossCard(boss)).join('');
    this.updateProgressCounter();
  }

  /**
   * Get filtered bosses based on current filter
   */
  getFilteredBosses() {
    if (!this.bossesData) return [];

    let filtered = Object.values(this.bossesData);

    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(boss => boss.type === this.currentFilter);
    }

    return filtered;
  }

  /**
   * Sort bosses based on current sort criteria
   */
  sortBosses(bosses) {
    return bosses.sort((a, b) => {
      switch (this.currentSort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'difficulty':
          return (b.difficulty || 1) - (a.difficulty || 1);
        case 'element':
          return (a.element || 'none').localeCompare(b.element || 'none');
        case 'story_order':
        default:
          // Main story bosses first, then by difficulty
          if (a.type === 'main_story' && b.type !== 'main_story') return -1;
          if (b.type === 'main_story' && a.type !== 'main_story') return 1;
          return (a.difficulty || 1) - (b.difficulty || 1);
      }
    });
  }

  /**
   * Create boss card HTML
   */
  createBossCard(boss) {
    const isDefeated = this.defeatedBosses[boss.id] || false;
    const difficultyLevel = this.getDifficultyLevel(boss.difficulty);
    const rewards = Array.isArray(boss.rewards) ? boss.rewards : [];

    return `
      <div class="boss-card ${boss.type} ${isDefeated ? 'defeated' : ''}" data-boss-id="${boss.id}">
        <div class="boss-header">
          <div class="boss-image">
            <img src="${boss.image || 'assets/images/bosses/boss-placeholder.svg'}"
                 alt="${boss.name}"
                 onerror="this.src='assets/images/bosses/boss-placeholder.svg'">
          </div>
          <div class="boss-title">
            <h4>${boss.name}</h4>
            <div class="boss-meta">
              <span class="boss-type ${boss.type}">${this.getBossTypeName(boss.type)}</span>
              <span class="boss-difficulty ${difficultyLevel.class}">${difficultyLevel.name}</span>
            </div>
          </div>
          <div class="boss-actions">
            <button class="boss-toggle" data-boss-id="${boss.id}"
                    title="${isDefeated ? 'Mark as not defeated' : 'Mark as defeated'}">
              ${isDefeated ? '✓' : '○'}
            </button>
            <button class="boss-info-btn btn-secondary" data-boss-id="${boss.id}">
              Info
            </button>
          </div>
        </div>

        <div class="boss-details">
          <div class="boss-stats-row">
            <span class="stat-item">
              <strong>Location:</strong> ${boss.location || 'Unknown'}
            </span>
            <span class="stat-item">
              <strong>Element:</strong>
              <span class="element-tag ${boss.element}">${boss.element || 'None'}</span>
            </span>
            <span class="stat-item">
              <strong>HP:</strong> ${formatNumber(boss.hp || 0)}
            </span>
          </div>

          <div class="boss-weaknesses">
            <strong>Weaknesses:</strong>
            ${(boss.weaknesses || []).map(weakness => `
              <span class="weakness-tag ${weakness}">${weakness}</span>
            `).join('')}
            ${(boss.weaknesses || []).length === 0 ? '<span class="no-weaknesses">None</span>' : ''}
          </div>

          <div class="boss-description">
            <p>${boss.description || 'No description available.'}</p>
          </div>

          ${boss.strategy ? `
            <div class="boss-strategy">
              <strong>Strategy:</strong>
              <p>${boss.strategy}</p>
            </div>
          ` : ''}

          <div class="boss-rewards">
            <strong>Rewards:</strong>
            <div class="reward-list">
              ${rewards.map(reward => `<span class="reward-item">${reward}</span>`).join('')}
              ${rewards.length === 0 ? '<span class="no-rewards">No rewards listed</span>' : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get difficulty level information
   */
  getDifficultyLevel(difficulty) {
    const level = difficulty || 1;
    if (level <= 3) return { name: 'Easy', class: 'easy' };
    if (level <= 6) return { name: 'Medium', class: 'medium' };
    if (level <= 9) return { name: 'Hard', class: 'hard' };
    return { name: 'Extreme', class: 'extreme' };
  }

  /**
   * Get boss type display name
   */
  getBossTypeName(type) {
    const types = this.dataManager.gameData?.bosses?.bossTypes;
    return types?.[type]?.name || type;
  }

  /**
   * Show detailed boss information modal
   */
  showBossInfo(bossId) {
    const boss = this.bossesData[bossId];
    if (!boss) return;

    const modalContent = document.createElement('div');
    modalContent.className = 'boss-info-modal';

    modalContent.innerHTML = `
      <div class="boss-detailed-info">
        <div class="boss-header-detailed">
          <div class="boss-image-large">
            <img src="${boss.image || 'assets/images/bosses/boss-placeholder.svg'}"
                 alt="${boss.name}"
                 onerror="this.src='assets/images/bosses/boss-placeholder.svg'">
          </div>
          <div class="boss-info-text">
            <h3>${boss.name}</h3>
            <p class="boss-type">${this.getBossTypeName(boss.type)}</p>
            <p class="boss-location">${boss.location}</p>
          </div>
        </div>

        <div class="boss-stats-detailed">
          <div class="stat-grid">
            <div class="stat-box">
              <label>HP</label>
              <span>${formatNumber(boss.hp || 0)}</span>
            </div>
            <div class="stat-box">
              <label>Defense</label>
              <span>${boss.defense || 0}</span>
            </div>
            <div class="stat-box">
              <label>Difficulty</label>
              <span>${boss.difficulty || 1}/15</span>
            </div>
            <div class="stat-box">
              <label>Element</label>
              <span class="element-tag ${boss.element}">${boss.element || 'None'}</span>
            </div>
          </div>
        </div>

        <div class="combat-info">
          <div class="weaknesses-detailed">
            <h4>Weaknesses</h4>
            <div class="weakness-grid">
              ${(boss.weaknesses || []).map(weakness => `
                <div class="weakness-item ${weakness}">
                  <span class="weakness-icon"></span>
                  <span>${weakness}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="resistances-detailed">
            <h4>Resistances</h4>
            <div class="resistance-grid">
              ${(boss.resistances || []).map(resistance => `
                <div class="resistance-item ${resistance}">
                  <span class="resistance-icon"></span>
                  <span>${resistance}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="mechanics-info">
          <h4>Special Mechanics</h4>
          <ul class="mechanics-list">
            ${(boss.specialMechanics || []).map(mechanic => `
              <li>${mechanic}</li>
            `).join('')}
          </ul>
        </div>

        <div class="strategy-detailed">
          <h4>Strategy Guide</h4>
          <p>${boss.strategy || 'No specific strategy available. Use elemental weaknesses and avoid special attacks.'}</p>
        </div>

        <div class="rewards-detailed">
          <h4>Victory Rewards</h4>
          <div class="rewards-grid">
            ${(boss.rewards || []).map(reward => `
              <div class="reward-detailed">${reward}</div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.showModal(`${boss.name} - Boss Guide`, modalContent);
  }

  /**
   * Update progress counter
   */
  updateProgressCounter() {
    const progressElement = document.getElementById('boss-progress');
    if (!progressElement || !this.bossesData) return;

    const totalBosses = Object.keys(this.bossesData).length;
    const defeatedCount = Object.values(this.defeatedBosses).filter(Boolean).length;

    progressElement.textContent = `${defeatedCount}/${totalBosses} Defeated`;
  }

  /**
   * Save user progress
   */
  saveUserProgress() {
    const data = this.storage.loadData();
    data.defeatedBosses = this.defeatedBosses;
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
   * Show modal
   */
  showModal(title, content) {
    if (window.app && window.app.showModal) {
      window.app.showModal(title, content);
    }
  }

  /**
   * Refresh the tracker
   */
  refresh() {
    this.loadUserProgress();
    this.renderBossList();
  }

  /**
   * Called when tab becomes active
   */
  onActivate() {
    this.refresh();
  }

  /**
   * Check for unsaved changes
   */
  hasUnsavedChanges() {
    return false; // Auto-save is enabled
  }
}