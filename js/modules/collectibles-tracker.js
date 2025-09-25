// Collectibles Tracker module for Expedition 33 Planner
import { COLLECTIBLE_CATEGORIES, GAME_CONSTANTS } from '../utils/constants.js';
import { formatCompletion, formatDate, truncateText } from '../utils/formatters.js';

/**
 * Collectibles Tracker class for managing collection progress
 */
export class CollectiblesTracker {
  constructor(dataManager, storage) {
    this.dataManager = dataManager;
    this.storage = storage;
    this.currentCategory = 'journals';
    this.showSpoilers = false;
    this.collectiblesData = null;
    this.userProgress = {};

    // Bind methods
    this.handleCategoryChange = this.handleCategoryChange.bind(this);
    this.handleItemToggle = this.handleItemToggle.bind(this);
    this.handleSpoilerToggle = this.handleSpoilerToggle.bind(this);
    this.handleImportSave = this.handleImportSave.bind(this);
    this.handleExportProgress = this.handleExportProgress.bind(this);
  }

  /**
   * Initialize the Collectibles Tracker
   */
  async init() {
    try {
      this.loadCollectiblesData();
      this.loadUserProgress();
      this.setupEventListeners();
      this.updateOverallProgress();
      this.renderCategoryTabs();
      this.renderCurrentCategory();
    } catch (error) {
      console.error('Failed to initialize Collectibles Tracker:', error);
    }
  }

  /**
   * Load collectibles data
   */
  loadCollectiblesData() {
    this.collectiblesData = this.dataManager.getCollectibles();
    if (!this.collectiblesData) {
      console.warn('Collectibles data not available');
    }
  }

