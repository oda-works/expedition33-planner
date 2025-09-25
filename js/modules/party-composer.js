// Party Composer module for Expedition 33 Planner
import { GAME_CONSTANTS, ROLES, ELEMENTS } from '../utils/constants.js';
import { validateParty } from '../utils/validators.js';
import { formatStat, formatNumber, formatRole } from '../utils/formatters.js';

/**
 * Party Composer class for managing party composition and synergies
 */
export class PartyComposer {
  constructor(dataManager, storage) {
    this.dataManager = dataManager;
    this.storage = storage;
    this.currentParty = {
      active: [null, null, null],
      reserve: [null, null, null]
    };
    this.availableCharacters = [];
    this.partyStats = {};
    this.synergies = [];
    this.draggedCharacter = null;
    this.draggedFromSlot = null;

    // Methods will be bound automatically when called as arrow functions in event listeners
  }

  /**
   * Initialize the Party Composer
   */
  async init() {
    try {
      this.loadPartyData();
      this.setupEventListeners();
      this.renderCharacterPool();
      this.renderPartySlots();
      this.calculatePartyStats();
      this.analyzeSynergies();
      this.updateDisplay();
    } catch (error) {
      console.error('Failed to initialize Party Composer:', error);
    }
  }

  /**
   * Load party data from storage
   */
  loadPartyData() {
    const savedParty = this.storage.loadParty();
    this.currentParty = savedParty || {
      active: [null, null, null],
      reserve: [null, null, null]
    };

    // Load available characters
    const characters = this.dataManager.getAllCharacters();
    if (characters) {
      this.availableCharacters = Object.values(characters);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    const optimizeBtn = document.getElementById('optimize-party');
    const clearBtn = document.getElementById('clear-party');

    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', this.handleOptimizeParty);
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', this.handleClearParty);
    }

    // Set up drag and drop for party slots
    this.setupDragAndDrop();
  }

  /**
   * Set up drag and drop functionality
   */
  setupDragAndDrop() {
    const partySlots = document.querySelectorAll('.party-slot');
    const characterCards = document.querySelectorAll('.character-card');

    // Party slots as drop targets
    partySlots.forEach(slot => {
      slot.addEventListener('dragover', this.handleDragOver);
      slot.addEventListener('drop', this.handleDrop);
    });

    // Character cards as drag sources
    characterCards.forEach(card => {
      card.addEventListener('dragstart', this.handleDragStart);
      card.addEventListener('dragend', this.handleDragEnd);
    });
  }

  /**
   * Render character pool
   */
  renderCharacterPool() {
    const characterPool = document.getElementById('character-pool');
    if (!characterPool) return;

    characterPool.innerHTML = `
      <h3>Available Characters</h3>
      <div class="character-cards">
        ${this.availableCharacters.map(character => this.createCharacterCard(character)).join('')}
      </div>
    `;

    // Re-setup drag and drop after rendering
    setTimeout(() => this.setupDragAndDrop(), 100);
  }

