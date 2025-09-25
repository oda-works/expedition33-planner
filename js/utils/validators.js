// Validation utilities for Expedition 33 Planner
import { VALIDATION_RULES, GAME_CONSTANTS, APP_CONFIG } from './constants.js';

/**
 * Validates character level
 * @param {number} level - The level to validate
 * @param {boolean} isNewGamePlus - Whether this is NG+ mode
 * @returns {Object} Validation result with isValid boolean and error message
 */
export function validateLevel(level, isNewGamePlus = false) {
  const maxLevel = isNewGamePlus ? VALIDATION_RULES.LEVEL.MAX_NG_PLUS : VALIDATION_RULES.LEVEL.MAX;

  if (!Number.isInteger(level)) {
    return { isValid: false, error: 'Level must be a whole number' };
  }

  if (level < VALIDATION_RULES.LEVEL.MIN) {
    return { isValid: false, error: `Level must be at least ${VALIDATION_RULES.LEVEL.MIN}` };
  }

  if (level > maxLevel) {
    return { isValid: false, error: `Level cannot exceed ${maxLevel}` };
  }

  return { isValid: true };
}

/**
 * Validates attribute point distribution
 * @param {Object} attributes - Object with attribute values
 * @param {number} characterLevel - Character's current level
 * @returns {Object} Validation result
 */
export function validateAttributes(attributes, characterLevel) {
  const totalPoints = Object.values(attributes).reduce((sum, val) => sum + val, 0);
  const maxPoints = getMaxAttributePointsForLevel(characterLevel);

  // Check if any attribute exceeds maximum
  for (const [attr, value] of Object.entries(attributes)) {
    if (!Number.isInteger(value)) {
      return { isValid: false, error: `${attr} must be a whole number` };
    }

    if (value < VALIDATION_RULES.ATTRIBUTE_POINTS.MIN) {
      return { isValid: false, error: `${attr} cannot be negative` };
    }

    if (value > VALIDATION_RULES.ATTRIBUTE_POINTS.MAX_PER_STAT) {
      return { isValid: false, error: `${attr} cannot exceed ${VALIDATION_RULES.ATTRIBUTE_POINTS.MAX_PER_STAT}` };
    }
  }

  // Check total points
  if (totalPoints > maxPoints) {
    return {
      isValid: false,
      error: `Total attribute points (${totalPoints}) exceeds maximum for level ${characterLevel} (${maxPoints})`
    };
  }

  return { isValid: true, remainingPoints: maxPoints - totalPoints };
}

/**
 * Validates Lumina point allocation
 * @param {Array} luminas - Array of equipped luminas
 * @param {number} characterLevel - Character's current level
 * @param {boolean} isNewGamePlus - Whether this is NG+ mode
 * @returns {Object} Validation result
 */
export function validateLuminas(luminas, characterLevel, isNewGamePlus = false) {
  const totalCost = luminas.reduce((sum, lumina) => sum + (lumina.cost || 0), 0);
  const maxPoints = getMaxLuminaPointsForLevel(characterLevel, isNewGamePlus);

  if (totalCost > maxPoints) {
    return {
      isValid: false,
      error: `Lumina cost (${totalCost}) exceeds maximum for level ${characterLevel} (${maxPoints})`
    };
  }

  // Check for duplicate unique luminas
  const uniqueLuminas = luminas.filter(l => l.unique);
  const uniqueIds = new Set();

  for (const lumina of uniqueLuminas) {
    if (uniqueIds.has(lumina.id)) {
      return { isValid: false, error: `Cannot equip multiple ${lumina.name} (unique item)` };
    }
    uniqueIds.add(lumina.id);
  }

  // Check NG+ only luminas
  if (!isNewGamePlus) {
    const ngPlusOnlyLuminas = luminas.filter(l => l.new_game_plus_only);
    if (ngPlusOnlyLuminas.length > 0) {
      return {
        isValid: false,
        error: `${ngPlusOnlyLuminas[0].name} is only available in New Game+`
      };
    }
  }

  return { isValid: true, remainingPoints: maxPoints - totalCost };
}

/**
 * Validates Pictos selection
 * @param {Array} pictos - Array of equipped pictos
 * @param {Object} masteredPictos - Object tracking mastered pictos
 * @returns {Object} Validation result
 */
