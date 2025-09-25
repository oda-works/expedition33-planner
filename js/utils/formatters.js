// Formatting utilities for Expedition 33 Planner
import { RARITIES, LUMINA_COLORS, STATS } from './constants.js';

/**
 * Formats a number with appropriate suffixes (K, M, B)
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export function formatNumber(num, decimals = 1) {
  if (num === 0) return '0';
  if (isNaN(num) || !isFinite(num)) return 'N/A';

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1000000000) {
    return sign + (absNum / 1000000000).toFixed(decimals) + 'B';
  }
  if (absNum >= 1000000) {
    return sign + (absNum / 1000000).toFixed(decimals) + 'M';
  }
  if (absNum >= 1000) {
    return sign + (absNum / 1000).toFixed(decimals) + 'K';
  }

  return num.toString();
}

/**
 * Formats a percentage value
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 1) {
  if (isNaN(value) || !isFinite(value)) return 'N/A%';
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * Formats a stat value with appropriate units and styling
 * @param {string} statType - Type of stat (hp, attack, etc.)
 * @param {number} value - Stat value
 * @param {boolean} showSign - Whether to show + sign for positive values
 * @returns {string} Formatted stat string
 */
export function formatStat(statType, value, showSign = false) {
  if (isNaN(value) || !isFinite(value)) return 'N/A';

  let formattedValue = '';
  const sign = showSign && value > 0 ? '+' : '';

  switch (statType) {
    case STATS.HP:
      formattedValue = sign + formatNumber(value, 0);
      break;
    case STATS.ATTACK:
    case STATS.DEFENSE:
    case STATS.SPEED:
      formattedValue = sign + formatNumber(value, 0);
      break;
    case STATS.CRIT_RATE:
      formattedValue = sign + formatPercentage(value / 100, 1);
      break;
    case STATS.CRIT_DAMAGE:
      formattedValue = sign + value.toFixed(0) + '%';
      break;
    default:
      formattedValue = sign + formatNumber(value, 1);
  }

  return formattedValue;
}

/**
 * Formats rarity text with appropriate styling
 * @param {string} rarity - Rarity level
 * @returns {Object} Object with text and CSS class
 */
export function formatRarity(rarity) {
  const rarityData = {
    [RARITIES.COMMON]: { text: 'Common', class: 'rarity-common' },
    [RARITIES.UNCOMMON]: { text: 'Uncommon', class: 'rarity-uncommon' },
    [RARITIES.RARE]: { text: 'Rare', class: 'rarity-rare' },
    [RARITIES.EPIC]: { text: 'Epic', class: 'rarity-epic' },
    [RARITIES.LEGENDARY]: { text: 'Legendary', class: 'rarity-legendary' },
    [RARITIES.MYTHIC]: { text: 'Mythic', class: 'rarity-mythic' }
  };

  return rarityData[rarity] || { text: 'Unknown', class: 'rarity-unknown' };
}

/**
 * Formats Lumina color with appropriate styling
 * @param {string} color - Lumina color
 * @returns {Object} Object with text, CSS class, and hex color
 */
export function formatLuminaColor(color) {
  const colorData = {
    [LUMINA_COLORS.RED]: { text: 'Red', class: 'lumina-red', hex: '#EF4444' },
    [LUMINA_COLORS.BLUE]: { text: 'Blue', class: 'lumina-blue', hex: '#3B82F6' },
    [LUMINA_COLORS.GREEN]: { text: 'Green', class: 'lumina-green', hex: '#22C55E' },
    [LUMINA_COLORS.YELLOW]: { text: 'Yellow', class: 'lumina-yellow', hex: '#EAB308' },
    [LUMINA_COLORS.PURPLE]: { text: 'Purple', class: 'lumina-purple', hex: '#A855F7' },
    [LUMINA_COLORS.ORANGE]: { text: 'Orange', class: 'lumina-orange', hex: '#F97316' },
    [LUMINA_COLORS.CYAN]: { text: 'Cyan', class: 'lumina-cyan', hex: '#06B6D4' },
    [LUMINA_COLORS.PINK]: { text: 'Pink', class: 'lumina-pink', hex: '#EC4899' },
    [LUMINA_COLORS.WHITE]: { text: 'White', class: 'lumina-white', hex: '#FFFFFF' },
    [LUMINA_COLORS.BLACK]: { text: 'Black', class: 'lumina-black', hex: '#000000' },
    [LUMINA_COLORS.GOLD]: { text: 'Gold', class: 'lumina-gold', hex: '#D4AF37' },
    [LUMINA_COLORS.SILVER]: { text: 'Silver', class: 'lumina-silver', hex: '#C0C0C0' },
    [LUMINA_COLORS.RAINBOW]: { text: 'Rainbow', class: 'lumina-rainbow', hex: 'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)' },
    [LUMINA_COLORS.VOID]: { text: 'Void', class: 'lumina-void', hex: '#1a0033' },
    [LUMINA_COLORS.CRYSTAL]: { text: 'Crystal', class: 'lumina-crystal', hex: '#e6e6fa' }
  };

  return colorData[color] || { text: 'Unknown', class: 'lumina-unknown', hex: '#9CA3AF' };
}

