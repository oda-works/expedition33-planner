// Constants for Expedition 33 Planner
export const APP_CONFIG = {
  VERSION: '1.0.0',
  STORAGE_KEY: 'expedition33_planner',
  STORAGE_VERSION: '1.0.0',
  MAX_LEVEL: 50,
  MAX_LEVEL_NG_PLUS: 99,
  MAX_ATTRIBUTE_POINTS: 200,
  MAX_LUMINA_POINTS: 22,
  MAX_LUMINA_POINTS_NG_PLUS: 35
};

export const GAME_CONSTANTS = {
  CHARACTER_COUNT: 6,
  ACTIVE_PARTY_SIZE: 3,
  RESERVE_PARTY_SIZE: 3,
  MAX_PICTOS_EQUIPPED: 3,
  EXPEDITION_COUNT: 33,
  JOURNAL_COUNT: 49,
  MUSIC_RECORD_COUNT: 33,
  PICTOS_COUNT: 193,
  GESTRAL_COUNT: 5,
  ESQUIE_ROCK_COUNT: 3,
  WHITE_NEVRON_COUNT: 12,
  PAINT_CAGE_COUNT: 25
};

export const ATTRIBUTES = {
  VITALITY: 'vitality',
  AGILITY: 'agility',
  DEFENSE: 'defense',
  LUCK: 'luck'
};

export const STATS = {
  HP: 'hp',
  ATTACK: 'attack',
  DEFENSE: 'defense',
  SPEED: 'speed',
  CRIT_RATE: 'critRate',
  CRIT_DAMAGE: 'critDamage'
};

export const PICTOS_TYPES = {
  OFFENSIVE: 'offensive',
  DEFENSIVE: 'defensive',
  SUPPORT: 'support'
};

export const RARITIES = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHIC: 'mythic'
};

export const LUMINA_COLORS = {
  RED: 'red',
  BLUE: 'blue',
  GREEN: 'green',
  YELLOW: 'yellow',
  PURPLE: 'purple',
  ORANGE: 'orange',
  CYAN: 'cyan',
  PINK: 'pink',
  WHITE: 'white',
  BLACK: 'black',
  GOLD: 'gold',
  SILVER: 'silver',
  RAINBOW: 'rainbow',
  VOID: 'void',
  CRYSTAL: 'crystal'
};

export const COLLECTIBLE_CATEGORIES = {
  JOURNALS: 'journals',
  RECORDS: 'records',
  GESTRALS: 'gestrals',
  ESQUIE_ROCKS: 'esquie_rocks',
  WHITE_NEVRON: 'white_nevron',
  PAINT_CAGES: 'paint_cages'
};

export const TABS = {
  CHARACTERS: 'characters',
  PICTOS: 'pictos',
  PARTY: 'party',
  COLLECTIBLES: 'collectibles',
  BUILDS: 'builds'
};

export const THEMES = {
  DARK: 'theme-dark',
  LIGHT: 'theme-light',
  HIGH_CONTRAST: 'theme-high-contrast',
  SEPIA: 'theme-sepia'
};

export const ROLES = {
  TANK: 'tank',
  DPS: 'dps',
  SUPPORT: 'support',
  HEALER: 'healer',
  UTILITY: 'utility',
  BALANCED: 'balanced'
};

export const ELEMENTS = {
  NEUTRAL: 'neutral',
  FIRE: 'fire',
  WATER: 'water',
  EARTH: 'earth',
  AIR: 'air',
  LIGHT: 'light',
  SHADOW: 'shadow',
  ELECTRIC: 'electric',
  PAINT: 'paint'
};

export const WEAPON_EVOLUTION_STAGES = {
  STAGE_1: 'stage1',
  STAGE_2: 'stage2',
  STAGE_3: 'stage3'
};

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info'
};

export const KEYBOARD_KEYS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight'
};