export function validatePictos(pictos, masteredPictos = {}) {
  if (pictos.length > GAME_CONSTANTS.MAX_PICTOS_EQUIPPED) {
    return {
      isValid: false,
      error: `Cannot equip more than ${GAME_CONSTANTS.MAX_PICTOS_EQUIPPED} Pictos`
    };
  }

  // Check for duplicates
  const pictosIds = pictos.map(p => p.id);
  const uniqueIds = new Set(pictosIds);

  if (uniqueIds.size !== pictosIds.length) {
    return { isValid: false, error: 'Cannot equip duplicate Pictos' };
  }

  // Check mastery requirements for higher level variants
  for (const pictos of pictos) {
    if (pictos.level > 1) {
      const masteryCount = masteredPictos[pictos.id] || 0;
      const requiredMastery = pictos.mastery_requirement || 0;

      if (masteryCount < requiredMastery) {
        return {
          isValid: false,
          error: `${pictos.name} Level ${pictos.level} requires ${requiredMastery} mastery (current: ${masteryCount})`
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Validates party composition
 * @param {Object} party - Party object with active and reserve arrays
 * @returns {Object} Validation result
 */
export function validateParty(party) {
  const { active = [], reserve = [] } = party;

  if (active.length > GAME_CONSTANTS.ACTIVE_PARTY_SIZE) {
    return {
      isValid: false,
      error: `Active party cannot exceed ${GAME_CONSTANTS.ACTIVE_PARTY_SIZE} characters`
    };
  }

  if (reserve.length > GAME_CONSTANTS.RESERVE_PARTY_SIZE) {
    return {
      isValid: false,
      error: `Reserve party cannot exceed ${GAME_CONSTANTS.RESERVE_PARTY_SIZE} characters`
    };
  }

  // Check for duplicate characters
  const allCharacters = [...active, ...reserve].filter(c => c !== null);
  const uniqueCharacters = new Set(allCharacters.map(c => c.id));

  if (uniqueCharacters.size !== allCharacters.length) {
    return { isValid: false, error: 'Cannot have duplicate characters in party' };
  }

  // Check if active party has at least one character
  const activeCharacterCount = active.filter(c => c !== null).length;
  if (activeCharacterCount === 0) {
    return { isValid: false, error: 'Active party must have at least one character' };
  }

  return { isValid: true };
}

/**
 * Validates build name
 * @param {string} name - Build name to validate
 * @returns {Object} Validation result
 */
export function validateBuildName(name) {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Build name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < VALIDATION_RULES.BUILD_NAME.MIN_LENGTH) {
    return { isValid: false, error: 'Build name is too short' };
  }

  if (trimmedName.length > VALIDATION_RULES.BUILD_NAME.MAX_LENGTH) {
    return { isValid: false, error: 'Build name is too long' };
  }

  if (!VALIDATION_RULES.BUILD_NAME.PATTERN.test(trimmedName)) {
    return { isValid: false, error: 'Build name contains invalid characters' };
  }

  return { isValid: true };
}

/**
 * Validates complete build data structure
 * @param {Object} buildData - Complete build data object
 * @returns {Object} Validation result
 */
export function validateBuildData(buildData) {
  if (!buildData || typeof buildData !== 'object') {
    return { isValid: false, error: 'Invalid build data format' };
  }

  const requiredFields = ['version', 'character', 'level', 'attributes'];
  const missingFields = requiredFields.filter(field => !(field in buildData));

  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  // Validate version compatibility
  if (buildData.version !== APP_CONFIG.STORAGE_VERSION) {
    return {
      isValid: false,
      error: `Build data version ${buildData.version} is not compatible with current version ${APP_CONFIG.STORAGE_VERSION}`
    };
  }

  // Validate individual components
  const levelValidation = validateLevel(buildData.level, buildData.newGamePlus);
  if (!levelValidation.isValid) {
    return levelValidation;
  }

  const attributesValidation = validateAttributes(buildData.attributes, buildData.level);
  if (!attributesValidation.isValid) {
    return attributesValidation;
  }

  if (buildData.luminas) {
    const luminasValidation = validateLuminas(buildData.luminas, buildData.level, buildData.newGamePlus);
    if (!luminasValidation.isValid) {
      return luminasValidation;
    }
  }

  if (buildData.pictos) {
    const pictosValidation = validatePictos(buildData.pictos, buildData.masteredPictos);
    if (!pictosValidation.isValid) {
      return pictosValidation;
    }
  }

  return { isValid: true };
}

/**
 * Validates file upload data
 * @param {string} fileData - Raw file data
 * @param {string} expectedType - Expected file type ('json' or 'url')
 * @returns {Object} Validation result with parsed data
 */
export function validateFileData(fileData, expectedType = 'json') {
  if (!fileData || typeof fileData !== 'string') {
    return { isValid: false, error: 'Invalid file data' };
  }

  if (expectedType === 'json') {
    try {
      const parsedData = JSON.parse(fileData);
      return { isValid: true, data: parsedData };
    } catch (error) {
      return { isValid: false, error: 'Invalid JSON format' };
    }
  }

  if (expectedType === 'url') {
    try {
      const url = new URL(fileData);
      return { isValid: true, data: url };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  return { isValid: false, error: 'Unknown validation type' };
}

/**
 * Sanitizes user input to prevent XSS
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  return input
    .replace(/[<>'"&]/g, (match) => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match];
    })
    .trim();
}

/**
 * Gets maximum attribute points for a given level
 * @param {number} level - Character level
 * @returns {number} Maximum attribute points
 */
function getMaxAttributePointsForLevel(level) {
  // Progressive attribute point allocation
  if (level <= 10) return Math.floor(level * 2);
  if (level <= 20) return 20 + Math.floor((level - 10) * 3);
  if (level <= 30) return 50 + Math.floor((level - 20) * 4);
  if (level <= 40) return 90 + Math.floor((level - 30) * 5);
  return 140 + Math.floor((level - 40) * 6);
}

/**
 * Gets maximum Lumina points for a given level
 * @param {number} level - Character level
 * @param {boolean} isNewGamePlus - Whether this is NG+ mode
 * @returns {number} Maximum Lumina points
 */
function getMaxLuminaPointsForLevel(level, isNewGamePlus = false) {
  const basePoints = Math.floor(level / 2.5) + 2;
  const maxPoints = isNewGamePlus ? APP_CONFIG.MAX_LUMINA_POINTS_NG_PLUS : APP_CONFIG.MAX_LUMINA_POINTS;
  return Math.min(basePoints, maxPoints);
}