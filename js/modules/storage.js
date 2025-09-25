// Local storage management for Expedition 33 Planner
import { APP_CONFIG, FEATURES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants.js';
import { validateBuildData } from '../utils/validators.js';

/**
 * Storage manager class for handling localStorage operations
 */
export class StorageManager {
  constructor() {
    this.storageAvailable = FEATURES.LOCAL_STORAGE;
    this.storageKey = APP_CONFIG.STORAGE_KEY;
    this.version = APP_CONFIG.STORAGE_VERSION;
  }

  /**
   * Initialize storage with default data structure
   * @returns {Object} Default storage data
   */
  initializeStorage() {
    const defaultData = {
      version: this.version,
      lastUpdated: new Date().toISOString(),
      settings: {
        theme: 'theme-dark',
        autoSave: true,
        showSpoilers: false,
        showHints: true,
        compactMode: false,
        soundEffects: true,
        animations: !FEATURES.REDUCED_MOTION
      },
      characters: {},
      party: {
        active: [null, null, null],
        reserve: [null, null, null]
      },
      collectibles: {
        journals: new Array(49).fill(false),
        records: new Array(33).fill(false),
        gestrals: 0,
        esquie_rocks: [],
        white_nevron: new Array(12).fill(false),
        paint_cages: {
          basic: new Array(10).fill(false),
          advanced: new Array(10).fill(false),
          legendary: new Array(5).fill(false)
        }
      },
      savedBuilds: [],
      masteredPictos: {},
      achievementProgress: {},
      unlockedAchievements: [],
      playthrough: {
        newGamePlus: false,
        playCount: 1,
        completionPercentage: 0
      },
      statistics: {
        totalPlayTime: 0,
        buildsCreated: 0,
        charactersSwitched: 0,
        lastActive: new Date().toISOString()
      }
    };

    if (this.storageAvailable) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
      } catch (error) {
        console.warn('Failed to initialize storage:', error);
      }
    }

    return defaultData;
  }

  /**
   * Load all data from localStorage
   * @returns {Object} Complete storage data or default data
   */
  loadData() {
    if (!this.storageAvailable) {
      console.warn(ERROR_MESSAGES.STORAGE_UNAVAILABLE);
      return this.initializeStorage();
    }

    try {
      const storedData = localStorage.getItem(this.storageKey);

      if (!storedData) {
        return this.initializeStorage();
      }

      const parsedData = JSON.parse(storedData);

      // Version migration if needed
      const migratedData = this.migrateData(parsedData);

      return migratedData;
    } catch (error) {
      console.error('Failed to load data from storage:', error);
      return this.initializeStorage();
    }
  }

  /**
   * Save complete data to localStorage
   * @param {Object} data - Complete data object to save
   * @returns {boolean} Success status
   */
  saveData(data) {
    if (!this.storageAvailable) {
      console.warn(ERROR_MESSAGES.STORAGE_UNAVAILABLE);
      return false;
    }

    try {
      const dataToSave = {
        ...data,
        lastUpdated: new Date().toISOString(),
        version: this.version
      };

      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error(ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED);
      } else {
        console.error('Failed to save data to storage:', error);
      }
      return false;
    }
  }

  /**
   * Save character build data
   * @param {string} characterId - Character identifier
   * @param {Object} buildData - Character build data
   * @returns {boolean} Success status
   */
  saveCharacterBuild(characterId, buildData) {
    const data = this.loadData();

    data.characters[characterId] = {
      ...buildData,
      lastModified: new Date().toISOString()
    };

    return this.saveData(data);
  }

  /**
   * Load character build data
   * @param {string} characterId - Character identifier
   * @returns {Object|null} Character build data or null
   */
  loadCharacterBuild(characterId) {
    const data = this.loadData();
    return data.characters[characterId] || null;
  }

  /**
   * Save party composition
   * @param {Object} partyData - Party composition data
   * @returns {boolean} Success status
   */
  saveParty(partyData) {
    const data = this.loadData();
    data.party = partyData;
    return this.saveData(data);
  }

  /**
   * Load party composition
   * @returns {Object} Party composition data
   */
  loadParty() {
    const data = this.loadData();
    return data.party || { active: [null, null, null], reserve: [null, null, null] };
  }

  /**
   * Save user settings
   * @param {Object} settings - Settings object
   * @returns {boolean} Success status
   */
  saveSettings(settings) {
    const data = this.loadData();
    data.settings = { ...data.settings, ...settings };
    return this.saveData(data);
  }

  /**
   * Load user settings
   * @returns {Object} Settings object
   */
  loadSettings() {
    const data = this.loadData();
    return data.settings || {};
  }

  /**
   * Save collectibles progress
   * @param {Object} collectibles - Collectibles data
   * @returns {boolean} Success status
   */
  saveCollectibles(collectibles) {
    const data = this.loadData();
    data.collectibles = { ...data.collectibles, ...collectibles };
    return this.saveData(data);
  }

  /**
   * Load collectibles progress
   * @returns {Object} Collectibles data
   */
  loadCollectibles() {
    const data = this.loadData();
    return data.collectibles || {};
  }

  /**
   * Save a named build
   * @param {Object} buildData - Build data with name
   * @returns {boolean} Success status
   */
  saveBuild(buildData) {
    const validation = validateBuildData(buildData);
    if (!validation.isValid) {
      console.error('Invalid build data:', validation.error);
      return false;
    }

    const data = this.loadData();
    const buildToSave = {
      ...buildData,
      id: this.generateBuildId(),
      createdAt: new Date().toISOString(),
      version: this.version
    };

    data.savedBuilds = data.savedBuilds || [];
    data.savedBuilds.push(buildToSave);
    data.statistics.buildsCreated = (data.statistics.buildsCreated || 0) + 1;

    return this.saveData(data);
  }

  /**
   * Load all saved builds
   * @returns {Array} Array of saved builds
   */
  loadSavedBuilds() {
    const data = this.loadData();
    return data.savedBuilds || [];
  }

  /**
   * Delete a saved build
   * @param {string} buildId - Build identifier
   * @returns {boolean} Success status
   */
  deleteBuild(buildId) {
    const data = this.loadData();
    data.savedBuilds = data.savedBuilds.filter(build => build.id !== buildId);
    return this.saveData(data);
  }

  /**
   * Export data as JSON string
   * @param {Object} options - Export options
   * @returns {Object} Export result with data or error
   */
  exportData(options = {}) {
    const { includeSettings = true, includeBuilds = true, includeCollectibles = true } = options;

    try {
      const data = this.loadData();
      const exportData = {
        version: this.version,
        exportDate: new Date().toISOString(),
        appVersion: APP_CONFIG.VERSION
      };

      if (includeSettings) {
        exportData.settings = data.settings;
      }

      if (includeBuilds) {
        exportData.characters = data.characters;
        exportData.party = data.party;
        exportData.savedBuilds = data.savedBuilds;
        exportData.masteredPictos = data.masteredPictos;
      }

      if (includeCollectibles) {
        exportData.collectibles = data.collectibles;
        exportData.playthrough = data.playthrough;
      }

      return {
        success: true,
        data: JSON.stringify(exportData, null, 2),
        filename: `expedition33_backup_${new Date().toISOString().split('T')[0]}.json`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Import data from JSON string
   * @param {string} jsonData - JSON data to import
   * @param {Object} options - Import options
   * @returns {Object} Import result
   */
  importData(jsonData, options = {}) {
    const { merge = true, validateOnly = false } = options;

    try {
      const importedData = JSON.parse(jsonData);

      // Validate imported data structure
      if (!importedData.version || !importedData.exportDate) {
        return {
          success: false,
          error: 'Invalid backup file format'
        };
      }

      if (validateOnly) {
        return { success: true, valid: true };
      }

      const currentData = merge ? this.loadData() : this.initializeStorage();

      // Merge or replace data sections
      if (importedData.settings) {
        currentData.settings = merge ?
          { ...currentData.settings, ...importedData.settings } :
          importedData.settings;
      }

      if (importedData.characters) {
        currentData.characters = merge ?
          { ...currentData.characters, ...importedData.characters } :
          importedData.characters;
      }

      if (importedData.party) {
        currentData.party = importedData.party;
      }

      if (importedData.savedBuilds) {
        if (merge) {
          const existingIds = new Set(currentData.savedBuilds.map(b => b.id));
          const newBuilds = importedData.savedBuilds.filter(b => !existingIds.has(b.id));
          currentData.savedBuilds = [...currentData.savedBuilds, ...newBuilds];
        } else {
          currentData.savedBuilds = importedData.savedBuilds;
        }
      }

      if (importedData.collectibles) {
        currentData.collectibles = merge ?
          { ...currentData.collectibles, ...importedData.collectibles } :
          importedData.collectibles;
      }

      if (importedData.masteredPictos) {
        currentData.masteredPictos = merge ?
          { ...currentData.masteredPictos, ...importedData.masteredPictos } :
          importedData.masteredPictos;
      }

      if (importedData.playthrough) {
        currentData.playthrough = merge ?
          { ...currentData.playthrough, ...importedData.playthrough } :
          importedData.playthrough;
      }

      const saveSuccess = this.saveData(currentData);

      return {
        success: saveSuccess,
        imported: saveSuccess ? Object.keys(importedData).filter(key =>
          !['version', 'exportDate', 'appVersion'].includes(key)
        ) : []
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear all stored data
   * @returns {boolean} Success status
   */
  clearAllData() {
    if (!this.storageAvailable) return false;

    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Get storage usage information
   * @returns {Object} Storage usage details
   */
  getStorageInfo() {
    if (!this.storageAvailable) {
      return { available: false };
    }

    try {
      const data = this.loadData();
      const dataSize = JSON.stringify(data).length;
      const totalQuota = 5 * 1024 * 1024; // 5MB typical limit

      return {
        available: true,
        usedBytes: dataSize,
        usedFormatted: this.formatBytes(dataSize),
        quotaBytes: totalQuota,
        quotaFormatted: this.formatBytes(totalQuota),
        percentageUsed: ((dataSize / totalQuota) * 100).toFixed(2)
      };
    } catch (error) {
      return { available: true, error: error.message };
    }
  }

  /**
   * Generate unique build ID
   * @returns {string} Unique build identifier
   */
  generateBuildId() {
    return 'build_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Migrate data from older versions
   * @param {Object} data - Data to migrate
   * @returns {Object} Migrated data
   */
  migrateData(data) {
    if (!data.version) {
      // Legacy data without version - initialize with current structure
      return this.initializeStorage();
    }

    // Version-specific migrations can be added here
    // For now, return data as-is since we're on the first version
    return {
      ...this.initializeStorage(),
      ...data,
      version: this.version
    };
  }

  /**
   * Load party data
   * @returns {Object} Party data
   */
  loadParty() {
    const data = this.loadData();
    return data.party || {
      active: [null, null, null],
      reserve: [null, null, null]
    };
  }

  /**
   * Save party data
   * @param {Object} partyData - Party data to save
   * @returns {boolean} Success status
   */
  saveParty(partyData) {
    const data = this.loadData();
    data.party = partyData;
    return this.saveData(data);
  }

  /**
   * Format bytes to human-readable string
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Create and export singleton instance
export const storage = new StorageManager();