export const ARIA_LABELS = {
  LOADING: 'Loading application data',
  SEARCH: 'Search items',
  FILTER: 'Filter by type',
  TOGGLE_THEME: 'Toggle theme',
  OPEN_SETTINGS: 'Open settings',
  CLOSE_MODAL: 'Close dialog',
  CHARACTER_SELECT: 'Select character',
  BUILD_SAVE: 'Save current build',
  BUILD_RESET: 'Reset build to defaults'
};

export const ERROR_MESSAGES = {
  STORAGE_UNAVAILABLE: 'Local storage is not available. Your data may not be saved.',
  STORAGE_QUOTA_EXCEEDED: 'Storage quota exceeded. Please clear some data.',
  DATA_LOAD_FAILED: 'Failed to load game data. Please refresh the page.',
  CHARACTER_NOT_FOUND: 'Character data not found.',
  INVALID_BUILD_DATA: 'Invalid build data format.',
  EXPORT_FAILED: 'Failed to export data.',
  IMPORT_FAILED: 'Failed to import data.',
  INVALID_FILE_FORMAT: 'Invalid file format.',
  NETWORK_ERROR: 'Network error occurred.'
};

export const SUCCESS_MESSAGES = {
  BUILD_SAVED: 'Build saved successfully!',
  BUILD_LOADED: 'Build loaded successfully!',
  DATA_EXPORTED: 'Data exported successfully!',
  DATA_IMPORTED: 'Data imported successfully!',
  SETTINGS_SAVED: 'Settings saved!',
  COLLECTIBLE_MARKED: 'Progress updated!'
};

export const VALIDATION_RULES = {
  CHARACTER_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9\s\-_]+$/
  },
  BUILD_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z0-9\s\-_.,!?]+$/
  },
  LEVEL: {
    MIN: 1,
    MAX: 50,
    MAX_NG_PLUS: 99
  },
  ATTRIBUTE_POINTS: {
    MIN: 0,
    MAX_PER_STAT: 99,
    MAX_TOTAL: 200
  },
  LUMINA_POINTS: {
    MIN: 0,
    MAX: 22,
    MAX_NG_PLUS: 35
  }
};

export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000
};

export const BREAKPOINTS = {
  MOBILE_SMALL: 480,
  MOBILE_LARGE: 768,
  TABLET: 1024,
  DESKTOP: 1440,
  DESKTOP_LARGE: 1920
};

export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  CALCULATION: 100,
  SAVE: 1000,
  RESIZE: 150
};

// Feature flags for progressive enhancement
export const FEATURES = {
  SERVICE_WORKER: 'serviceWorker' in navigator,
  LOCAL_STORAGE: (() => {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  })(),
  WEBP_SUPPORT: (() => {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('webp') !== -1;
  })(),
  TOUCH_SUPPORT: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  REDUCED_MOTION: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

// URLs for external resources
export const URLS = {
  GITHUB_REPO: 'https://github.com/expedition33/planner',
  GAME_OFFICIAL: 'https://www.sandfall-interactive.com/clair-obscur-expedition-33',
  BUG_REPORT: 'https://github.com/expedition33/planner/issues',
  DOCUMENTATION: 'https://expedition33.github.io/planner/docs'
};

// Default values for various systems
export const DEFAULTS = {
  THEME: THEMES.DARK,
  CHARACTER_LEVEL: 1,
  ATTRIBUTE_DISTRIBUTION: {
    [ATTRIBUTES.VITALITY]: 0,
    [ATTRIBUTES.AGILITY]: 0,
    [ATTRIBUTES.DEFENSE]: 0,
    [ATTRIBUTES.LUCK]: 0
  },
  PARTY_FORMATION: {
    active: [null, null, null],
    reserve: [null, null, null]
  },
  SETTINGS: {
    theme: THEMES.DARK,
    autoSave: true,
    showSpoilers: false,
    showHints: true,
    compactMode: false,
    soundEffects: true,
    animations: true
  }
};