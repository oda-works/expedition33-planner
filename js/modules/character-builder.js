// Character Builder module for Expedition 33 Planner
import { ATTRIBUTES, STATS, DEFAULTS } from '../utils/constants.js';
import { validateLevel, validateAttributes, validateLuminas, validatePictos } from '../utils/validators.js';
import { formatStat, formatNumber, formatPercentage } from '../utils/formatters.js';

/**
 * Character Builder class for managing character builds
 */
export class CharacterBuilder {
  constructor(dataManager, storage) {
    this.dataManager = dataManager;
    this.storage = storage;
    this.currentCharacter = null;
    this.currentBuild = this.getDefaultBuild();
    this.isInitialized = false;

    // Bind methods
    // Methods will be bound automatically when called as arrow functions in event listeners
  }

  /**
   * Initialize the character builder
   */
  async init() {
    try {
      this.setupEventListeners();
      this.populateCharacterSelect();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize character builder:', error);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    const characterSelect = document.getElementById('character-select');
    const resetBtn = document.getElementById('reset-build');
    const saveBtn = document.getElementById('save-build');

    if (characterSelect) {
      characterSelect.addEventListener('change', this.handleCharacterChange);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', this.handleResetBuild);
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', this.handleSaveBuild);
    }
  }

  /**
   * Populate character select dropdown
   */
  populateCharacterSelect() {
    const characterSelect = document.getElementById('character-select');
    if (!characterSelect) return;

    const characters = this.dataManager.getAllCharacters();
    if (!characters) return;

    // Clear existing options except the first one
    const firstOption = characterSelect.querySelector('option[value=""]');
    characterSelect.innerHTML = '';
    if (firstOption) {
      characterSelect.appendChild(firstOption);
    }

    // Add character options
    Object.values(characters).forEach(character => {
      const option = document.createElement('option');
      option.value = character.id;
      option.textContent = character.name;
      characterSelect.appendChild(option);
    });
  }

  /**
   * Handle character selection change
   */
  handleCharacterChange(event) {
    const characterId = event.target.value;
    if (!characterId) {
      this.clearCharacterBuilder();
      return;
    }

    this.loadCharacter(characterId);
  }

  /**
   * Load character and build interface
   */
  async loadCharacter(characterId) {
    try {
      const character = this.dataManager.getCharacter(characterId);
      if (!character) {
        console.error('Character not found:', characterId);
        return;
      }

      this.currentCharacter = character;

      // Load saved build or use default
      const savedBuild = this.storage.loadCharacterBuild(characterId);
      this.currentBuild = savedBuild || this.getDefaultBuild();

      // Build the character interface
      this.buildCharacterInterface();
      this.calculateStats();

    } catch (error) {
      console.error('Failed to load character:', error);
    }
  }

  /**
   * Build the character interface
   */
  buildCharacterInterface() {
    const builderContainer = document.getElementById('character-builder');
    if (!builderContainer) return;

    builderContainer.innerHTML = this.createCharacterBuilderHTML();
    this.setupCharacterEventListeners();
    this.updateInterface();
  }

  /**
   * Create character builder HTML
   */
  createCharacterBuilderHTML() {
    const character = this.currentCharacter;
    const weapons = this.dataManager.getCharacterWeapons(character.id);

    return `
      <div class="character-info">
        <div class="character-header">
          <div class="character-portrait">
            <img src="${character.image || 'assets/images/characters/placeholder.svg'}" alt="${character.name}" class="character-image">
          </div>
          <div class="character-details">
            <h3>${character.name}</h3>
            <span class="character-role">${character.role}</span>
            <span class="character-element">${character.element}</span>
          </div>
        </div>
        <p class="character-description">${character.description}</p>
        <div class="unique-mechanic">
          <strong>${character.uniqueMechanic.name}:</strong>
          <span>${character.uniqueMechanic.description}</span>
        </div>
      </div>

      <div class="build-controls">
        <div class="level-control">
          <label for="character-level">Level:</label>
          <input type="number" id="character-level" min="1" max="50" value="${this.currentBuild.level || 1}">
          <span class="level-info">Max Attribute Points: <span id="max-attribute-points">0</span></span>
        </div>

        <div class="weapon-control">
          <label for="weapon-select">Weapon:</label>
          <select id="weapon-select">
            <option value="">Select Weapon</option>
            ${weapons.map(weapon => `
              <option value="${weapon.id}" ${weapon.id === this.currentBuild.weapon ? 'selected' : ''}>
                ${weapon.name}
              </option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="attributes-section">
        <h4>Attribute Distribution</h4>
        <div class="attributes-grid">
          ${Object.values(ATTRIBUTES).map(attr => this.createAttributeControl(attr)).join('')}
        </div>
        <div class="attribute-summary">
          <span>Points Used: <span id="points-used">0</span></span>
          <span>Points Available: <span id="points-available">0</span></span>
        </div>
      </div>

      <div class="stats-display">
        <h4>Character Stats</h4>
        <div class="stats-grid">
          ${Object.values(STATS).map(stat => this.createStatDisplay(stat)).join('')}
        </div>
      </div>

      <div class="pictos-section">
        <h4>Equipped Pictos</h4>
        <div class="pictos-slots">
          ${[0, 1, 2].map(index => `
            <div class="pictos-slot" data-slot="${index}">
              <div class="slot-placeholder">Empty Slot</div>
            </div>
          `).join('')}
        </div>
        <button class="btn-secondary" id="manage-pictos">Manage Pictos</button>
      </div>

      <div class="lumina-section">
        <h4>Equipped Luminas</h4>
        <div class="lumina-slots">
          <div class="lumina-grid" id="lumina-grid">
            <!-- Lumina slots will be populated dynamically -->
          </div>
        </div>
        <div class="lumina-summary">
          <span>Lumina Points Used: <span id="lumina-points-used">0</span></span>
          <span>Lumina Points Available: <span id="lumina-points-available">0</span></span>
        </div>
        <button class="btn-secondary" id="manage-luminas">Manage Luminas</button>
      </div>
    `;
  }

  /**
   * Create attribute control HTML
   */
  createAttributeControl(attribute) {
    const currentValue = this.currentBuild.attributes[attribute] || 0;
    const capitalizedName = attribute.charAt(0).toUpperCase() + attribute.slice(1);

    return `
      <div class="attribute-control">
        <label for="${attribute}-input">${capitalizedName}:</label>
        <div class="attribute-input-group">
          <button class="attr-btn attr-decrease" data-attribute="${attribute}" data-action="decrease">-</button>
          <input type="number" id="${attribute}-input" class="attribute-input"
                 data-attribute="${attribute}" value="${currentValue}" min="0" max="99">
          <button class="attr-btn attr-increase" data-attribute="${attribute}" data-action="increase">+</button>
        </div>
        <div class="attribute-effects" id="${attribute}-effects">
          <!-- Effects will be populated dynamically -->
        </div>
      </div>
    `;
  }

  /**
   * Create stat display HTML
   */
  createStatDisplay(stat) {
    const capitalizedName = stat.charAt(0).toUpperCase() + stat.slice(1).replace(/([A-Z])/g, ' $1');

    return `
      <div class="stat-display">
        <span class="stat-label">${capitalizedName}:</span>
        <span class="stat-value" id="${stat}-value">0</span>
      </div>
    `;
  }

  /**
   * Set up character-specific event listeners
   */
  setupCharacterEventListeners() {
    // Level input
    const levelInput = document.getElementById('character-level');
    if (levelInput) {
      levelInput.addEventListener('input', this.handleLevelChange);
    }

    // Weapon select
    const weaponSelect = document.getElementById('weapon-select');
    if (weaponSelect) {
      weaponSelect.addEventListener('change', this.handleWeaponChange);
    }

    // Attribute controls
    const attributeInputs = document.querySelectorAll('.attribute-input');
    const attributeButtons = document.querySelectorAll('.attr-btn');

    attributeInputs.forEach(input => {
      input.addEventListener('input', this.handleAttributeChange);
    });

    attributeButtons.forEach(button => {
      button.addEventListener('click', this.handleAttributeButtonClick.bind(this));
    });

    // Pictos and Lumina management buttons
    const managePictosBtn = document.getElementById('manage-pictos');
    const manageLuminasBtn = document.getElementById('manage-luminas');

    if (managePictosBtn) {
      managePictosBtn.addEventListener('click', () => this.openPictosManager());
    }

    if (manageLuminasBtn) {
      manageLuminasBtn.addEventListener('click', () => this.openLuminaManager());
    }
  }

  /**
   * Handle level change
   */
  handleLevelChange(event) {
    const level = parseInt(event.target.value);
    if (isNaN(level)) return;

    const validation = validateLevel(level);
    if (!validation.isValid) {
      this.showValidationError(validation.error);
      return;
    }

    this.currentBuild.level = level;
    this.calculateStats();
    this.updateInterface();
    this.saveCurrentBuild();
  }

  /**
   * Handle attribute change
   */
  handleAttributeChange(event) {
    const attribute = event.target.dataset.attribute;
    const value = parseInt(event.target.value) || 0;

    if (value < 0) {
      event.target.value = 0;
      return;
    }

    this.currentBuild.attributes[attribute] = value;
    this.validateAndUpdateAttributes();
  }

  /**
   * Handle attribute button click
   */
  handleAttributeButtonClick(event) {
    const attribute = event.target.dataset.attribute;
    const action = event.target.dataset.action;
    const currentValue = this.currentBuild.attributes[attribute] || 0;

    let newValue = currentValue;
    if (action === 'increase') {
      newValue = Math.min(currentValue + 1, 99);
    } else if (action === 'decrease') {
      newValue = Math.max(currentValue - 1, 0);
    }

    this.currentBuild.attributes[attribute] = newValue;
    this.validateAndUpdateAttributes();
  }

  /**
   * Handle weapon change
   */
  handleWeaponChange(event) {
    this.currentBuild.weapon = event.target.value;
    this.calculateStats();
    this.saveCurrentBuild();
  }

  /**
   * Validate and update attributes
   */
  validateAndUpdateAttributes() {
    const validation = validateAttributes(this.currentBuild.attributes, this.currentBuild.level);

    if (!validation.isValid) {
      // Revert to previous valid state or adjust automatically
      this.adjustAttributesToValid();
    }

    this.updateAttributeInputs();
    this.calculateStats();
    this.saveCurrentBuild();
  }

  /**
   * Adjust attributes to valid state
   */
  adjustAttributesToValid() {
    const maxPoints = this.dataManager.getMaxAttributePoints(this.currentBuild.level);
    const totalPoints = Object.values(this.currentBuild.attributes).reduce((sum, val) => sum + val, 0);

    if (totalPoints > maxPoints) {
      // Proportionally reduce all attributes
      const reductionFactor = maxPoints / totalPoints;
      for (const attr of Object.keys(this.currentBuild.attributes)) {
        this.currentBuild.attributes[attr] = Math.floor(this.currentBuild.attributes[attr] * reductionFactor);
      }
    }
  }

  /**
   * Update attribute inputs
   */
  updateAttributeInputs() {
    Object.keys(this.currentBuild.attributes).forEach(attr => {
      const input = document.getElementById(`${attr}-input`);
      if (input) {
        input.value = this.currentBuild.attributes[attr];
      }
    });
  }

  /**
   * Calculate character stats
   */
  calculateStats() {
    if (!this.currentCharacter) return;

    const stats = this.dataManager.calculateCharacterStats(
      this.currentCharacter.id,
      this.currentBuild.level,
      this.currentBuild.attributes
    );

    if (stats) {
      this.currentBuild.calculatedStats = stats;
      this.updateStatsDisplay(stats);
    }

    this.updateAttributeEffects();
    this.updatePointsSummary();
  }

  /**
   * Update stats display
   */
  updateStatsDisplay(stats) {
    Object.entries(stats).forEach(([stat, value]) => {
      const element = document.getElementById(`${stat}-value`);
      if (element) {
        element.textContent = formatStat(stat, value);
      }
    });
  }

  /**
   * Update attribute effects display
   */
  updateAttributeEffects() {
    const scaling = this.currentCharacter.attributeScaling;

    Object.keys(this.currentBuild.attributes).forEach(attr => {
      const effectsElement = document.getElementById(`${attr}-effects`);
      if (!effectsElement || !scaling[attr]) return;

      const value = this.currentBuild.attributes[attr];
      const effects = [];

      Object.entries(scaling[attr]).forEach(([stat, bonus]) => {
        const totalBonus = bonus * value;
        if (totalBonus > 0) {
          effects.push(`+${formatStat(stat, totalBonus, true)} ${stat.toUpperCase()}`);
        }
      });

      effectsElement.innerHTML = effects.length > 0 ? effects.join(', ') : 'No effects';
    });
  }

  /**
   * Update points summary
   */
  updatePointsSummary() {
    const usedPoints = Object.values(this.currentBuild.attributes).reduce((sum, val) => sum + val, 0);
    const maxPoints = this.dataManager.getMaxAttributePoints(this.currentBuild.level);
    const availablePoints = Math.max(0, maxPoints - usedPoints);

    const usedElement = document.getElementById('points-used');
    const availableElement = document.getElementById('points-available');
    const maxElement = document.getElementById('max-attribute-points');

    if (usedElement) usedElement.textContent = usedPoints;
    if (availableElement) availableElement.textContent = availablePoints;
    if (maxElement) maxElement.textContent = maxPoints;

    // Update Lumina points
    const maxLuminaPoints = this.dataManager.getMaxLuminaPoints(this.currentBuild.level);
    const usedLuminaPoints = this.calculateUsedLuminaPoints();

    const luminaUsedElement = document.getElementById('lumina-points-used');
    const luminaAvailableElement = document.getElementById('lumina-points-available');

    if (luminaUsedElement) luminaUsedElement.textContent = usedLuminaPoints;
    if (luminaAvailableElement) luminaAvailableElement.textContent = maxLuminaPoints - usedLuminaPoints;
  }

  /**
   * Calculate used Lumina points
   */
  calculateUsedLuminaPoints() {
    if (!this.currentBuild.luminas) return 0;
    return this.currentBuild.luminas.reduce((sum, lumina) => sum + (lumina.cost || 0), 0);
  }

  /**
   * Update interface elements
   */
  updateInterface() {
    this.updateAttributeInputs();
    this.updatePointsSummary();
    this.updatePictosDisplay();
    this.updateLuminaDisplay();
  }

  /**
   * Update Pictos display
   */
  updatePictosDisplay() {
    const pictosSlots = document.querySelectorAll('.pictos-slot');
    const equippedPictos = this.currentBuild.pictos || [];

    pictosSlots.forEach((slot, index) => {
      const pictos = equippedPictos[index];
      if (pictos) {
        slot.innerHTML = `
          <div class="equipped-pictos">
            <div class="pictos-name">${pictos.name}</div>
            <div class="pictos-type ${pictos.type}">${pictos.type}</div>
          </div>
        `;
      } else {
        slot.innerHTML = '<div class="slot-placeholder">Empty Slot</div>';
      }
    });
  }

  /**
   * Update Lumina display
   */
  updateLuminaDisplay() {
    const luminaGrid = document.getElementById('lumina-grid');
    if (!luminaGrid) return;

    const equippedLuminas = this.currentBuild.luminas || [];

    if (equippedLuminas.length === 0) {
      luminaGrid.innerHTML = '<div class="no-luminas">No Luminas equipped</div>';
      return;
    }

    luminaGrid.innerHTML = equippedLuminas.map(lumina => `
      <div class="equipped-lumina ${lumina.color}">
        <div class="lumina-name">${lumina.name}</div>
        <div class="lumina-cost">Cost: ${lumina.cost}</div>
      </div>
    `).join('');
  }

  /**
   * Handle save build
   */
  handleSaveBuild() {
    if (!this.currentCharacter) return;

    const success = this.saveCurrentBuild();
    if (success) {
      this.showSuccessMessage('Build saved successfully!');
    } else {
      this.showErrorMessage('Failed to save build');
    }
  }

  /**
   * Handle reset build
   */
  handleResetBuild() {
    if (!this.currentCharacter) return;

    if (confirm('Are you sure you want to reset this build? All changes will be lost.')) {
      this.currentBuild = this.getDefaultBuild();
      this.updateInterface();
      this.calculateStats();
      this.saveCurrentBuild();
      this.showSuccessMessage('Build reset to defaults');
    }
  }

  /**
   * Save current build to storage
   */
  saveCurrentBuild() {
    if (!this.currentCharacter) return false;

    const buildData = {
      ...this.currentBuild,
      character: this.currentCharacter.id,
      lastModified: new Date().toISOString()
    };

    return this.storage.saveCharacterBuild(this.currentCharacter.id, buildData);
  }

  /**
   * Open Pictos manager
   */
  openPictosManager() {
    // This would open the Pictos management interface
    // For now, switch to Pictos tab
    const pictosTab = document.querySelector('.nav-tab[data-tab="pictos"]');
    if (pictosTab) {
      pictosTab.click();
    }
  }

  /**
   * Open Lumina manager
   */
  openLuminaManager() {
    // This would open the Lumina management interface
    // Create a modal or switch to appropriate interface
    this.showLuminaSelectionModal();
  }

  /**
   * Show Lumina selection modal
   */
  showLuminaSelectionModal() {
    const allLuminas = this.dataManager.getAllLuminas();
    if (!allLuminas) return;

    const modalContent = document.createElement('div');
    modalContent.className = 'lumina-selection';

    modalContent.innerHTML = `
      <div class="lumina-grid">
        ${Object.values(allLuminas).map(lumina => `
          <div class="lumina-card ${lumina.color}" data-lumina-id="${lumina.id}">
            <div class="lumina-header">
              <h4>${lumina.name}</h4>
              <span class="lumina-cost">Cost: ${lumina.cost}</span>
            </div>
            <div class="lumina-stats">
              ${Object.entries(lumina.stats).map(([stat, value]) =>
                `<span>+${formatStat(stat, value)} ${stat}</span>`
              ).join('')}
            </div>
            <div class="lumina-effect">${lumina.effect}</div>
          </div>
        `).join('')}
      </div>
    `;

    // Add click handlers for Lumina selection
    modalContent.addEventListener('click', (e) => {
      const luminaCard = e.target.closest('.lumina-card');
      if (luminaCard) {
        const luminaId = luminaCard.dataset.luminaId;
        this.toggleLumina(luminaId);
      }
    });

    // Show modal (assuming there's a global modal system)
    if (window.app && window.app.showModal) {
      window.app.showModal('Select Luminas', modalContent);
    }
  }

  /**
   * Toggle Lumina selection
   */
  toggleLumina(luminaId) {
    const lumina = this.dataManager.getLumina(luminaId);
    if (!lumina) return;

    this.currentBuild.luminas = this.currentBuild.luminas || [];
    const existingIndex = this.currentBuild.luminas.findIndex(l => l.id === luminaId);

    if (existingIndex >= 0) {
      // Remove Lumina
      this.currentBuild.luminas.splice(existingIndex, 1);
    } else {
      // Add Lumina if within limits
      const validation = validateLuminas([...this.currentBuild.luminas, lumina], this.currentBuild.level);
      if (validation.isValid) {
        this.currentBuild.luminas.push(lumina);
      } else {
        this.showValidationError(validation.error);
        return;
      }
    }

    this.updateLuminaDisplay();
    this.updatePointsSummary();
    this.saveCurrentBuild();
  }

  /**
   * Clear character builder
   */
  clearCharacterBuilder() {
    const builderContainer = document.getElementById('character-builder');
    if (builderContainer) {
      builderContainer.innerHTML = '<div class="builder-placeholder"><p>Select a character to begin building</p></div>';
    }

    this.currentCharacter = null;
    this.currentBuild = this.getDefaultBuild();
  }

  /**
   * Get default build structure
   */
  getDefaultBuild() {
    return {
      level: 1,
      attributes: {
        [ATTRIBUTES.VITALITY]: 0,
        [ATTRIBUTES.AGILITY]: 0,
        [ATTRIBUTES.DEFENSE]: 0,
        [ATTRIBUTES.LUCK]: 0
      },
      weapon: null,
      pictos: [],
      luminas: [],
      calculatedStats: null
    };
  }

  /**
   * Show validation error
   */
  showValidationError(message) {
    if (window.app && window.app.showToast) {
      window.app.showToast(message, 'error');
    } else {
      console.error('Validation error:', message);
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    if (window.app && window.app.showToast) {
      window.app.showToast(message, 'success');
    } else {
      console.log('Success:', message);
    }
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    if (window.app && window.app.showToast) {
      window.app.showToast(message, 'error');
    } else {
      console.error('Error:', message);
    }
  }

  /**
   * Refresh the character builder
   */
  refresh() {
    if (this.currentCharacter) {
      this.calculateStats();
      this.updateInterface();
    }
  }

  /**
   * Check for unsaved changes
   */
  hasUnsavedChanges() {
    // For now, assume auto-save is on
    return false;
  }

  /**
   * Called when tab becomes active
   */
  onActivate() {
    this.refresh();
  }
}