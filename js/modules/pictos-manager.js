// Pictos Manager module for Expedition 33 Planner
import { PICTOS_TYPES, DEBOUNCE_DELAYS } from '../utils/constants.js';
import { validatePictos, validateLuminas } from '../utils/validators.js';
import { formatStat, formatNumber, truncateText } from '../utils/formatters.js';

/**
 * Pictos Manager class for managing Pictos collection and Lumina system
 */
export class PictosManager {
  constructor(dataManager, storage) {
    this.dataManager = dataManager;
    this.storage = storage;
    this.currentFilter = '';
    this.currentSearch = '';
    this.currentSort = 'name';
    this.showMasteredOnly = false;
    this.currentRarityFilter = '';
    this.currentExpeditionFilter = '';
    this.showEquippedOnly = false;
    this.masteredPictos = {};
    this.equippedPictos = {};
    this.activeLuminas = {};
    this.searchDebounce = null;

    // Methods will be bound automatically when called as arrow functions in event listeners
  }

  /**
   * Initialize the Pictos Manager
   */
  async init() {
    try {
      await this.loadPictosData();
      this.loadUserData();
      this.setupEventListeners();
      this.renderPictosGrid();
      this.updateLuminaPanel();
    } catch (error) {
      console.error('Failed to initialize Pictos Manager:', error);
    }
  }

  /**
   * Load Pictos data from the accurate data file
   */
  async loadPictosData() {
    try {
      const response = await fetch('data/pictos-accurate.json');
      this.pictosData = await response.json();
    } catch (error) {
      console.error('Failed to load accurate Pictos data:', error);
      // Fallback to original data
      this.pictosData = this.dataManager.gameData.pictos;
    }
  }