/**
 * Formats character role with appropriate styling
 * @param {string} role - Character role
 * @returns {Object} Object with text and CSS class
 */
export function formatRole(role) {
  const roleData = {
    tank: { text: 'Tank', class: 'role-tank' },
    dps: { text: 'DPS', class: 'role-dps' },
    support: { text: 'Support', class: 'role-support' },
    healer: { text: 'Healer', class: 'role-healer' },
    utility: { text: 'Utility', class: 'role-utility' },
    balanced: { text: 'Balanced', class: 'role-balanced' }
  };

  return roleData[role.toLowerCase()] || { text: role, class: 'role-unknown' };
}

/**
 * Formats time duration in human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(seconds) {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Formats date in localized format
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return 'N/A';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
}

/**
 * Formats file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size string
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  if (isNaN(bytes) || !isFinite(bytes)) return 'N/A';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (bytes / Math.pow(k, i)).toFixed(decimals) + ' ' + sizes[i];
}

/**
 * Formats build tags for display
 * @param {Array<string>} tags - Array of tag strings
 * @returns {string} Formatted tags string
 */
export function formatTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return '';
  }

  return tags
    .filter(tag => tag && tag.trim())
    .map(tag => tag.trim())
    .join(', ');
}

/**
 * Formats weapon evolution stage
 * @param {string} stage - Evolution stage
 * @param {string} weaponName - Weapon name
 * @returns {string} Formatted stage string
 */
export function formatWeaponStage(stage, weaponName) {
  const stageMap = {
    stage1: weaponName,
    stage2: `${weaponName}+`,
    stage3: `${weaponName} EX`
  };

  return stageMap[stage] || weaponName;
}

/**
 * Formats completion percentage
 * @param {number} completed - Number of completed items
 * @param {number} total - Total number of items
 * @returns {Object} Object with percentage and formatted string
 */
export function formatCompletion(completed, total) {
  if (total === 0) {
    return { percentage: 0, text: '0%', class: 'completion-empty' };
  }

  const percentage = (completed / total) * 100;
  const roundedPercentage = Math.round(percentage);

  let completionClass = 'completion-low';
  if (roundedPercentage >= 100) {
    completionClass = 'completion-complete';
  } else if (roundedPercentage >= 75) {
    completionClass = 'completion-high';
  } else if (roundedPercentage >= 50) {
    completionClass = 'completion-medium';
  }

  return {
    percentage: roundedPercentage,
    text: `${roundedPercentage}%`,
    detail: `${completed}/${total}`,
    class: completionClass
  };
}

/**
 * Formats text for search highlighting
 * @param {string} text - Original text
 * @param {string} searchTerm - Term to highlight
 * @returns {string} Text with HTML highlighting
 */
export function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm || !text) return text;

  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, 'gi');

  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

/**
 * Formats attribute point distribution as a readable string
 * @param {Object} attributes - Attribute distribution object
 * @returns {string} Formatted attribute string
 */
export function formatAttributeDistribution(attributes) {
  if (!attributes) return 'No attributes assigned';

  const parts = [];
  for (const [attr, value] of Object.entries(attributes)) {
    if (value > 0) {
      const capitalizedAttr = attr.charAt(0).toUpperCase() + attr.slice(1);
      parts.push(`${capitalizedAttr}: ${value}`);
    }
  }

  return parts.length > 0 ? parts.join(' | ') : 'No attributes assigned';
}

/**
 * Formats synergy strength indicator
 * @param {number} strength - Synergy strength (0-10)
 * @returns {Object} Object with text, class, and description
 */
export function formatSynergyStrength(strength) {
  if (strength >= 9) {
    return { text: 'Perfect', class: 'synergy-perfect', description: 'Outstanding synergy combination' };
  }
  if (strength >= 7) {
    return { text: 'Excellent', class: 'synergy-excellent', description: 'Very strong synergy effects' };
  }
  if (strength >= 5) {
    return { text: 'Good', class: 'synergy-good', description: 'Solid synergy benefits' };
  }
  if (strength >= 3) {
    return { text: 'Fair', class: 'synergy-fair', description: 'Minor synergy effects' };
  }
  if (strength >= 1) {
    return { text: 'Weak', class: 'synergy-weak', description: 'Limited synergy potential' };
  }

  return { text: 'None', class: 'synergy-none', description: 'No synergy effects' };
}

/**
 * Truncates text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Capitalizes first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Title case string
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, txt =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Converts camelCase to readable format
 * @param {string} camelStr - CamelCase string
 * @returns {string} Human readable string
 */
export function camelToReadable(camelStr) {
  if (!camelStr) return '';
  return camelStr
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}