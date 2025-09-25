// Data management for Expedition 33 Planner
import { ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Data manager class for loading and managing game data
 */
export class DataManager {
  constructor() {
    this.gameData = {
      characters: null,
      weapons: null,
      pictos: null,
      luminas: null,
      collectibles: null,
      synergies: null
    };
    this.loadPromise = null;
    this.isLoaded = false;
  }

  /**
   * Load all game data files
   * @returns {Promise<Object>} Promise that resolves to all game data
   */
  async loadAllData() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadDataFiles();
    return this.loadPromise;
  }

  /**
   * Internal method to load data files
   * @private
   * @returns {Promise<Object>} Promise that resolves to all game data
   */
  async _loadDataFiles() {
    try {
      const [
        charactersData,
        weaponsData,
        pictosData,
        luminasData,
        collectiblesData,
        synergiesData,
        bossesData
      ] = await Promise.all([
        this.loadJsonFile('data/characters.json'),
        // Try accurate data first, fallback to original
        this.loadJsonFile('data/weapons-accurate.json').catch(() =>
          this.loadJsonFile('data/weapons.json')
        ),
        this.loadJsonFile('data/pictos-accurate.json').catch(() =>
          this.loadJsonFile('data/pictos.json')
        ),
        this.loadJsonFile('data/luminas.json'),
        // Try accurate collectibles data first, fallback to original
        this.loadJsonFile('data/collectibles-accurate.json').catch(() =>
          this.loadJsonFile('data/collectibles.json')
        ),
        this.loadJsonFile('data/synergies.json'),
        // Load new bosses data
        this.loadJsonFile('data/bosses-accurate.json').catch(() => null)
      ]);

      this.gameData = {
        characters: charactersData,
        weapons: weaponsData,
        pictos: pictosData,
        luminas: luminasData,
        collectibles: collectiblesData,
        synergies: synergiesData,
        bosses: bossesData
      };

      this.isLoaded = true;
      return this.gameData;
    } catch (error) {
      console.error('Failed to load game data:', error);
      throw new Error(ERROR_MESSAGES.DATA_LOAD_FAILED);
    }
  }

  /**
   * Load a single JSON file
   * @param {string} url - URL of the JSON file
   * @returns {Promise<Object>} Promise that resolves to parsed JSON data
   */
  async loadJsonFile(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to load ${url}:`, error);
      throw error;
    }
  }

  /**
   * Get character data by ID
   * @param {string} characterId - Character identifier
   * @returns {Object|null} Character data or null if not found
   */
  getCharacter(characterId) {
    if (!this.gameData.characters) return null;
    return this.gameData.characters.characters[characterId] || null;
  }

  /**
   * Get all characters data
   * @returns {Object|null} All characters data or null if not loaded
   */
  getAllCharacters() {
    if (!this.gameData.characters) return null;
    return this.gameData.characters.characters;
  }

  /**
   * Get Pictos data by ID
   * @param {string} pictosId - Pictos identifier
   * @returns {Object|null} Pictos data or null if not found
   */
  getPictos(pictosId) {
    if (!this.gameData.pictos) return null;
    return this.gameData.pictos.pictos.find(p => p.id === pictosId) || null;
  }

  /**
   * Get all bosses data
   * @returns {Object|null} All bosses data or null if not loaded
   */
  getAllBosses() {
    if (!this.gameData.bosses) return null;
    return this.gameData.bosses.bosses;
  }

  /**
   * Get specific boss by ID
   * @param {string} bossId - The boss ID
   * @returns {Object|null} Boss data or null if not found
   */
  getBoss(bossId) {
    if (!this.gameData.bosses) return null;
    return this.gameData.bosses.bosses[bossId] || null;
  }

  /**
   * Get weapon data by ID
   * @param {string} weaponId - Weapon identifier
   * @returns {Object|null} Weapon data or null if not found
   */
  getWeapon(weaponId) {
    if (!this.gameData.weapons) return null;
    return this.gameData.weapons.weapons[weaponId] || null;
  }

  /**
   * Get weapons for a specific character
   * @param {string} characterId - Character identifier
   * @returns {Array} Array of weapon data for the character
   */
  getCharacterWeapons(characterId) {
    if (!this.gameData.weapons) return [];

    return Object.values(this.gameData.weapons.weapons)
      .filter(weapon => weapon.character === characterId);
  }

  /**
   * Get all Pictos data
   * @returns {Array} Array of all Pictos
   */
  getAllPictos() {
    if (!this.gameData.pictos) return [];
    return this.gameData.pictos.pictos || [];
  }

  /**
   * Get Pictos by type
   * @param {string} type - Pictos type (offensive, defensive, support)
   * @returns {Array} Array of Pictos of the specified type
   */
  getPictosByType(type) {
    if (!this.gameData.pictos) return [];
    return this.gameData.pictos.pictos.filter(p => p.type === type) || [];
  }

  /**
   * Get Lumina data by ID
   * @param {string} luminaId - Lumina identifier
   * @returns {Object|null} Lumina data or null if not found
   */
  getLumina(luminaId) {
    if (!this.gameData.luminas) return null;
    return this.gameData.luminas.luminas[luminaId] || null;
  }

  /**
   * Get all Luminas data
   * @returns {Object|null} All Luminas data or null if not loaded
   */
  getAllLuminas() {
    if (!this.gameData.luminas) return null;
    return this.gameData.luminas.luminas;
  }

  /**
   * Get Luminas by color
   * @param {string} color - Lumina color
   * @returns {Array} Array of Luminas of the specified color
   */
  getLuminasByColor(color) {
    if (!this.gameData.luminas) return [];
    return Object.values(this.gameData.luminas.luminas)
      .filter(l => l.color.toLowerCase() === color.toLowerCase()) || [];
  }

  /**
   * Get collectibles data
   * @returns {Object|null} Collectibles data or null if not loaded
   */
  getCollectibles() {
    return this.gameData.collectibles || null;
  }

  /**
   * Get expedition journals
   * @returns {Array} Array of expedition journals
   */
  getExpeditionJournals() {
    if (!this.gameData.collectibles) return [];
    return this.gameData.collectibles.expedition_journals || [];
  }

  /**
   * Get music records
   * @returns {Array} Array of music records
   */
  getMusicRecords() {
    if (!this.gameData.collectibles) return [];
    return this.gameData.collectibles.music_records || [];
  }

  /**
   * Get synergy data by type
   * @param {string} synergyType - Type of synergy
   * @returns {Object|null} Synergy data or null if not found
   */
  getSynergies(synergyType) {
    if (!this.gameData.synergies) return null;
    return this.gameData.synergies[synergyType] || null;
  }

  /**
   * Get character synergies
   * @returns {Object|null} Character synergies data
   */
  getCharacterSynergies() {
    return this.getSynergies('character_synergies');
  }

  /**
   * Get weapon synergies
   * @returns {Object|null} Weapon synergies data
   */
  getWeaponSynergies() {
    return this.getSynergies('weapon_synergies');
  }

  /**
   * Get Pictos synergies
   * @returns {Object|null} Pictos synergies data
   */
  getPictosSynergies() {
    return this.getSynergies('pictos_synergies');
  }

  /**
   * Calculate stats for character at specific level with attributes
   * @param {string} characterId - Character identifier
   * @param {number} level - Character level
   * @param {Object} attributes - Attribute distribution
   * @returns {Object|null} Calculated stats or null if character not found
   */
  calculateCharacterStats(characterId, level, attributes = {}) {
    const character = this.getCharacter(characterId);
    if (!character) return null;

    const baseStats = this._interpolateStatsForLevel(character.baseStats, level);
    const attributeBonus = this._calculateAttributeBonus(character.attributeScaling, attributes);

    const finalStats = {};
    for (const [stat, baseValue] of Object.entries(baseStats)) {
      finalStats[stat] = Math.floor(baseValue + (attributeBonus[stat] || 0));
    }

    return finalStats;
  }

  /**
   * Calculate maximum attribute points for level
   * @param {number} level - Character level
   * @returns {number} Maximum attribute points
   */
  getMaxAttributePoints(level) {
    if (!this.gameData.characters) return 0;

    const attributeData = this.gameData.characters.attributeMaxPoints;
    if (!attributeData) return 0;

    // Find the appropriate level bracket
    const levels = Object.keys(attributeData).map(Number).sort((a, b) => a - b);
    let maxPoints = 0;

    for (const levelBracket of levels) {
      if (level >= levelBracket) {
        maxPoints = attributeData[levelBracket];
      } else {
        break;
      }
    }

    return maxPoints;
  }

  /**
   * Calculate maximum Lumina points for level
   * @param {number} level - Character level
   * @returns {number} Maximum Lumina points
   */
  getMaxLuminaPoints(level) {
    if (!this.gameData.luminas) return 0;

    const luminaData = this.gameData.luminas.lumina_points_by_level;
    if (!luminaData) return 0;

    const levels = Object.keys(luminaData).map(Number).sort((a, b) => a - b);
    let maxPoints = 0;

    for (const levelBracket of levels) {
      if (level >= levelBracket) {
        maxPoints = luminaData[levelBracket];
      } else {
        break;
      }
    }

    return maxPoints;
  }

  /**
   * Search items by term
   * @param {string} searchTerm - Search term
   * @param {Array} categories - Categories to search in
   * @returns {Object} Search results organized by category
   */
  searchItems(searchTerm, categories = ['characters', 'weapons', 'pictos', 'luminas']) {
    if (!searchTerm || searchTerm.length < 2) return {};

    const results = {};
    const term = searchTerm.toLowerCase();

    if (categories.includes('characters') && this.gameData.characters) {
      results.characters = Object.values(this.gameData.characters.characters)
        .filter(c => c.name.toLowerCase().includes(term) ||
                    c.description.toLowerCase().includes(term));
    }

    if (categories.includes('weapons') && this.gameData.weapons) {
      results.weapons = Object.values(this.gameData.weapons.weapons)
        .filter(w => w.name.toLowerCase().includes(term) ||
                    w.description.toLowerCase().includes(term));
    }

    if (categories.includes('pictos') && this.gameData.pictos) {
      results.pictos = this.gameData.pictos.pictos
        .filter(p => p.name.toLowerCase().includes(term) ||
                    p.description.toLowerCase().includes(term) ||
                    p.effect.toLowerCase().includes(term));
    }

    if (categories.includes('luminas') && this.gameData.luminas) {
      results.luminas = Object.values(this.gameData.luminas.luminas)
        .filter(l => l.name.toLowerCase().includes(term) ||
                    l.effect.toLowerCase().includes(term));
    }

    return results;
  }

  /**
   * Interpolate stats between level 1 and level 50 values
   * @private
   * @param {Object} baseStats - Base stats with level1 and level50 values
   * @param {number} level - Target level
   * @returns {Object} Interpolated stats
   */
  _interpolateStatsForLevel(baseStats, level) {
    const level1Stats = baseStats.level1;
    const level50Stats = baseStats.level50;
    const interpolatedStats = {};

    for (const [stat, level1Value] of Object.entries(level1Stats)) {
      const level50Value = level50Stats[stat] || level1Value;
      const growth = (level50Value - level1Value) / 49; // 49 levels between 1 and 50
      interpolatedStats[stat] = level1Value + (growth * (level - 1));
    }

    return interpolatedStats;
  }

  /**
   * Calculate attribute bonuses from scaling
   * @private
   * @param {Object} attributeScaling - Attribute scaling data
   * @param {Object} attributes - Attribute values
   * @returns {Object} Calculated bonuses
   */
  _calculateAttributeBonus(attributeScaling, attributes) {
    const bonuses = {};

    for (const [attribute, value] of Object.entries(attributes)) {
      const scaling = attributeScaling[attribute];
      if (scaling) {
        for (const [stat, bonus] of Object.entries(scaling)) {
          bonuses[stat] = (bonuses[stat] || 0) + (bonus * value);
        }
      }
    }

    return bonuses;
  }

  /**
   * Check if data is loaded
   * @returns {boolean} True if all data is loaded
   */
  isDataLoaded() {
    return this.isLoaded;
  }

  /**
   * Get loading status
   * @returns {Object} Loading status information
   */
  getLoadingStatus() {
    return {
      isLoaded: this.isLoaded,
      isLoading: this.loadPromise && !this.isLoaded,
      hasError: this.loadPromise === null && !this.isLoaded
    };
  }
}

// Create and export singleton instance
export const dataManager = new DataManager();