  /**
   * Create character card HTML
   */
  createCharacterCard(character) {
    const isInParty = this.isCharacterInParty(character.id);
    const characterBuild = this.storage.loadCharacterBuild(character.id);
    const level = characterBuild?.level || 1;
    const stats = this.dataManager.calculateCharacterStats(character.id, level, characterBuild?.attributes || {});

    return `
      <div class="character-card ${isInParty ? 'in-party' : ''}"
           draggable="true"
           data-character-id="${character.id}">
        <div class="character-portrait">
          <div class="character-avatar">${character.name.charAt(0)}</div>
          <div class="character-level">Lv.${level}</div>
        </div>

        <div class="character-info">
          <h4>${character.name}</h4>
          <p class="character-role">${character.role}</p>
          <p class="character-element">${character.element}</p>

          ${stats ? `
            <div class="character-stats-preview">
              <span>HP: ${formatNumber(stats.hp)}</span>
              <span>ATK: ${formatNumber(stats.attack)}</span>
              <span>DEF: ${formatNumber(stats.defense)}</span>
              <span>SPD: ${formatNumber(stats.speed)}</span>
            </div>
          ` : ''}
        </div>

        <div class="character-actions">
          <button class="quick-add-btn" data-character-id="${character.id}" title="Quick add to active party">
            +
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Check if character is in party
   */
  isCharacterInParty(characterId) {
    return [...this.currentParty.active, ...this.currentParty.reserve].includes(characterId);
  }

  /**
   * Render party slots
   */
  renderPartySlots() {
    this.renderPartySection('active', 'Active Party');
    this.renderPartySection('reserve', 'Reserve Party');
  }

  /**
   * Render party section (active or reserve)
   */
  renderPartySection(sectionType, title) {
    const section = document.querySelector(`.${sectionType}-party`);
    if (!section) return;

    const partyArray = this.currentParty[sectionType];

    section.innerHTML = `
      <h3>${title}</h3>
      <div class="party-grid">
        ${partyArray.map((characterId, index) => this.createPartySlot(characterId, index, sectionType)).join('')}
      </div>
    `;
  }

  /**
   * Create party slot HTML
   */
  createPartySlot(characterId, slotIndex, slotType) {
    if (!characterId) {
      return `
        <div class="party-slot empty"
             data-slot="${slotIndex}"
             data-type="${slotType}">
          <div class="slot-placeholder">
            <span class="slot-icon">+</span>
            <span class="slot-text">Empty</span>
          </div>
        </div>
      `;
    }

    const character = this.dataManager.getCharacter(characterId);
    if (!character) return '';

    const characterBuild = this.storage.loadCharacterBuild(characterId);
    const level = characterBuild?.level || 1;
    const stats = this.dataManager.calculateCharacterStats(characterId, level, characterBuild?.attributes || {});

    return `
      <div class="party-slot filled"
           data-slot="${slotIndex}"
           data-type="${slotType}"
           data-character-id="${characterId}"
           draggable="true">

        <div class="party-character">
          <div class="character-portrait">
            <div class="character-avatar">${character.name.charAt(0)}</div>
            <div class="character-level">Lv.${level}</div>
          </div>

          <div class="character-details">
            <h5>${character.name}</h5>
            <p class="role">${character.role}</p>
            <p class="element">${character.element}</p>
          </div>

          ${stats ? `
            <div class="character-stats">
              <div class="stat">
                <span class="stat-label">HP</span>
                <span class="stat-value">${formatNumber(stats.hp)}</span>
              </div>
              <div class="stat">
                <span class="stat-label">ATK</span>
                <span class="stat-value">${formatNumber(stats.attack)}</span>
              </div>
              <div class="stat">
                <span class="stat-label">DEF</span>
                <span class="stat-value">${formatNumber(stats.defense)}</span>
              </div>
              <div class="stat">
                <span class="stat-label">SPD</span>
                <span class="stat-value">${formatNumber(stats.speed)}</span>
              </div>
            </div>
          ` : ''}

          <button class="remove-character-btn" data-character-id="${characterId}" data-slot="${slotIndex}" data-type="${slotType}">
            ×
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Handle drag start
   */
  handleDragStart(event) {
    const characterCard = event.target.closest('.character-card, .party-slot');
    if (!characterCard) return;

    const characterId = characterCard.dataset.characterId;
    if (!characterId) return;

    this.draggedCharacter = characterId;

    // If dragging from party slot, remember the source
    if (characterCard.classList.contains('party-slot')) {
      this.draggedFromSlot = {
        type: characterCard.dataset.type,
        index: parseInt(characterCard.dataset.slot)
      };
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', characterId);

    // Add visual feedback
    characterCard.classList.add('dragging');
  }

  /**
   * Handle drag over
   */
  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const partySlot = event.target.closest('.party-slot');
    if (partySlot) {
      partySlot.classList.add('drag-over');
    }
  }

  /**
   * Handle drop
   */
  handleDrop(event) {
    event.preventDefault();

    const partySlot = event.target.closest('.party-slot');
    if (!partySlot || !this.draggedCharacter) return;

    const targetSlotType = partySlot.dataset.type;
    const targetSlotIndex = parseInt(partySlot.dataset.slot);

    // Remove visual feedback
    partySlot.classList.remove('drag-over');

    // Perform the character placement
    this.placeCharacterInSlot(this.draggedCharacter, targetSlotType, targetSlotIndex);
  }

  /**
   * Handle drag end
   */
  handleDragEnd(event) {
    // Clean up visual feedback
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

    this.draggedCharacter = null;
    this.draggedFromSlot = null;
  }

  /**
   * Place character in party slot
   */
  placeCharacterInSlot(characterId, slotType, slotIndex) {
    // Remove character from current position if in party
    this.removeCharacterFromParty(characterId);

    // Check if target slot is occupied
    const currentOccupant = this.currentParty[slotType][slotIndex];

    if (currentOccupant) {
      // If dragging from a slot, swap characters
      if (this.draggedFromSlot) {
        this.currentParty[this.draggedFromSlot.type][this.draggedFromSlot.index] = currentOccupant;
      } else {
        // Find an empty slot for the displaced character
        this.findEmptySlotForCharacter(currentOccupant);
      }
    }

    // Place the new character
    this.currentParty[slotType][slotIndex] = characterId;

    // Update display and save
    this.saveParty();
    this.renderPartySlots();
    this.renderCharacterPool();
    this.calculatePartyStats();
    this.analyzeSynergies();
    this.updateDisplay();
  }

  /**
   * Remove character from party
   */
  removeCharacterFromParty(characterId) {
    // Remove from active party
    const activeIndex = this.currentParty.active.indexOf(characterId);
    if (activeIndex > -1) {
      this.currentParty.active[activeIndex] = null;
    }

    // Remove from reserve party
    const reserveIndex = this.currentParty.reserve.indexOf(characterId);
    if (reserveIndex > -1) {
      this.currentParty.reserve[reserveIndex] = null;
    }
  }

  /**
   * Find empty slot for displaced character
   */
  findEmptySlotForCharacter(characterId) {
    // Try reserve slots first
    for (let i = 0; i < this.currentParty.reserve.length; i++) {
      if (!this.currentParty.reserve[i]) {
        this.currentParty.reserve[i] = characterId;
        return;
      }
    }

    // If no reserve slots, try active slots
    for (let i = 0; i < this.currentParty.active.length; i++) {
      if (!this.currentParty.active[i]) {
        this.currentParty.active[i] = characterId;
        return;
      }
    }
  }

  /**
   * Calculate party statistics
   */
  calculatePartyStats() {
    const activeCharacters = this.currentParty.active.filter(id => id !== null);

    if (activeCharacters.length === 0) {
      this.partyStats = {};
      return;
    }

    let totalStats = {
      hp: 0,
      attack: 0,
      defense: 0,
      speed: 0,
      critRate: 0,
      critDamage: 0
    };

    let roleDistribution = {};
    let elementalCoverage = new Set();

    activeCharacters.forEach(characterId => {
      const character = this.dataManager.getCharacter(characterId);
      const characterBuild = this.storage.loadCharacterBuild(characterId);

      if (character && characterBuild) {
        const stats = this.dataManager.calculateCharacterStats(
          characterId,
          characterBuild.level,
          characterBuild.attributes
        );

        if (stats) {
          Object.keys(totalStats).forEach(stat => {
            totalStats[stat] += stats[stat] || 0;
          });
        }

        // Track roles and elements
        const role = this.categorizeRole(character.role);
        roleDistribution[role] = (roleDistribution[role] || 0) + 1;
        elementalCoverage.add(character.element);
      }
    });

    // Calculate averages
    const partySize = activeCharacters.length;
    const averageStats = {};
    Object.keys(totalStats).forEach(stat => {
      averageStats[stat] = totalStats[stat] / partySize;
    });

    this.partyStats = {
      total: totalStats,
      average: averageStats,
      size: partySize,
      roles: roleDistribution,
      elements: Array.from(elementalCoverage),
      turnOrder: this.calculateTurnOrder(activeCharacters)
    };
  }

  /**
   * Categorize character role for party analysis
   */
  categorizeRole(roleString) {
    const role = roleString.toLowerCase();

    if (role.includes('tank') || role.includes('engineer') || role.includes('guardian')) {
      return 'tank';
    }
    if (role.includes('dps') || role.includes('duelist') || role.includes('warrior')) {
      return 'dps';
    }
    if (role.includes('support') || role.includes('mage') || role.includes('scholar')) {
      return 'support';
    }
    if (role.includes('healer')) {
      return 'healer';
    }

    return 'utility';
  }

  /**
   * Calculate turn order based on speed
   */
  calculateTurnOrder(activeCharacters) {
    const characterSpeeds = [];

    activeCharacters.forEach(characterId => {
      const character = this.dataManager.getCharacter(characterId);
      const characterBuild = this.storage.loadCharacterBuild(characterId);

      if (character && characterBuild) {
        const stats = this.dataManager.calculateCharacterStats(
          characterId,
          characterBuild.level,
          characterBuild.attributes
        );

        if (stats) {
          characterSpeeds.push({
            name: character.name,
            speed: stats.speed || 0
          });
        }
      }
    });

    return characterSpeeds.sort((a, b) => b.speed - a.speed);
  }

  /**
   * Analyze party synergies
   */
  analyzeSynergies() {
    const activeCharacters = this.currentParty.active.filter(id => id !== null);
    this.synergies = [];

    if (activeCharacters.length < 2) return;

    // Role synergies
    this.analyzeRoleSynergies(activeCharacters);

    // Elemental synergies
    this.analyzeElementalSynergies(activeCharacters);

    // Character-specific synergies
    this.analyzeCharacterSynergies(activeCharacters);

    // Equipment synergies (if implemented)
    this.analyzeEquipmentSynergies(activeCharacters);
  }

  /**
   * Analyze role-based synergies
   */
  analyzeRoleSynergies(activeCharacters) {
    const roles = this.partyStats.roles || {};

    // Balanced party bonus
    if (roles.tank >= 1 && roles.dps >= 1 && roles.support >= 1) {
      this.synergies.push({
        name: 'Balanced Formation',
        type: 'role',
        strength: 8,
        description: 'Having Tank, DPS, and Support provides excellent tactical versatility.',
        bonus: '+15% to all party stats'
      });
    }

    // Double DPS synergy
    if (roles.dps >= 2) {
      this.synergies.push({
        name: 'Offensive Focus',
        type: 'role',
        strength: 6,
        description: 'Multiple DPS characters create devastating attack combinations.',
        bonus: '+25% critical hit rate, +20% attack damage'
      });
    }

    // Tank + Support synergy
    if (roles.tank >= 1 && roles.support >= 1) {
      this.synergies.push({
        name: 'Defensive Wall',
        type: 'role',
        strength: 7,
        description: 'Tank and Support combination provides exceptional survivability.',
        bonus: '+30% damage reduction, +50% healing effectiveness'
      });
    }
  }

  /**
   * Analyze elemental synergies
   */
  analyzeElementalSynergies(activeCharacters) {
    const elements = this.partyStats.elements || [];

    // Full elemental coverage
    if (elements.length >= 4) {
      this.synergies.push({
        name: 'Elemental Mastery',
        type: 'elemental',
        strength: 9,
        description: 'Diverse elemental coverage ensures no enemy resistances can stop you.',
        bonus: 'No enemy is resistant to party attacks, +20% elemental damage'
      });
    }

    // Dual element combinations
    if (elements.includes('Lightning') && elements.includes('Elemental')) {
      this.synergies.push({
        name: 'Storm Surge',
        type: 'elemental',
        strength: 7,
        description: 'Lightning and Elemental magic create devastating storm combinations.',
        bonus: 'Lightning abilities spread elemental effects, +30% area damage'
      });
    }

    if (elements.includes('Light') && elements.includes('Shadow')) {
      this.synergies.push({
        name: 'Twilight Balance',
        type: 'elemental',
        strength: 8,
        description: 'Light and Shadow elements create perfect magical equilibrium.',
        bonus: 'All status effects are enhanced, +25% magical potency'
      });
    }
  }

  /**
   * Analyze character-specific synergies
   */
  analyzeCharacterSynergies(activeCharacters) {
    // Gustave + Lune synergy
    if (activeCharacters.includes('gustave') && activeCharacters.includes('lune')) {
      this.synergies.push({
        name: 'Engineer & Scholar',
        type: 'character',
        strength: 8,
        description: 'Gustave and Lune combine technology with magic for unique effects.',
        bonus: 'Overcharge triggers enhance elemental stains, cross-skill combinations unlocked'
      });
    }

    // Maelle + Sciel synergy
    if (activeCharacters.includes('maelle') && activeCharacters.includes('sciel')) {
      this.synergies.push({
        name: 'Blade Masters',
        type: 'character',
        strength: 7,
        description: 'Two skilled weapon masters create fluid combo attacks.',
        bonus: 'Stance changes trigger party-wide bonuses, +20% combo damage'
      });
    }

    // Verso + Any character synergy (Expedition Zero knowledge)
    if (activeCharacters.includes('verso')) {
      this.synergies.push({
        name: 'Expedition Zero Intel',
        type: 'character',
        strength: 6,
        description: 'Verso shares valuable intelligence from Expedition Zero.',
        bonus: 'Party gains knowledge of enemy weaknesses, +15% damage to bosses'
      });
    }

    // Monoco + Multiple characters (Gestral adaptability)
    if (activeCharacters.includes('monoco') && activeCharacters.length >= 3) {
      this.synergies.push({
        name: 'Bestial Adaptation',
        type: 'character',
        strength: 7,
        description: 'Monoco adapts to party composition with complementary abilities.',
        bonus: 'Can copy one ability from each party member, skill variety increased'
      });
    }
  }

  /**
   * Analyze equipment synergies
   */
  analyzeEquipmentSynergies(activeCharacters) {
    // This would analyze weapon and Pictos combinations
    // For now, add placeholder synergies

    const weaponSynergies = [];
    activeCharacters.forEach(characterId => {
      const characterBuild = this.storage.loadCharacterBuild(characterId);
      if (characterBuild?.weapon) {
        weaponSynergies.push(characterBuild.weapon);
      }
    });

    if (weaponSynergies.length >= 3) {
      this.synergies.push({
        name: 'Weapon Mastery',
        type: 'equipment',
        strength: 6,
        description: 'All party members wielding signature weapons unlock special techniques.',
        bonus: 'Cross-character weapon techniques available, +10% all damage'
      });
    }
  }

  /**
   * Handle optimize party button
   */
  handleOptimizeParty() {
    // Simple optimization: balanced party with highest stats
    const characters = [...this.availableCharacters];

    // Sort by total stat power (simplified)
    characters.sort((a, b) => {
      const statsA = this.getCharacterPower(a.id);
      const statsB = this.getCharacterPower(b.id);
      return statsB - statsA;
    });

    // Try to create balanced party
    const optimizedParty = {
      active: [null, null, null],
      reserve: [null, null, null]
    };

    const roles = { tank: [], dps: [], support: [] };

    // Categorize characters by role
    characters.forEach(character => {
      const role = this.categorizeRole(character.role);
      if (roles[role]) {
        roles[role].push(character.id);
      } else {
        roles.support.push(character.id);
      }
    });

    // Fill active party with balanced roles
    let activeIndex = 0;

    // Add one of each role type
    if (roles.tank.length > 0 && activeIndex < 3) {
      optimizedParty.active[activeIndex++] = roles.tank[0];
    }
    if (roles.dps.length > 0 && activeIndex < 3) {
      optimizedParty.active[activeIndex++] = roles.dps[0];
    }
    if (roles.support.length > 0 && activeIndex < 3) {
      optimizedParty.active[activeIndex++] = roles.support[0];
    }

    // Fill remaining slots with best available
    const usedCharacters = new Set(optimizedParty.active.filter(id => id !== null));
    let reserveIndex = 0;

    characters.forEach(character => {
      if (!usedCharacters.has(character.id)) {
        if (activeIndex < 3) {
          optimizedParty.active[activeIndex++] = character.id;
        } else if (reserveIndex < 3) {
          optimizedParty.reserve[reserveIndex++] = character.id;
        }
        usedCharacters.add(character.id);
      }
    });

    // Apply optimized party
    this.currentParty = optimizedParty;
    this.saveParty();
    this.renderPartySlots();
    this.renderCharacterPool();
    this.calculatePartyStats();
    this.analyzeSynergies();
    this.updateDisplay();

    this.showToast('Party optimized for balanced roles and stats!', 'success');
  }

  /**
   * Get character power rating for optimization
   */
  getCharacterPower(characterId) {
    const characterBuild = this.storage.loadCharacterBuild(characterId);
    if (!characterBuild) return 0;

    const stats = this.dataManager.calculateCharacterStats(
      characterId,
      characterBuild.level,
      characterBuild.attributes
    );

    if (!stats) return 0;

    // Simple power calculation
    return (stats.hp * 0.1) + (stats.attack * 2) + (stats.defense * 1.5) + stats.speed;
  }

  /**
   * Handle clear party button
   */
  handleClearParty() {
    if (confirm('Are you sure you want to clear the entire party?')) {
      this.currentParty = {
        active: [null, null, null],
        reserve: [null, null, null]
      };

      this.saveParty();
      this.renderPartySlots();
      this.renderCharacterPool();
      this.calculatePartyStats();
      this.analyzeSynergies();
      this.updateDisplay();

      this.showToast('Party cleared', 'success');
    }
  }

  /**
   * Update display elements
   */
  updateDisplay() {
    this.updatePartyStats();
    this.updateSynergyDisplay();
    this.updateTurnOrderDisplay();
    this.triggerSynergyVisualizationUpdate();
  }

  /**
   * Trigger party synergy visualization update
   */
  triggerSynergyVisualizationUpdate() {
    // Dispatch custom event for party synergy system
    const partyUpdateEvent = new CustomEvent('partyUpdated', {
      detail: {
        party: this.currentParty,
        stats: this.partyStats
      }
    });
    window.dispatchEvent(partyUpdateEvent);
  }

  /**
   * Update party stats display
   */
  updatePartyStats() {
    const statsDisplay = document.getElementById('party-stats-display');
    if (!statsDisplay || !this.partyStats.total) return;

    const stats = this.partyStats.average;
    const roles = this.partyStats.roles;
    const elements = this.partyStats.elements;

    statsDisplay.innerHTML = `
      <div class="party-stats-section">
        <h4>Party Statistics</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Avg HP</span>
            <span class="stat-value">${formatNumber(stats.hp)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Avg ATK</span>
            <span class="stat-value">${formatNumber(stats.attack)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Avg DEF</span>
            <span class="stat-value">${formatNumber(stats.defense)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Avg SPD</span>
            <span class="stat-value">${formatNumber(stats.speed)}</span>
          </div>
        </div>
      </div>

      <div class="party-composition-section">
        <h4>Party Composition</h4>
        <div class="composition-info">
          <div class="roles-info">
            <h5>Roles</h5>
            ${Object.entries(roles).map(([role, count]) =>
              `<span class="role-badge ${role}">${role}: ${count}</span>`
            ).join('')}
          </div>
          <div class="elements-info">
            <h5>Elements</h5>
            <div class="element-badges">
              ${elements.map(element =>
                `<span class="element-badge ${element.toLowerCase()}">${element}</span>`
              ).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update synergy display
   */
  updateSynergyDisplay() {
    const synergyDisplay = document.getElementById('synergy-display');
    if (!synergyDisplay) return;

    if (this.synergies.length === 0) {
      synergyDisplay.innerHTML = `
        <div class="no-synergies">
          <p>No active synergies. Try different character combinations!</p>
        </div>
      `;
      return;
    }

    synergyDisplay.innerHTML = `
      <div class="synergies-list">
        ${this.synergies.map(synergy => `
          <div class="synergy-item ${synergy.type}" data-strength="${synergy.strength}">
            <div class="synergy-header">
              <h5>${synergy.name}</h5>
              <div class="synergy-strength">
                ${this.createStrengthStars(synergy.strength)}
              </div>
            </div>
            <p class="synergy-description">${synergy.description}</p>
            <div class="synergy-bonus">${synergy.bonus}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Create strength stars for synergy rating
   */
  createStrengthStars(strength) {
    const maxStars = 10;
    const filledStars = Math.min(strength, maxStars);
    const emptyStars = maxStars - filledStars;

    return '★'.repeat(filledStars) + '☆'.repeat(emptyStars);
  }

  /**
   * Update turn order display
   */
  updateTurnOrderDisplay() {
    const turnOrderDisplay = document.getElementById('turn-order-display');
    if (!turnOrderDisplay || !this.partyStats.turnOrder) return;

    turnOrderDisplay.innerHTML = `
      <div class="turn-order-section">
        <h4>Turn Order (by Speed)</h4>
        <div class="turn-order-list">
          ${this.partyStats.turnOrder.map((character, index) => `
            <div class="turn-item">
              <span class="turn-number">${index + 1}</span>
              <span class="character-name">${character.name}</span>
              <span class="character-speed">${formatNumber(character.speed)} SPD</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Save party to storage
   */
  saveParty() {
    const validation = validateParty(this.currentParty);
    if (validation.isValid) {
      this.storage.saveParty(this.currentParty);
    }
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
   * Refresh the party composer
   */
  refresh() {
    this.loadPartyData();
    this.renderCharacterPool();
    this.renderPartySlots();
    this.calculatePartyStats();
    this.analyzeSynergies();
    this.updateDisplay();
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