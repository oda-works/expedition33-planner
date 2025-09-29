// Main application file for Expedition 33 Planner
import { dataManager } from './modules/data-manager.js';
import { storage } from './modules/storage.js';
import { router } from './utils/router.js';
import { navigation } from './components/navigation.js';
import { TABS, THEMES, FEATURES, SUCCESS_MESSAGES, ERROR_MESSAGES, KEYBOARD_KEYS } from './utils/constants.js';

/**
 * Main Application class
 */
class App {
  constructor() {
    this.currentRoute = 'characters';
    this.isLoading = true;
    this.settings = {};
    this.modules = {};
    this.router = router;
    this.navigation = navigation;

    // Bind methods to maintain context
    this.handleRouteChange = this.handleRouteChange.bind(this);
    this.handleThemeToggle = this.handleThemeToggle.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.showToast = this.showToast.bind(this);
    this.showModal = this.showModal.bind(this);
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('🚀 Starting app initialization...');

      // Show loading screen
      console.log('1. Showing loading screen...');
      this.showLoadingScreen();

      // Load user settings first
      console.log('2. Loading settings...');
      this.settings = storage.loadSettings();
      this.applySettings();
      console.log('✓ Settings loaded');

      // Load game data
      console.log('3. Loading game data...');
      await dataManager.loadAllData();
      console.log('✓ Game data loaded');

      // Initialize modules
      console.log('4. Initializing modules...');
      await this.initializeModules();
      console.log('✓ Modules initialized');

      // Initialize router
      console.log('5. Initializing router...');
      this.setupRoutes();
      this.router.init();
      console.log('✓ Router initialized');

      // Set up event listeners
      console.log('6. Setting up event listeners...');
      this.setupEventListeners();
      console.log('✓ Event listeners set up');

      // Register service worker
      console.log('7. Registering service worker...');
      this.registerServiceWorker();
      console.log('✓ Service worker registered');

      // Hide loading screen and show app FIRST
      console.log('8. Hiding loading screen...');
      this.hideLoadingScreen();
      console.log('✓ Loading screen hidden');

      // THEN initialize navigation after DOM is visible and ready
      console.log('9. Initializing navigation...');
      // Small delay to ensure DOM is fully ready
      setTimeout(() => {
        this.navigation.init();
        console.log('✓ Navigation initialized');
      }, 200);

      console.log('🎉 Expedition 33 Planner initialized successfully');
    } catch (error) {
      console.error('💥 Failed to initialize app:', error);
      console.error('Stack trace:', error.stack);
      this.showInitializationError(error);
    }
  }

  /**
   * Show loading screen
   */
  showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const appContainer = document.getElementById('app');

    if (loadingScreen) loadingScreen.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
  }

  /**
   * Hide loading screen and show app
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const appContainer = document.getElementById('app');

    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
    if (appContainer) {
      appContainer.style.display = 'block';
      // Trigger animation
      setTimeout(() => {
        appContainer.classList.add('loaded');
      }, 100);
    }

    this.isLoading = false;
  }

  /**
   * Initialize all application modules
   */
  async initializeModules() {
    try {
      // Import only the modules that exist
      const modulePromises = [];

      // Core modules
      modulePromises.push(import('./modules/character-builder.js'));

      // Try to import optional modules, but continue if they fail
      const optionalModules = [
        'pictos-manager',
        'party-composer',
        'collectibles-tracker',
        'map-manager',
        'damage-calculator',
        'boss-tracker',
        'build-comparison',
        'party-synergy',
        'build-guides',
        'team-optimizer',
        'achievement-tracker'
      ];

      const importResults = await Promise.allSettled([
        ...modulePromises,
        ...optionalModules.map(module =>
          import(`./modules/${module}.js`).catch(err => {
            console.warn(`Optional module ${module} not found:`, err);
            return null;
          })
        )
      ]);

      // Initialize available modules
      const modules = importResults
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);

      // Initialize character builder (required)
      if (modules[0] && modules[0].CharacterBuilder) {
        this.modules.characterBuilder = new modules[0].CharacterBuilder(dataManager, storage);
        await this.modules.characterBuilder.init();
        console.log('✓ Character builder initialized');
      }

      // Initialize optional modules
      modules.slice(1).forEach((module, index) => {
        const moduleName = optionalModules[index];
        const ModuleClass = Object.values(module || {})[0];

        if (ModuleClass && typeof ModuleClass === 'function') {
          try {
            this.modules[moduleName] = new ModuleClass(dataManager, storage);
            if (this.modules[moduleName].init) {
              this.modules[moduleName].init();
            }
            console.log(`✓ ${moduleName} initialized`);
          } catch (error) {
            console.warn(`Failed to initialize ${moduleName}:`, error);
          }
        }
      });

    } catch (error) {
      console.error('Failed to initialize modules:', error);
      throw error;
    }
  }

  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    // Tab navigation
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      tab.addEventListener('click', this.handleTabChange);
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', this.handleThemeToggle);
    }

    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.showSettingsModal());
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', this.handleKeydown);

    // Modal overlay clicks
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.hideModal();
        }
      });
    }

    // Modal close button
    const modalClose = document.querySelector('.modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', () => this.hideModal());
    }

    // Window events
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

    // Handle visibility changes for performance
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Handle resize events
    window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 150));

    // Handle online/offline status
    window.addEventListener('online', () => this.showToast('Connection restored', 'success'));
    window.addEventListener('offline', () => this.showToast('Working offline', 'warning'));
  }

  /**
   * Handle route change events
   * @param {CustomEvent} event - Route change event
   */
  handleRouteChange(event) {
    console.log('Route changed:', event.detail);
    this.currentRoute = event.detail.path;
  }

  /**
   * Set up application routes
   */
  setupRoutes() {
    // Register all routes with their handlers
    this.router.addRoute('characters', (path) => this.showRoute(path), {
      title: 'Character Builder',
      category: 'build-tools'
    });

    this.router.addRoute('pictos', (path) => this.showRoute(path), {
      title: 'Pictos & Lumina',
      category: 'build-tools'
    });

    this.router.addRoute('calculator', (path) => this.showRoute(path), {
      title: 'Damage Calculator',
      category: 'build-tools'
    });

    this.router.addRoute('party', (path) => this.showRoute(path), {
      title: 'Party Composer',
      category: 'team-management'
    });

    this.router.addRoute('optimizer', (path) => this.showRoute(path), {
      title: 'Team Optimizer',
      category: 'team-management'
    });

    this.router.addRoute('comparison', (path) => this.showRoute(path), {
      title: 'Build Comparison',
      category: 'team-management'
    });

    this.router.addRoute('collectibles', (path) => this.showRoute(path), {
      title: 'Collectibles Tracker',
      category: 'progress-tracking'
    });

    this.router.addRoute('bosses', (path) => this.showRoute(path), {
      title: 'Boss Tracker',
      category: 'progress-tracking'
    });

    this.router.addRoute('achievements', (path) => this.showRoute(path), {
      title: 'Achievement Tracker',
      category: 'progress-tracking'
    });

    this.router.addRoute('guides', (path) => this.showRoute(path), {
      title: 'Build Guides',
      category: 'resources'
    });

    this.router.addRoute('builds', (path) => this.showRoute(path), {
      title: 'Saved Builds',
      category: 'resources'
    });
  }

  /**
   * Show a specific route/tab
   * @param {string} path - Route path
   */
  showRoute(path) {
    console.log(`Navigating to route: ${path}`);

    // Update current route
    this.currentRoute = path;

    // Update tab content visibility
    this.updateTabContent(path);

    // Special handling for specific routes (includes module activation)
    this.handleRouteSpecifics(path);
  }

  /**
   * Update tab content visibility
   * @param {string} path - Active route path
   */
  updateTabContent(path) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      content.classList.remove('active');
    });

    // Show active tab content
    const activeContent = document.getElementById(`${path}-tab`);
    if (activeContent) {
      activeContent.classList.add('active');
    }
  }

  /**
   * Handle route-specific logic
   * @param {string} path - Route path
   */
  handleRouteSpecifics(path) {
    // Map route paths to module names
    const moduleMap = {
      'characters': 'characterBuilder',
      'pictos': 'pictos-manager',
      'party': 'party-composer',
      'collectibles': 'collectibles-tracker',
      'calculator': 'damage-calculator',
      'bosses': 'boss-tracker',
      'comparison': 'build-comparison',
      'guides': 'build-guides',
      'optimizer': 'team-optimizer',
      'achievements': 'achievement-tracker'
      // 'builds' route doesn't have a dedicated module - it's handled in the HTML
    };

    const moduleName = moduleMap[path];

    if (moduleName) {
      const module = this.modules[moduleName];

      if (module) {
        console.log(`Activating module: ${moduleName}`);

        // Call onActivate first (which typically calls refresh)
        if (module.onActivate) {
          module.onActivate();
        } else if (module.refresh) {
          // Fallback to refresh if onActivate doesn't exist
          module.refresh();
        }
      } else {
        console.warn(`Module not found: ${moduleName} for route: ${path}`);
        console.log('Available modules:', Object.keys(this.modules));
      }
    } else {
      console.log(`Route ${path} has no associated module (static content)`);
    }
  }

  /**
   * Handle theme toggle
   */
  handleThemeToggle() {
    const currentTheme = this.settings.theme || THEMES.DARK;
    const themeOrder = [THEMES.DARK, THEMES.LIGHT, THEMES.SEPIA, THEMES.HIGH_CONTRAST];
    const currentIndex = themeOrder.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const newTheme = themeOrder[nextIndex];

    this.setTheme(newTheme);
  }

  /**
   * Set application theme
   * @param {string} theme - Theme identifier
   */
  setTheme(theme) {
    const body = document.body;

    // Remove all theme classes
    Object.values(THEMES).forEach(themeClass => {
      body.classList.remove(themeClass);
    });

    // Add new theme class
    body.classList.add(theme);

    // Update settings
    this.settings.theme = theme;
    storage.saveSettings(this.settings);

    // Update theme toggle icon
    this.updateThemeIcon(theme);
  }

  /**
   * Update theme toggle icon
   * @param {string} theme - Current theme
   */
  updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const icon = themeToggle.querySelector('.icon-theme');
    if (icon) {
      // Icon content is handled by CSS based on theme class
      icon.setAttribute('title', this.getThemeName(theme));
    }
  }

  /**
   * Get human-readable theme name
   * @param {string} theme - Theme identifier
   * @returns {string} Human-readable theme name
   */
  getThemeName(theme) {
    const names = {
      [THEMES.DARK]: 'Dark Theme',
      [THEMES.LIGHT]: 'Light Theme',
      [THEMES.SEPIA]: 'Sepia Theme',
      [THEMES.HIGH_CONTRAST]: 'High Contrast Theme'
    };
    return names[theme] || 'Unknown Theme';
  }

  /**
   * Apply loaded settings
   */
  applySettings() {
    // Apply theme
    if (this.settings.theme) {
      this.setTheme(this.settings.theme);
    }

    // Apply animation preferences
    if (this.settings.animations === false || FEATURES.REDUCED_MOTION) {
      document.body.classList.add('reduce-motion');
    }

    // Apply compact mode
    if (this.settings.compactMode) {
      document.body.classList.add('compact-mode');
    }
  }

  /**
   * Handle global keyboard shortcuts
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeydown(event) {
    // Ignore if typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.key) {
      case KEYBOARD_KEYS.ESCAPE:
        if (this.isModalOpen()) {
          this.hideModal();
        }
        break;

      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          const tabIndex = parseInt(event.key) - 1;
          const tabs = [
            TABS.CHARACTERS,
            TABS.PICTOS,
            TABS.PARTY,
            TABS.COLLECTIBLES,
            TABS.CALCULATOR,
            TABS.BOSSES,
            TABS.COMPARISON,
            TABS.GUIDES,
            TABS.OPTIMIZER,
            TABS.ACHIEVEMENTS,
            TABS.BUILDS
          ];
          if (tabs[tabIndex]) {
            this.switchToTab(tabs[tabIndex]);
          }
        }
        break;

      case 't':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.handleThemeToggle();
        }
        break;
    }
  }

  /**
   * Show settings modal
   */
  showSettingsModal() {
    const modalContent = this.createSettingsModalContent();
    this.showModal('Settings', modalContent);
  }

  /**
   * Create settings modal content
   * @returns {HTMLElement} Settings modal content
   */
  createSettingsModalContent() {
    const content = document.createElement('div');
    content.className = 'settings-content';

    content.innerHTML = `
      <div class="setting-group">
        <label for="theme-select">Theme:</label>
        <select id="theme-select" class="setting-select">
          <option value="${THEMES.DARK}">Dark</option>
          <option value="${THEMES.LIGHT}">Light</option>
          <option value="${THEMES.SEPIA}">Sepia</option>
          <option value="${THEMES.HIGH_CONTRAST}">High Contrast</option>
        </select>
      </div>

      <div class="setting-group">
        <label>
          <input type="checkbox" id="auto-save" ${this.settings.autoSave ? 'checked' : ''}>
          Auto-save changes
        </label>
      </div>

      <div class="setting-group">
        <label>
          <input type="checkbox" id="show-spoilers" ${this.settings.showSpoilers ? 'checked' : ''}>
          Show spoilers in collectibles
        </label>
      </div>

      <div class="setting-group">
        <label>
          <input type="checkbox" id="show-hints" ${this.settings.showHints ? 'checked' : ''}>
          Show location hints
        </label>
      </div>

      <div class="setting-group">
        <label>
          <input type="checkbox" id="compact-mode" ${this.settings.compactMode ? 'checked' : ''}>
          Compact mode
        </label>
      </div>

      <div class="setting-group">
        <label>
          <input type="checkbox" id="animations" ${this.settings.animations !== false ? 'checked' : ''}>
          Enable animations
        </label>
      </div>
    `;

    // Set current theme in select
    const themeSelect = content.querySelector('#theme-select');
    if (themeSelect) {
      themeSelect.value = this.settings.theme || THEMES.DARK;
    }

    // Add event listeners
    this.setupSettingsEventListeners(content);

    return content;
  }

  /**
   * Set up event listeners for settings modal
   * @param {HTMLElement} content - Settings content element
   */
  setupSettingsEventListeners(content) {
    const themeSelect = content.querySelector('#theme-select');
    const autoSave = content.querySelector('#auto-save');
    const showSpoilers = content.querySelector('#show-spoilers');
    const showHints = content.querySelector('#show-hints');
    const compactMode = content.querySelector('#compact-mode');
    const animations = content.querySelector('#animations');

    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        this.setTheme(e.target.value);
      });
    }

    [autoSave, showSpoilers, showHints, compactMode, animations].forEach(checkbox => {
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          const setting = e.target.id.replace('-', '');
          this.settings[setting] = e.target.checked;

          // Apply setting immediately
          if (setting === 'compactMode') {
            document.body.classList.toggle('compact-mode', e.target.checked);
          } else if (setting === 'animations') {
            document.body.classList.toggle('reduce-motion', !e.target.checked);
          }

          storage.saveSettings(this.settings);
        });
      }
    });
  }

  /**
   * Show a modal dialog
   * @param {string} title - Modal title
   * @param {HTMLElement|string} content - Modal content
   * @param {Object} options - Modal options
   */
  showModal(title, content, options = {}) {
    const modal = document.querySelector('.modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = modal.querySelector('.modal-title');
    const modalBody = modal.querySelector('.modal-body');
    const modalFooter = modal.querySelector('.modal-footer');

    if (!modal || !modalOverlay) return;

    // Set title
    if (modalTitle) modalTitle.textContent = title;

    // Set content
    if (modalBody) {
      if (typeof content === 'string') {
        modalBody.innerHTML = content;
      } else {
        modalBody.innerHTML = '';
        modalBody.appendChild(content);
      }
    }

    // Configure footer
    if (modalFooter && options.showFooter !== false) {
      modalFooter.style.display = 'flex';

      const cancelBtn = modalFooter.querySelector('.modal-cancel');
      const confirmBtn = modalFooter.querySelector('.modal-confirm');

      if (cancelBtn) {
        cancelBtn.textContent = options.cancelText || 'Cancel';
        cancelBtn.onclick = () => {
          if (options.onCancel) options.onCancel();
          this.hideModal();
        };
      }

      if (confirmBtn) {
        confirmBtn.textContent = options.confirmText || 'OK';
        confirmBtn.onclick = () => {
          if (options.onConfirm) options.onConfirm();
          if (options.closeOnConfirm !== false) this.hideModal();
        };
      }
    } else {
      modalFooter.style.display = 'none';
    }

    // Show modal
    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');

    // Focus management
    modal.focus();
  }

  /**
   * Hide modal dialog
   */
  hideModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      modalOverlay.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Check if modal is open
   * @returns {boolean} True if modal is open
   */
  isModalOpen() {
    const modalOverlay = document.getElementById('modal-overlay');
    return modalOverlay?.classList.contains('active') || false;
  }

  /**
   * Show toast notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, warning, error, info)
   * @param {number} duration - Duration in milliseconds
   */
  showToast(message, type = 'info', duration = 4000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('removing');
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }, duration);
  }

  /**
   * Show initialization error
   * @param {Error} error - Error object
   */
  showInitializationError(error) {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="error-message">
          <h2>Failed to Load Application</h2>
          <p>${error.message || 'An unknown error occurred'}</p>
          <button onclick="location.reload()" class="btn-primary">Reload Page</button>
        </div>
      `;
    }
  }

  /**
   * Register service worker for offline functionality
   */
  async registerServiceWorker() {
    if (!FEATURES.SERVICE_WORKER) {
      console.log('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js');
      console.log('Service Worker registered:', registration);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showToast('App update available! Reload to apply.', 'info', 10000);
          }
        });
      });
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }

  /**
   * Handle before unload event
   * @param {Event} event - Before unload event
   */
  handleBeforeUnload(event) {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return event.returnValue;
    }
  }

  /**
   * Handle visibility change event
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Page is now hidden - pause non-essential operations
      this.pauseOperations();
    } else {
      // Page is now visible - resume operations
      this.resumeOperations();
    }
  }

  /**
   * Handle window resize event
   */
  handleResize() {
    // Notify modules about resize
    Object.values(this.modules).forEach(module => {
      if (module.onResize) {
        module.onResize();
      }
    });
  }

  /**
   * Check if there are unsaved changes
   * @returns {boolean} True if there are unsaved changes
   */
  hasUnsavedChanges() {
    // Check with all modules for unsaved changes
    return Object.values(this.modules).some(module =>
      module.hasUnsavedChanges && module.hasUnsavedChanges()
    );
  }

  /**
   * Pause non-essential operations
   */
  pauseOperations() {
    // Pause animations, auto-saves, etc.
    Object.values(this.modules).forEach(module => {
      if (module.pause) {
        module.pause();
      }
    });
  }

  /**
   * Resume operations
   */
  resumeOperations() {
    Object.values(this.modules).forEach(module => {
      if (module.resume) {
        module.resume();
      }
    });
  }

  /**
   * Debounce utility function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOM Content Loaded - starting app...');
  try {
    const app = new App();
    console.log('✓ App instance created');

    app.init().catch(error => {
      console.error('💥 Fatal error during app initialization:', error);
      console.error('Full error:', error);
    });

    // Make app globally accessible for debugging
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      window.app = app;
      console.log('✓ App made globally accessible');
    }
  } catch (error) {
    console.error('💥 Error creating app instance:', error);
  }
});