  /**
   * Load user progress from storage
   */
  loadUserProgress() {
    const savedData = this.storage.loadCollectibles();
    this.userProgress = savedData || {
      journals: new Array(GAME_CONSTANTS.JOURNAL_COUNT).fill(false),
      records: new Array(GAME_CONSTANTS.MUSIC_RECORD_COUNT).fill(false),
      gestrals: 0,
      esquie_rocks: [],
      white_nevron: new Array(GAME_CONSTANTS.WHITE_NEVRON_COUNT).fill(false),
      paint_cages: {
        basic: new Array(10).fill(false),
        advanced: new Array(10).fill(false),
        legendary: new Array(5).fill(false)
      }
    };

    // Load user settings
    const settings = this.storage.loadSettings();
    this.showSpoilers = settings.showSpoilers || false;
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Category tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        if (category) {
          this.handleCategoryChange(category);
        }
      });
    });

    // Import/Export buttons
    const importBtn = document.getElementById('import-save');
    const exportBtn = document.getElementById('export-progress');

    if (importBtn) {
      importBtn.addEventListener('click', this.handleImportSave);
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', this.handleExportProgress);
    }

    // Spoiler toggle (if available)
    const spoilerToggle = document.getElementById('spoiler-toggle');
    if (spoilerToggle) {
      spoilerToggle.addEventListener('click', this.handleSpoilerToggle);
    }
  }

  /**
   * Handle category change
   */
  handleCategoryChange(category) {
    if (this.currentCategory === category) return;

    this.currentCategory = category;
    this.updateCategoryTabs();
    this.renderCurrentCategory();
  }

  /**
   * Update category tabs visual state
   */
  updateCategoryTabs() {
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === this.currentCategory);
    });
  }

  /**
   * Render category tabs with progress
   */
  renderCategoryTabs() {
    const categories = [
      { id: 'journals', name: 'Expedition Journals', total: GAME_CONSTANTS.JOURNAL_COUNT },
      { id: 'records', name: 'Music Records', total: GAME_CONSTANTS.MUSIC_RECORD_COUNT },
      { id: 'other', name: 'Other Collectibles', total: 15 } // Approximation for other items
    ];

    const tabsContainer = document.querySelector('.collectibles-categories');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = categories.map(category => {
      const completed = this.getCompletionCount(category.id);
      const { percentage } = formatCompletion(completed, category.total);

      return `
        <div class="category-tab ${category.id === this.currentCategory ? 'active' : ''}"
             data-category="${category.id}">
          <span class="category-name">${category.name}</span>
          <span class="count">(${completed}/${category.total})</span>
          <div class="category-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Re-attach event listeners
    setTimeout(() => this.setupCategoryEventListeners(), 0);
  }

  /**
   * Setup category event listeners after rendering
   */
  setupCategoryEventListeners() {
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const category = e.currentTarget.dataset.category;
        if (category) {
          this.handleCategoryChange(category);
        }
      });
    });
  }

  /**
   * Get completion count for category
   */
  getCompletionCount(category) {
    switch (category) {
      case 'journals':
        return this.userProgress.journals?.filter(Boolean).length || 0;
      case 'records':
        return this.userProgress.records?.filter(Boolean).length || 0;
      case 'other':
        const gestrals = Math.min(this.userProgress.gestrals || 0, GAME_CONSTANTS.GESTRAL_COUNT);
        const esquieRocks = this.userProgress.esquie_rocks?.length || 0;
        const whiteNevron = this.userProgress.white_nevron?.filter(Boolean).length || 0;
        const paintCages =
          (this.userProgress.paint_cages?.basic?.filter(Boolean).length || 0) +
          (this.userProgress.paint_cages?.advanced?.filter(Boolean).length || 0) +
          (this.userProgress.paint_cages?.legendary?.filter(Boolean).length || 0);
        return gestrals + esquieRocks + whiteNevron + Math.min(paintCages, 25);
      default:
        return 0;
    }
  }

  /**
   * Render current category content
   */
  renderCurrentCategory() {
    const contentContainer = document.getElementById('collectibles-content');
    if (!contentContainer) return;

    switch (this.currentCategory) {
      case 'journals':
        this.renderJournals(contentContainer);
        break;
      case 'records':
        this.renderRecords(contentContainer);
        break;
      case 'other':
        this.renderOtherCollectibles(contentContainer);
        break;
    }
  }

  /**
   * Render expedition journals
   */
  renderJournals(container) {
    // Check for accurate data first, fallback to original structure
    const journals = this.collectiblesData?.journals || this.collectiblesData?.expedition_journals;
    if (!journals) {
      container.innerHTML = '<div class="loading">Loading journals data...</div>';
      return;
    }

    const userJournals = this.userProgress.journals || [];

    container.innerHTML = `
      <div class="collectibles-header">
        <h4>Expedition Journals</h4>
        <p>Chronicle of the 33rd Expedition's journey through various locations and challenges.</p>
      </div>

      <div class="collectibles-grid">
        ${journals.map((journal, index) => {
          const isCollected = userJournals[index] || false;
          const isMissable = journal.missable || false;

          return `
            <div class="collectible-item ${isCollected ? 'collected' : ''} ${isMissable ? 'missable' : ''}"
                 data-type="journal"
                 data-index="${index}">

              <div class="collectible-header">
                <div class="collectible-info">
                  <h5>${journal.name}</h5>
                  <span class="expedition-number">Expedition ${journal.expedition}</span>
                  ${isMissable ? '<span class="missable-badge">Missable</span>' : ''}
                </div>
                <div class="collection-toggle">
                  <input type="checkbox"
                         id="journal-${index}"
                         ${isCollected ? 'checked' : ''}
                         data-type="journal"
                         data-index="${index}">
                  <label for="journal-${index}" class="checkbox-label">
                    <span class="checkmark">✓</span>
                  </label>
                </div>
              </div>

              <div class="collectible-description">
                <p>${journal.description}</p>
              </div>

              <div class="collectible-location">
                <strong>Location:</strong>
                <span class="location-text ${!this.showSpoilers && isMissable ? 'spoiler-hidden' : ''}">
                  ${this.showSpoilers || !isMissable ? journal.location : '[Spoiler Hidden]'}
                </span>
                ${journal.hint && (this.showSpoilers || !isMissable) ? `
                  <div class="location-hint">
                    <em>${journal.hint}</em>
                  </div>
                ` : ''}
              </div>

              ${isMissable && journal.missable_reason ? `
                <div class="missable-warning">
                  <strong>⚠️ Warning:</strong> ${journal.missable_reason}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.attachCollectibleEventListeners(container);
  }

  /**
   * Render music records
   */
  renderRecords(container) {
    // Check for accurate data first, fallback to original structure
    const records = this.collectiblesData?.music_records || this.collectiblesData?.records;
    if (!records) {
      container.innerHTML = '<div class="loading">Loading records data...</div>';
      return;
    }

    const userRecords = this.userProgress.records || [];

    container.innerHTML = `
      <div class="collectibles-header">
        <h4>Music Records</h4>
        <p>Collect these musical pieces scattered throughout the expedition to unlock the complete soundtrack.</p>
      </div>

      <div class="collectibles-grid">
        ${records.map((record, index) => {
          const isCollected = userRecords[index] || false;
          const isMissable = record.missable || false;
          const isSpecial = record.special || false;

          return `
            <div class="collectible-item record ${isCollected ? 'collected' : ''} ${isMissable ? 'missable' : ''} ${isSpecial ? 'special' : ''}"
                 data-type="record"
                 data-index="${index}">

              <div class="collectible-header">
                <div class="collectible-info">
                  <h5>📀 ${record.name}</h5>
                  <span class="composer">by ${record.composer}</span>
                  ${isSpecial ? '<span class="special-badge">Special</span>' : ''}
                  ${isMissable ? '<span class="missable-badge">Missable</span>' : ''}
                </div>
                <div class="collection-toggle">
                  <input type="checkbox"
                         id="record-${index}"
                         ${isCollected ? 'checked' : ''}
                         data-type="record"
                         data-index="${index}">
                  <label for="record-${index}" class="checkbox-label">
                    <span class="checkmark">♪</span>
                  </label>
                </div>
              </div>

              <div class="collectible-description">
                <p>${record.description}</p>
              </div>

              <div class="collectible-location">
                <strong>Location:</strong>
                <span class="location-text ${!this.showSpoilers && isMissable ? 'spoiler-hidden' : ''}">
                  ${this.showSpoilers || !isMissable ? record.location : '[Spoiler Hidden]'}
                </span>
              </div>

              ${isSpecial && record.note ? `
                <div class="special-note">
                  <strong>📝 Note:</strong> ${record.note}
                </div>
              ` : ''}

              ${isMissable && record.missable_reason ? `
                <div class="missable-warning">
                  <strong>⚠️ Warning:</strong> ${record.missable_reason}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.attachCollectibleEventListeners(container);
  }

  /**
   * Render other collectibles
   */
  renderOtherCollectibles(container) {
    if (!this.collectiblesData?.other_collectibles) {
      container.innerHTML = '<div class="loading">Loading collectibles data...</div>';
      return;
    }

    const otherData = this.collectiblesData.other_collectibles;

    container.innerHTML = `
      <div class="collectibles-header">
        <h4>Other Collectibles</h4>
        <p>Special items, creatures, and materials found throughout the expedition.</p>
      </div>

      <div class="other-collectibles-sections">
        ${this.renderGestrals(otherData.gestrals)}
        ${this.renderEsquieRocks(otherData.esquie_rocks)}
        ${this.renderWhiteNevron(otherData.white_nevron)}
        ${this.renderPaintCages(otherData.paint_cages)}
      </div>
    `;

    this.attachOtherCollectibleEventListeners(container);
  }

  /**
   * Render Gestrals section
   */
  renderGestrals(gestralsData) {
    if (!gestralsData) return '';

    const currentCount = this.userProgress.gestrals || 0;

    return `
      <div class="collectible-section">
        <div class="section-header">
          <h5>🦋 Gestrals (${currentCount}/${gestralsData.total})</h5>
          <p>${gestralsData.description}</p>
        </div>

        <div class="gestral-counter">
          <label for="gestral-count">Gestrals Found:</label>
          <input type="number"
                 id="gestral-count"
                 min="0"
                 max="${gestralsData.total}"
                 value="${currentCount}"
                 data-type="gestrals">
          <span class="counter-max">/ ${gestralsData.total}</span>
        </div>

        <div class="gestral-locations">
          ${gestralsData.locations?.map((location, index) => `
            <div class="gestral-location ${index < currentCount ? 'found' : ''}">
              <div class="location-info">
                <h6>${location.name}</h6>
                <p><strong>Location:</strong> ${this.showSpoilers ? location.location : '[Spoiler Hidden]'}</p>
                ${this.showSpoilers ? `<p><em>Hint: ${location.hint}</em></p>` : ''}
                <p><strong>Unlocks:</strong> ${location.ability_unlock}</p>
              </div>
              <div class="found-indicator">
                ${index < currentCount ? '✓' : '?'}
              </div>
            </div>
          `).join('') || ''}
        </div>
      </div>
    `;
  }

  /**
   * Render Esquie Rocks section
   */
  renderEsquieRocks(rocksData) {
    if (!rocksData) return '';

    const userRocks = this.userProgress.esquie_rocks || [];

    return `
      <div class="collectible-section">
        <div class="section-header">
          <h5>🪨 Esquie's Rocks (${userRocks.length}/${rocksData.total})</h5>
          <p>${rocksData.description}</p>
        </div>

        <div class="esquie-rocks">
          ${rocksData.locations?.map((rock, index) => {
            const isCollected = userRocks.includes(rock.ability);
            const isAvailable = !rock.requires || userRocks.includes(rock.requires);

            return `
              <div class="esquie-rock ${isCollected ? 'collected' : ''} ${!isAvailable ? 'locked' : ''}">
                <div class="rock-header">
                  <h6>${rock.name}</h6>
                  <input type="checkbox"
                         id="rock-${index}"
                         ${isCollected ? 'checked' : ''}
                         ${!isAvailable ? 'disabled' : ''}
                         data-type="esquie_rock"
                         data-ability="${rock.ability}">
                  <label for="rock-${index}" class="checkbox-label">
                    <span class="checkmark">✓</span>
                  </label>
                </div>
                <p><strong>Ability:</strong> ${rock.ability}</p>
                <p>${rock.description}</p>
                <p><strong>Location:</strong> ${this.showSpoilers ? rock.location : '[Spoiler Hidden]'}</p>
                ${rock.requires ? `<p><strong>Requires:</strong> ${rock.requires}</p>` : ''}
              </div>
            `;
          }).join('') || ''}
        </div>
      </div>
    `;
  }

  /**
   * Render White Nevron section
   */
  renderWhiteNevron(nevronData) {
    if (!nevronData) return '';

    const userNevron = this.userProgress.white_nevron || [];
    const collectedCount = userNevron.filter(Boolean).length;

    return `
      <div class="collectible-section">
        <div class="section-header">
          <h5>💎 White Nevron (${collectedCount}/${nevronData.total})</h5>
          <p>${nevronData.description}</p>
        </div>

        <div class="white-nevron-grid">
          ${nevronData.locations?.map((location, index) => {
            const isCollected = userNevron[index] || false;

            return `
              <div class="nevron-item ${isCollected ? 'collected' : ''}">
                <div class="nevron-header">
                  <span class="nevron-number">#${index + 1}</span>
                  <input type="checkbox"
                         id="nevron-${index}"
                         ${isCollected ? 'checked' : ''}
                         data-type="white_nevron"
                         data-index="${index}">
                  <label for="nevron-${index}" class="checkbox-label">
                    <span class="checkmark">✓</span>
                  </label>
                </div>
                <p class="nevron-location">
                  ${this.showSpoilers ? location : '[Spoiler Hidden]'}
                </p>
              </div>
            `;
          }).join('') || ''}
        </div>
      </div>
    `;
  }

  /**
   * Render Paint Cages section
   */
  renderPaintCages(cagesData) {
    if (!cagesData) return '';

    const userCages = this.userProgress.paint_cages || { basic: [], advanced: [], legendary: [] };

    return `
      <div class="collectible-section">
        <div class="section-header">
          <h5>🎨 Paint Cages (${this.getTotalPaintCages()}/${cagesData.total})</h5>
          <p>${cagesData.description}</p>
        </div>

        ${Object.entries(cagesData.categories).map(([category, data]) => {
          const userCategory = userCages[category] || [];
          const collectedCount = userCategory.filter(Boolean).length;

          return `
            <div class="paint-cage-category">
              <h6>${category.charAt(0).toUpperCase() + category.slice(1)} Paint Cages (${collectedCount}/${data.count})</h6>

              <div class="paint-materials">
                ${data.materials.map(material => `
                  <span class="paint-material ${category}">${material}</span>
                `).join('')}
              </div>

              <div class="cage-counter">
                <label for="cage-${category}">Found:</label>
                <input type="number"
                       id="cage-${category}"
                       min="0"
                       max="${data.count}"
                       value="${collectedCount}"
                       data-type="paint_cage"
                       data-category="${category}">
                <span class="counter-max">/ ${data.count}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Get total paint cages collected
   */
  getTotalPaintCages() {
    const cages = this.userProgress.paint_cages || {};
    return (cages.basic?.filter(Boolean).length || 0) +
           (cages.advanced?.filter(Boolean).length || 0) +
           (cages.legendary?.filter(Boolean).length || 0);
  }

  /**
   * Attach event listeners for collectible items
   */
  attachCollectibleEventListeners(container) {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', this.handleItemToggle);
    });
  }

  /**
   * Attach event listeners for other collectibles
   */
  attachOtherCollectibleEventListeners(container) {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    const numberInputs = container.querySelectorAll('input[type="number"]');

    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', this.handleItemToggle);
    });

    numberInputs.forEach(input => {
      input.addEventListener('change', this.handleItemToggle);
    });
  }

  /**
   * Handle item toggle (collected/not collected)
   */
  handleItemToggle(event) {
    const input = event.target;
    const type = input.dataset.type;
    const index = input.dataset.index;
    const category = input.dataset.category;
    const ability = input.dataset.ability;

    switch (type) {
      case 'journal':
        this.userProgress.journals[index] = input.checked;
        break;

      case 'record':
        this.userProgress.records[index] = input.checked;
        break;

      case 'gestrals':
        this.userProgress.gestrals = parseInt(input.value) || 0;
        this.updateGestralDisplay();
        break;

      case 'esquie_rock':
        if (input.checked) {
          if (!this.userProgress.esquie_rocks.includes(ability)) {
            this.userProgress.esquie_rocks.push(ability);
          }
        } else {
          this.userProgress.esquie_rocks = this.userProgress.esquie_rocks.filter(a => a !== ability);
        }
        break;

      case 'white_nevron':
        this.userProgress.white_nevron[index] = input.checked;
        break;

      case 'paint_cage':
        const count = parseInt(input.value) || 0;
        const maxCount = parseInt(input.max) || 0;

        // Update the category array
        if (!this.userProgress.paint_cages[category]) {
          this.userProgress.paint_cages[category] = [];
        }

        // Fill array with true/false values based on count
        for (let i = 0; i < maxCount; i++) {
          this.userProgress.paint_cages[category][i] = i < count;
        }
        break;
    }

    // Save progress
    this.saveProgress();
    this.updateOverallProgress();
    this.renderCategoryTabs();

    // Show feedback
    const collectibleName = this.getCollectibleName(type, index, category, ability);
    const action = input.checked || (input.type === 'number' && input.value > 0) ? 'marked as collected' : 'unmarked';
    this.showToast(`${collectibleName} ${action}`, 'success');
  }

  /**
   * Update Gestral display after count change
   */
  updateGestralDisplay() {
    const locations = document.querySelectorAll('.gestral-location');
    const count = this.userProgress.gestrals || 0;

    locations.forEach((location, index) => {
      location.classList.toggle('found', index < count);
      const indicator = location.querySelector('.found-indicator');
      if (indicator) {
        indicator.textContent = index < count ? '✓' : '?';
      }
    });
  }

  /**
   * Get collectible name for notifications
   */
  getCollectibleName(type, index, category, ability) {
    switch (type) {
      case 'journal':
        return `Journal #${parseInt(index) + 1}`;
      case 'record':
        return `Music Record #${parseInt(index) + 1}`;
      case 'gestrals':
        return 'Gestrals';
      case 'esquie_rock':
        return `Esquie Rock (${ability})`;
      case 'white_nevron':
        return `White Nevron #${parseInt(index) + 1}`;
      case 'paint_cage':
        return `${category} Paint Cages`;
      default:
        return 'Collectible';
    }
  }

  /**
   * Handle spoiler toggle
   */
  handleSpoilerToggle() {
    this.showSpoilers = !this.showSpoilers;

    // Update settings
    const settings = this.storage.loadSettings();
    settings.showSpoilers = this.showSpoilers;
    this.storage.saveSettings(settings);

    // Re-render current category
    this.renderCurrentCategory();

    this.showToast(`Spoilers ${this.showSpoilers ? 'enabled' : 'disabled'}`, 'info');
  }

  /**
   * Handle import save data
   */
  handleImportSave() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          this.importProgressData(data);
        } catch (error) {
          this.showToast('Invalid file format', 'error');
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }

  /**
   * Import progress data from file
   */
  importProgressData(data) {
    if (data.collectibles) {
      this.userProgress = { ...this.userProgress, ...data.collectibles };
      this.saveProgress();
      this.updateOverallProgress();
      this.renderCategoryTabs();
      this.renderCurrentCategory();
      this.showToast('Progress imported successfully!', 'success');
    } else {
      this.showToast('No collectibles data found in file', 'warning');
    }
  }

  /**
   * Handle export progress
   */
  handleExportProgress() {
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      collectibles: this.userProgress,
      summary: this.getProgressSummary()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `expedition33_collectibles_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('Progress exported successfully!', 'success');
  }

  /**
   * Get progress summary for export
   */
  getProgressSummary() {
    const journalsCompleted = this.userProgress.journals?.filter(Boolean).length || 0;
    const recordsCompleted = this.userProgress.records?.filter(Boolean).length || 0;
    const gestralsFound = this.userProgress.gestrals || 0;
    const esquieRocksFound = this.userProgress.esquie_rocks?.length || 0;
    const whiteNevronFound = this.userProgress.white_nevron?.filter(Boolean).length || 0;
    const paintCagesFound = this.getTotalPaintCages();

    const totalItems = journalsCompleted + recordsCompleted + gestralsFound + esquieRocksFound + whiteNevronFound + paintCagesFound;
    const maxItems = GAME_CONSTANTS.JOURNAL_COUNT + GAME_CONSTANTS.MUSIC_RECORD_COUNT +
                     GAME_CONSTANTS.GESTRAL_COUNT + GAME_CONSTANTS.ESQUIE_ROCK_COUNT +
                     GAME_CONSTANTS.WHITE_NEVRON_COUNT + GAME_CONSTANTS.PAINT_CAGE_COUNT;

    return {
      totalCompleted: totalItems,
      totalAvailable: maxItems,
      completionPercentage: Math.round((totalItems / maxItems) * 100),
      categories: {
        journals: `${journalsCompleted}/${GAME_CONSTANTS.JOURNAL_COUNT}`,
        records: `${recordsCompleted}/${GAME_CONSTANTS.MUSIC_RECORD_COUNT}`,
        gestrals: `${gestralsFound}/${GAME_CONSTANTS.GESTRAL_COUNT}`,
        esquie_rocks: `${esquieRocksFound}/${GAME_CONSTANTS.ESQUIE_ROCK_COUNT}`,
        white_nevron: `${whiteNevronFound}/${GAME_CONSTANTS.WHITE_NEVRON_COUNT}`,
        paint_cages: `${paintCagesFound}/${GAME_CONSTANTS.PAINT_CAGE_COUNT}`
      }
    };
  }

  /**
   * Update overall progress display
   */
  updateOverallProgress() {
    const progressElement = document.getElementById('overall-progress');
    if (!progressElement) return;

    const summary = this.getProgressSummary();
    const { percentage, class: progressClass } = formatCompletion(summary.totalCompleted, summary.totalAvailable);

    progressElement.textContent = `${percentage}% Complete (${summary.totalCompleted}/${summary.totalAvailable})`;
    progressElement.className = `progress-summary ${progressClass}`;
  }

  /**
   * Save progress to storage
   */
  saveProgress() {
    this.storage.saveCollectibles(this.userProgress);
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
   * Refresh the collectibles tracker
   */
  refresh() {
    this.loadUserProgress();
    this.updateOverallProgress();
    this.renderCategoryTabs();
    this.renderCurrentCategory();
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