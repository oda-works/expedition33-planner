// Main application file for Expedition 33 Planner
import { dataManager } from './modules/data-manager.js';
import { storage } from './modules/storage.js';
import { TABS, THEMES, FEATURES, SUCCESS_MESSAGES, ERROR_MESSAGES, KEYBOARD_KEYS } from './utils/constants.js';

/**
 * Main Application class
 */
class App {
  constructor() {
    this.currentTab = TABS.CHARACTERS;
    this.isLoading = true;
    this.settings = {};
    this.modules = {};

    // Bind methods to maintain context
    this.handleTabChange = this.handleTabChange.bind(this);
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

      // Set up event listeners
      console.log('5. Setting up event listeners...');
      this.setupEventListeners();
      console.log('✓ Event listeners set up');

      // Register service worker
      console.log('6. Registering service worker...');
      this.registerServiceWorker();
      console.log('✓ Service worker registered');

      // Hide loading screen and show app
      console.log('7. Hiding loading screen...');
      this.hideLoadingScreen();
      console.log('✓ Loading screen hidden');

      // Initialize default tab
      console.log('8. Initializing default tab...');
      this.switchToTab(this.currentTab);
      console.log('✓ Default tab initialized');

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
      // Dynamically import modules to reduce initial bundle size
      const [
        { CharacterBuilder },
        { PictosManager },
        { PartyComposer },
        { CollectiblesTracker }
      ] = await Promise.all([
        import('./modules/character-builder.js'),
        import('./modules/pictos-manager.js'),
        import('./modules/party-composer.js'),
        import('./modules/collectibles-tracker.js')
      ]);

      // Initialize modules
      this.modules.characterBuilder = new CharacterBuilder(dataManager, storage);
      this.modules.pictosManager = new PictosManager(dataManager, storage);
      this.modules.partyComposer = new PartyComposer(dataManager, storage);
      this.modules.collectiblesTracker = new CollectiblesTracker(dataManager, storage);

      // Initialize each module
      await Promise.all([
        this.modules.characterBuilder.init(),
        this.modules.pictosManager.init(),
        this.modules.partyComposer.init(),
        this.modules.collectiblesTracker.init()
      ]);

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
   * Handle tab change
   * @param {Event} event - Click event
   */
  handleTabChange(event) {
    const tab = event.target;
    const tabId = tab.dataset.tab;

    if (tabId && tabId !== this.currentTab) {
      this.switchToTab(tabId);
    }
  }

  /**
   * Switch to a specific tab
   * @param {string} tabId - Tab identifier
   */
  switchToTab(tabId) {
    // Update tab buttons
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      const isActive = tab.dataset.tab === tabId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive.toString());
    });

    // Update tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabId}-tab`);
    });

    // Update current tab
    this.currentTab = tabId;

    // Notify relevant module about activation
    if (this.modules[tabId]) {
      this.modules[tabId].onActivate?.();
    }

    // Special handling for specific tabs
    switch (tabId) {
      case TABS.CHARACTERS:
        this.modules.characterBuilder?.refresh();
        break;
      case TABS.PICTOS:
        this.modules.pictosManager?.refresh();
        break;
      case TABS.PARTY:
        this.modules.partyComposer?.refresh();
        break;
      case TABS.COLLECTIBLES:
        this.modules.collectiblesTracker?.refresh();
        break;
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
          const tabs = [TABS.CHARACTERS, TABS.PICTOS, TABS.PARTY, TABS.COLLECTIBLES, TABS.BUILDS];
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