  /**
   * Load user data from storage
   */
  loadUserData() {
    const savedData = this.storage.loadData();
    this.masteredPictos = savedData.masteredPictos || {};
    this.equippedPictos = savedData.equippedPictos || {};
    this.activeLuminas = savedData.activeLuminas || {};
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    const searchInput = document.getElementById('pictos-search');
    const filterSelect = document.getElementById('pictos-filter');
    const masteryToggle = document.getElementById('mastery-toggle');
    const rarityFilter = document.getElementById('rarity-filter');
    const expeditionFilter = document.getElementById('expedition-filter');
    const equippedToggle = document.getElementById('equipped-toggle');

    if (searchInput) {
      searchInput.addEventListener('input', this.handleSearch.bind(this));
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', this.handleFilter.bind(this));
    }

    if (masteryToggle) {
      masteryToggle.addEventListener('click', this.handleMasteryToggle.bind(this));
    }

    if (rarityFilter) {
      rarityFilter.addEventListener('change', this.handleRarityFilter.bind(this));
    }

    if (expeditionFilter) {
      expeditionFilter.addEventListener('change', this.handleExpeditionFilter.bind(this));
    }

    if (equippedToggle) {
      equippedToggle.addEventListener('click', this.handleEquippedToggle.bind(this));
    }

    // Sort controls
    const sortButtons = document.querySelectorAll('.sort-btn');
    sortButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        this.handleSort(e.target.dataset.sort);
      });
    });

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
    }
  }

  /**
   * Handle search input
   */
  handleSearch(event) {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.currentSearch = event.target.value.toLowerCase().trim();
      this.renderPictosGrid();
    }, DEBOUNCE_DELAYS.SEARCH);
  }

  /**
   * Handle filter change
   */
  handleFilter(event) {
    this.currentFilter = event.target.value;
    this.renderPictosGrid();
  }

  /**
   * Handle sort change
   */
  handleSort(sortType) {
    this.currentSort = sortType;
    this.updateSortButtons(sortType);
    this.renderPictosGrid();
  }

  /**
   * Handle mastery filter toggle
   */
  handleMasteryToggle(event) {
    this.showMasteredOnly = !this.showMasteredOnly;
    event.target.classList.toggle('active', this.showMasteredOnly);
    event.target.textContent = this.showMasteredOnly ? 'Show All' : 'Show Mastered Only';
    this.renderPictosGrid();
  }

  /**
   * Handle rarity filter
   */
  handleRarityFilter(event) {
    this.currentRarityFilter = event.target.value;
    this.renderPictosGrid();
  }

  /**
   * Handle expedition filter
   */
  handleExpeditionFilter(event) {
    this.currentExpeditionFilter = event.target.value;
    this.renderPictosGrid();
  }

  /**
   * Handle equipped filter toggle
   */
  handleEquippedToggle(event) {
    this.showEquippedOnly = !this.showEquippedOnly;
    event.target.classList.toggle('active', this.showEquippedOnly);
    event.target.textContent = this.showEquippedOnly ? 'Show All' : 'Show Equipped Only';
    this.renderPictosGrid();
  }

  /**
   * Clear all filters
   */
  clearAllFilters() {
    this.currentFilter = '';
    this.currentSearch = '';
    this.currentRarityFilter = '';
    this.currentExpeditionFilter = '';
    this.showMasteredOnly = false;
    this.showEquippedOnly = false;

    // Reset UI elements
    const searchInput = document.getElementById('pictos-search');
    const filterSelect = document.getElementById('pictos-filter');
    const rarityFilter = document.getElementById('rarity-filter');
    const expeditionFilter = document.getElementById('expedition-filter');
    const masteryToggle = document.getElementById('mastery-toggle');
    const equippedToggle = document.getElementById('equipped-toggle');

    if (searchInput) searchInput.value = '';
    if (filterSelect) filterSelect.value = '';
    if (rarityFilter) rarityFilter.value = '';
    if (expeditionFilter) expeditionFilter.value = '';
    if (masteryToggle) {
      masteryToggle.classList.remove('active');
      masteryToggle.textContent = 'Show Mastered Only';
    }
    if (equippedToggle) {
      equippedToggle.classList.remove('active');
      equippedToggle.textContent = 'Show Equipped Only';
    }

    this.renderPictosGrid();
    this.showToast('All filters cleared', 'info');
  }

  /**
   * Handle Pictos card click
   */
  handlePictosClick(event) {
    const pictosCard = event.target.closest('.pictos-card');
    if (!pictosCard) return;

    const pictosId = pictosCard.dataset.pictosId;
    const action = event.target.closest('.pictos-action')?.dataset.action;

    switch (action) {
      case 'toggle-mastery':
        this.toggleMastery(pictosId);
        break;
      case 'equip':
        this.showEquipModal(pictosId);
        break;
      case 'info':
        this.showPictosInfo(pictosId);
        break;
      default:
        this.showPictosInfo(pictosId);
        break;
    }
  }

  /**
   * Toggle Pictos mastery status
   */
  toggleMastery(pictosId) {
    const currentMastery = this.masteredPictos[pictosId] || 0;
    const newMastery = currentMastery >= 4 ? 0 : 4;

    this.masteredPictos[pictosId] = newMastery;
    this.saveUserData();
    this.renderPictosGrid();
    this.updateLuminaPanel();

    const message = newMastery >= 4 ? 'Pictos mastered!' : 'Mastery removed';
    this.showToast(message, 'success');
  }

  /**
   * Render Pictos grid with current filters
   */
  renderPictosGrid() {
    const gridContainer = document.getElementById('pictos-grid');
    if (!gridContainer || !this.pictosData) return;

    const pictosList = this.getFilteredPictos();

    if (pictosList.length === 0) {
      gridContainer.innerHTML = `
        <div class="no-results">
          <h3>No Pictos found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = pictosList.map(pictos => this.createPictosCard(pictos)).join('');

    // Add click event listeners
    gridContainer.addEventListener('click', this.handlePictosClick.bind(this));
  }

  /**
   * Get filtered and sorted Pictos list
   */
  getFilteredPictos() {
    if (!this.pictosData?.pictos) return [];

    let filtered = this.pictosData.pictos;

    // Apply type filter
    if (this.currentFilter) {
      filtered = filtered.filter(p => p.type === this.currentFilter);
    }

    // Apply rarity filter
    if (this.currentRarityFilter) {
      filtered = filtered.filter(p => (p.rarity || 'common') === this.currentRarityFilter);
    }

    // Apply expedition filter
    if (this.currentExpeditionFilter) {
      const expeditionNum = parseInt(this.currentExpeditionFilter);
      if (!isNaN(expeditionNum)) {
        filtered = filtered.filter(p => (p.expedition || 0) <= expeditionNum);
      }
    }

    // Apply search filter with advanced text matching
    if (this.currentSearch) {
      const searchTerms = this.currentSearch.split(' ').filter(term => term.length > 0);
      filtered = filtered.filter(p => {
        const searchableText = [
          p.name,
          p.description || '',
          p.effect || '',
          p.location || '',
          p.type,
          p.rarity || 'common',
          ...(p.synergies || []),
          ...Object.keys(p.stats?.level1 || {})
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Apply mastery filter
    if (this.showMasteredOnly) {
      filtered = filtered.filter(p => (this.masteredPictos[p.id] || 0) >= 4);
    }

    // Apply equipped filter
    if (this.showEquippedOnly) {
      const equippedIds = new Set();
      Object.values(this.equippedPictos).forEach(pictosList => {
        pictosList.forEach(id => equippedIds.add(id));
      });
      filtered = filtered.filter(p => equippedIds.has(p.id));
    }

    // Sort
    return this.sortPictos(filtered);
  }

  /**
   * Sort Pictos based on current sort criteria
   */
  sortPictos(pictosList) {
    return pictosList.sort((a, b) => {
      switch (this.currentSort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
        case 'cost':
          return (a.lumina_cost || 0) - (b.lumina_cost || 0) || a.name.localeCompare(b.name);
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
          const aRarity = rarityOrder.indexOf(a.rarity || 'common');
          const bRarity = rarityOrder.indexOf(b.rarity || 'common');
          return bRarity - aRarity || a.name.localeCompare(b.name);
        case 'mastery':
          const aMastery = this.masteredPictos[a.id] || 0;
          const bMastery = this.masteredPictos[b.id] || 0;
          return bMastery - aMastery || a.name.localeCompare(b.name);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }

  /**
   * Get Pictos icon based on type and rarity
   */
  getPictosIcon(type, rarity) {
    const iconPath = `assets/images/pictos/${type.toLowerCase()}-${rarity || 'common'}.svg`;
    return iconPath;
  }

  /**
   * Create Pictos card HTML
   */
  createPictosCard(pictos) {
    const mastery = this.masteredPictos[pictos.id] || 0;
    const isMastered = mastery >= 4;
    const isCharacterSpecific = pictos.character_specific;
    const maxLevel = Math.min(4, Math.floor(mastery) + 1);
    const currentStats = pictos.stats[`level${maxLevel}`] || pictos.stats.level1;
    const iconPath = this.getPictosIcon(pictos.type, pictos.rarity);

    return `
      <div class="pictos-card ${pictos.type} ${pictos.rarity || 'common'} ${isMastered ? 'mastered' : ''}"
           data-pictos-id="${pictos.id}">
        <div class="pictos-header">
          <div class="pictos-icon">
            <img src="${iconPath}" alt="${pictos.name}" class="pictos-image" onerror="this.src='assets/images/pictos/placeholder.svg'">
          </div>
          <div class="pictos-title">
            <h4>${pictos.name}</h4>
            ${isCharacterSpecific ? `<span class="character-specific">${isCharacterSpecific}</span>` : ''}
          </div>
          <div class="pictos-type-badge ${pictos.type}">${pictos.type}</div>
        </div>

        <div class="pictos-stats">
          ${Object.entries(currentStats).map(([stat, value]) =>
            `<span class="stat-bonus">+${formatStat(stat, value)} ${this.getStatLabel(stat)}</span>`
          ).join('')}
        </div>

        <div class="lumina-cost">
          <span class="cost-label">Lumina Cost:</span>
          <span class="cost-value">${pictos.lumina_cost || 0}</span>
        </div>

        <div class="lumina-effect">
          <strong>Lumina Effect:</strong>
          <p>${truncateText(pictos.lumina_effect || 'No effect listed', 120)}</p>
        </div>

        <div class="pictos-info">
          <div class="location">
            <small><strong>Location:</strong> ${truncateText(pictos.location || 'Unknown', 60)}</small>
          </div>
          <div class="rarity">
            <small><strong>Rarity:</strong> ${(pictos.rarity || 'common').charAt(0).toUpperCase() + (pictos.rarity || 'common').slice(1)}</small>
          </div>
        </div>

        <div class="mastery-progress">
          <div class="mastery-bar">
            <div class="mastery-fill" style="width: ${(mastery / 4) * 100}%"></div>
          </div>
          <span class="mastery-text">${mastery}/4 Mastery</span>
        </div>

        <div class="pictos-actions">
          <button class="pictos-action btn-secondary" data-action="toggle-mastery"
                  title="${isMastered ? 'Remove mastery' : 'Mark as mastered'}">
            ${isMastered ? '★' : '☆'}
          </button>
          <button class="pictos-action btn-secondary" data-action="equip" title="Equip to character">
            Equip
          </button>
          <button class="pictos-action btn-primary" data-action="info" title="View details">
            Info
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Get readable stat label
   */
  getStatLabel(stat) {
    const statLabels = {
      attack: 'ATK',
      defense: 'DEF',
      hp: 'HP',
      speed: 'SPD',
      critRate: 'CRIT',
      critDamage: 'C.DMG',
      dodge: 'DODGE',
      parryWindow: 'PARRY',
      gradientCharge: 'GRAD',
      elementalDamage: 'ELEM',
      lightningDamage: 'LIGHT',
      apRegen: 'AP',
      statusResistance: 'S.RES',
      teamBonus: 'TEAM'
    };
    return statLabels[stat] || stat.toUpperCase();
  }

  /**
   * Show equip modal for Pictos
   */
  showEquipModal(pictosId) {
    const pictos = this.pictosData.pictos.find(p => p.id === pictosId);
    if (!pictos) return;

    const characters = this.dataManager.getAllCharacters();
    if (!characters) return;

    const modalContent = document.createElement('div');
    modalContent.className = 'equip-modal-content';

    modalContent.innerHTML = `
      <div class="selected-pictos">
        <h4>${pictos.name}</h4>
        <p class="pictos-type ${pictos.type}">${pictos.type} Pictos</p>
      </div>

      <h5>Select Character:</h5>
      <div class="character-selection">
        ${Object.values(characters).map(character => {
          const isEquipped = this.isEquippedToCharacter(pictosId, character.id);
          const equippedCount = this.getEquippedPictosCount(character.id);
          const canEquip = !isEquipped && equippedCount < 3;

          return `
            <div class="character-option ${!canEquip && !isEquipped ? 'disabled' : ''}"
                 data-character-id="${character.id}">
              <div class="character-info">
                <h6>${character.name}</h6>
                <span class="character-role">${character.role}</span>
                <span class="equipped-count">${equippedCount}/3 equipped</span>
              </div>
              <div class="character-actions">
                ${isEquipped ?
                  '<button class="btn-secondary unequip-btn">Unequip</button>' :
                  canEquip ?
                    '<button class="btn-primary equip-btn">Equip</button>' :
                    '<span class="full-slots">Slots Full</span>'
                }
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Add event listeners for character selection
    modalContent.addEventListener('click', (e) => {
      const characterOption = e.target.closest('.character-option');
      if (!characterOption) return;

      const characterId = characterOption.dataset.characterId;
      const isEquipBtn = e.target.classList.contains('equip-btn');
      const isUnequipBtn = e.target.classList.contains('unequip-btn');

      if (isEquipBtn) {
        this.equipPictosToCharacter(pictosId, characterId);
        this.hideModal();
      } else if (isUnequipBtn) {
        this.unequipPictosFromCharacter(pictosId, characterId);
        this.hideModal();
      }
    });

    this.showModal(`Equip ${pictos.name}`, modalContent);
  }

  /**
   * Check if Pictos is equipped to character
   */
  isEquippedToCharacter(pictosId, characterId) {
    return this.equippedPictos[characterId]?.includes(pictosId) || false;
  }

  /**
   * Get count of equipped Pictos for character
   */
  getEquippedPictosCount(characterId) {
    return this.equippedPictos[characterId]?.length || 0;
  }

  /**
   * Equip Pictos to character
   */
  equipPictosToCharacter(pictosId, characterId) {
    if (!this.equippedPictos[characterId]) {
      this.equippedPictos[characterId] = [];
    }

    if (this.equippedPictos[characterId].length >= 3) {
      this.showToast('Character already has 3 Pictos equipped', 'error');
      return false;
    }

    if (!this.equippedPictos[characterId].includes(pictosId)) {
      this.equippedPictos[characterId].push(pictosId);
      this.saveUserData();
      this.showToast('Pictos equipped successfully!', 'success');
      return true;
    }

    return false;
  }

  /**
   * Unequip Pictos from character
   */
  unequipPictosFromCharacter(pictosId, characterId) {
    if (this.equippedPictos[characterId]) {
      const index = this.equippedPictos[characterId].indexOf(pictosId);
      if (index > -1) {
        this.equippedPictos[characterId].splice(index, 1);
        this.saveUserData();
        this.showToast('Pictos unequipped successfully!', 'success');
        return true;
      }
    }
    return false;
  }

  /**
   * Show detailed Pictos information modal
   */
  showPictosInfo(pictosId) {
    const pictos = this.pictosData.pictos.find(p => p.id === pictosId);
    if (!pictos) return;

    const mastery = this.masteredPictos[pictosId] || 0;
    const isMastered = mastery >= 4;

    const modalContent = document.createElement('div');
    modalContent.className = 'pictos-info-modal';

    modalContent.innerHTML = `
      <div class="pictos-detailed-info">
        <div class="pictos-header-detailed">
          <h3>${pictos.name}</h3>
          <div class="badges">
            <span class="type-badge ${pictos.type}">${pictos.type}</span>
            <span class="rarity-badge ${pictos.rarity || 'common'}">${(pictos.rarity || 'common').toUpperCase()}</span>
            ${pictos.character_specific ? `<span class="character-badge">${pictos.character_specific}</span>` : ''}
          </div>
        </div>

        <div class="pictos-description">
          <p>${pictos.description || 'No description available.'}</p>
        </div>

        <div class="stats-progression">
          <h4>Stats by Level</h4>
          <div class="stats-table">
            ${[1, 2, 3, 4].map(level => {
              const stats = pictos.stats[`level${level}`];
              if (!stats) return '';

              return `
                <div class="stats-row">
                  <div class="level-label">Level ${level}</div>
                  <div class="stats-values">
                    ${Object.entries(stats).map(([stat, value]) =>
                      `<span>+${formatStat(stat, value)} ${this.getStatLabel(stat)}</span>`
                    ).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="lumina-details">
          <h4>Lumina Effect</h4>
          <div class="lumina-cost-info">
            <span>Cost: ${pictos.lumina_cost || 0} Lumina Points</span>
            <span class="mastery-status ${isMastered ? 'unlocked' : 'locked'}">
              ${isMastered ? '✓ Unlocked' : '✗ Requires Mastery'}
            </span>
          </div>
          <p class="lumina-description">${pictos.lumina_effect || 'No Lumina effect listed.'}</p>
        </div>

        <div class="acquisition-info">
          <h4>How to Obtain</h4>
          <p><strong>Location:</strong> ${pictos.location || 'Unknown location'}</p>
          <p><strong>Mastery Required:</strong> Win ${pictos.mastery_requirement || 4} battles with this Pictos equipped</p>
        </div>

        <div class="mastery-progress-detailed">
          <h4>Mastery Progress</h4>
          <div class="mastery-bar-large">
            <div class="mastery-fill" style="width: ${(mastery / 4) * 100}%"></div>
          </div>
          <p>${mastery}/4 battles won</p>
          ${!isMastered ? '<p class="mastery-hint">Win more battles with this Pictos equipped to unlock its Lumina!</p>' : ''}
        </div>

        ${this.getEquippedCharacters(pictosId).length > 0 ? `
          <div class="equipped-to">
            <h4>Currently Equipped To</h4>
            <div class="equipped-characters">
              ${this.getEquippedCharacters(pictosId).map(characterId => {
                const character = this.dataManager.getCharacter(characterId);
                return character ? `<span class="equipped-character">${character.name}</span>` : '';
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.showModal(`${pictos.name} Details`, modalContent);
  }

  /**
   * Get characters that have this Pictos equipped
   */
  getEquippedCharacters(pictosId) {
    const equipped = [];
    for (const [characterId, pictosList] of Object.entries(this.equippedPictos)) {
      if (pictosList?.includes(pictosId)) {
        equipped.push(characterId);
      }
    }
    return equipped;
  }

  /**
   * Update Lumina panel
   */
  updateLuminaPanel() {
    const luminaPanel = document.getElementById('lumina-panel');
    if (!luminaPanel) return;

    const availableLuminas = this.getAvailableLuminas();
    const activeLuminas = this.getActiveLuminas();

    luminaPanel.innerHTML = `
      <div class="lumina-header">
        <h4>Available Lumina Effects</h4>
        <span class="lumina-count">${availableLuminas.length} available</span>
      </div>

      <div class="lumina-grid">
        ${availableLuminas.map(pictos => {
          const isActive = activeLuminas.includes(pictos.id);
          const iconPath = this.getPictosIcon(pictos.type, pictos.rarity);
          return `
            <div class="lumina-card ${pictos.type} ${isActive ? 'active' : ''}"
                 data-lumina-id="${pictos.id}">
              <div class="lumina-header">
                <div class="lumina-icon">
                  <img src="${iconPath}" alt="${pictos.name}" class="lumina-image" onerror="this.src='assets/images/pictos/placeholder.svg'">
                </div>
                <h5>${pictos.name}</h5>
                <span class="lumina-cost">${pictos.lumina_cost || 0}</span>
              </div>
              <p class="lumina-effect">${truncateText(pictos.lumina_effect || '', 80)}</p>
              <div class="lumina-actions">
                <button class="lumina-toggle ${isActive ? 'active' : ''}"
                        data-lumina-id="${pictos.id}">
                  ${isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      ${availableLuminas.length === 0 ? '<p class="no-luminas">Master some Pictos to unlock Lumina effects!</p>' : ''}
    `;

    // Add event listeners for Lumina toggles
    luminaPanel.addEventListener('click', this.handleLuminaToggle.bind(this));
  }

  /**
   * Get available Lumina effects (from mastered Pictos)
   */
  getAvailableLuminas() {
    if (!this.pictosData?.pictos) return [];

    return this.pictosData.pictos.filter(pictos => {
      const mastery = this.masteredPictos[pictos.id] || 0;
      return mastery >= 4 && pictos.lumina_effect;
    });
  }

  /**
   * Get currently active Luminas
   */
  getActiveLuminas() {
    return Object.keys(this.activeLuminas).filter(id => this.activeLuminas[id]);
  }

  /**
   * Handle Lumina toggle
   */
  handleLuminaToggle(event) {
    const toggleButton = event.target.closest('.lumina-toggle');
    if (!toggleButton) return;

    const luminaId = toggleButton.dataset.luminaId;
    const isActive = this.activeLuminas[luminaId] || false;

    if (isActive) {
      // Deactivate
      this.activeLuminas[luminaId] = false;
    } else {
      // Check if we have enough Lumina points
      const pictos = this.pictosData.pictos.find(p => p.id === luminaId);
      if (this.canActivateLumina(pictos)) {
        this.activeLuminas[luminaId] = true;
      } else {
        this.showToast('Not enough Lumina points available', 'error');
        return;
      }
    }

    this.saveUserData();
    this.updateLuminaPanel();
    this.showToast(`Lumina ${isActive ? 'deactivated' : 'activated'}`, 'success');
  }

  /**
   * Check if Lumina can be activated
   */
  canActivateLumina(pictos) {
    if (!pictos) return false;

    const currentCost = this.getTotalLuminaCost();
    const newCost = currentCost + (pictos.lumina_cost || 0);
    const maxPoints = 50; // Assuming max level 50 for now

    return newCost <= maxPoints;
  }

  /**
   * Get total Lumina cost of active Luminas
   */
  getTotalLuminaCost() {
    let totalCost = 0;
    for (const [luminaId, isActive] of Object.entries(this.activeLuminas)) {
      if (isActive) {
        const pictos = this.pictosData.pictos.find(p => p.id === luminaId);
        if (pictos) {
          totalCost += pictos.lumina_cost || 0;
        }
      }
    }
    return totalCost;
  }

  /**
   * Update sort buttons visual state
   */
  updateSortButtons(activeSort) {
    const sortButtons = document.querySelectorAll('.sort-btn');
    sortButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sort === activeSort);
    });
  }

  /**
   * Save user data to storage
   */
  saveUserData() {
    const data = this.storage.loadData();
    data.masteredPictos = this.masteredPictos;
    data.equippedPictos = this.equippedPictos;
    data.activeLuminas = this.activeLuminas;
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
   * Hide modal
   */
  hideModal() {
    if (window.app && window.app.hideModal) {
      window.app.hideModal();
    }
  }

  /**
   * Refresh the Pictos manager
   */
  refresh() {
    this.loadUserData();
    this.renderPictosGrid();
    this.updateLuminaPanel();
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